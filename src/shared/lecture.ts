export const DEFAULT_MODEL = 'gemini-3.8-flash';
export const FALLBACK_MODEL = 'gemini-3.5-flash-lite';
export const AUDIO_MIME = 'audio/mp4';

export type Meta = {
  grade: string; subject: string; language: 'English' | 'Hinglish';
  extraQuestions: 5 | 10 | 15; batchTag: string; chapter: string;
};

export interface LectureResult {
  handout: {
    title: string; subject: string; grade: string; summary_bullets: string[];
    key_concepts: { heading: string; explanation: string }[];
    formulas_and_rules: { name: string; expression: string; variables_explained: string }[];
    worked_examples: { problem: string; steps: string[]; final_answer: string }[];
    exam_traps: string[];
    diagram_svg?: string | null; diagram_caption?: string | null;
  };
  worksheet: {
    classroom_questions: { label: string; question: string; step_by_step_solution: string; final_answer: string }[];
    mcqs: { q_no: number; question: string; options: string[]; correct_option: string; explanation: string }[];
    short_answer: { q_no: number; question: string; answer: string; step_by_step_solution: string }[];
  };
  transcript_clean: string;
}

/** correct_option is a letter ("A"–"D"); falls back to matching option text. */
export function correctIndex(q: { options: string[]; correct_option: string }): number {
  const c = (q.correct_option || '').trim();
  if (/^[A-Da-d][).:]?$/.test(c)) return 'ABCD'.indexOf(c[0].toUpperCase());
  const i = q.options.findIndex((o) => o.trim().toLowerCase() === c.toLowerCase());
  return i >= 0 ? i : 'ABCD'.indexOf(c[0]?.toUpperCase() ?? '');
}

/** Fills missing arrays so older/partial results never crash the UI. */
export function normalizeResult(r: any): LectureResult {
  r.handout ??= {};
  const h = r.handout;
  h.title ??= 'Untitled lecture'; h.subject ??= ''; h.grade ??= '';
  for (const k of ['summary_bullets', 'key_concepts', 'formulas_and_rules', 'worked_examples', 'exam_traps']) h[k] ??= [];
  r.worksheet ??= {};
  for (const k of ['classroom_questions', 'mcqs', 'short_answer']) r.worksheet[k] ??= [];
  r.transcript_clean ??= '';
  return r as LectureResult;
}

export function parseResult(text: string): LectureResult {
  const clean = text.replace(/^```json\s*|^```\s*|```\s*$/gm, '').trim();
  return normalizeResult(JSON.parse(clean));
}
