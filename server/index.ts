import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import { parseResult, DEFAULT_MODEL, FALLBACK_MODEL, AUDIO_MIME, Meta } from '../src/shared/lecture';
import { buildLectureSystemPrompt, responseSchema } from '../src/constants/geminiPrompt';

const app = express();
app.use(cors());
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/process-lecture', express.raw({ type: '*/*', limit: '200mb' }), async (req, res) => {
  if (process.env.API_SECRET && req.header('x-api-secret') !== process.env.API_SECRET)
    return res.status(401).json({ error: 'Unauthorized' });
  const tmp = path.join(os.tmpdir(), `lecture-${Date.now()}.m4a`);
  let uploaded: string | undefined;
  try {
    const meta: Meta = JSON.parse(decodeURIComponent(req.header('x-meta') || '%7B%7D'));
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'No audio received' });
    fs.writeFileSync(tmp, req.body);
    let file = await ai.files.upload({ file: tmp, config: { mimeType: AUDIO_MIME } });
    uploaded = file.name;
    for (let i = 0; i < 120 && file.state === 'PROCESSING'; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      file = await ai.files.get({ name: file.name! });
    }
    if (file.state !== 'ACTIVE') throw new Error('Audio processing failed on Gemini');
    const requested = req.header('x-model') || process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const models = [requested, process.env.GEMINI_FALLBACK_MODEL || FALLBACK_MODEL].filter((m, i, a) => a.indexOf(m) === i);
    let lastErr: any;
    for (const model of models) {
      try {
        const out = await ai.models.generateContent({
          model,
          contents: createUserContent([createPartFromUri(file.uri!, file.mimeType!), 'Process the attached lecture recording and return the JSON.']),
          config: {
            systemInstruction: buildLectureSystemPrompt({ grade: meta.grade, subject: meta.subject, language: meta.language, questionCount: meta.extraQuestions, chapter: meta.chapter, batchTag: meta.batchTag }),
            responseMimeType: 'application/json', responseSchema, temperature: 0.2,
          },
        });
        return res.json(parseResult(out.text ?? ''));
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || 'Processing failed' });
  } finally {
    fs.rm(tmp, () => {});
    if (uploaded) ai.files.delete({ name: uploaded }).catch(() => {});
  }
});

app.listen(Number(process.env.PORT) || 8787, () => console.log('ClassNote AI backend up'));
