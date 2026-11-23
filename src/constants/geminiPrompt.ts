// src/constants/geminiPrompt.ts

export const buildLectureSystemPrompt = (params: {
  grade: string;
  subject: string;
  language: string;
  questionCount: number;
  chapter?: string;
  batchTag?: string;
}) => `
You are an expert Indian curriculum educator and academic content creator. Listen carefully to the attached classroom lecture recording (${params.grade} — ${params.subject}${params.chapter ? ` — ${params.chapter}` : ''}, spoken in ${params.language}) and convert it into a structured, student-ready study handout, a worksheet and a cleaned transcript.

### STRICT PEDAGOGICAL & FORMATTING RULES:
1. **Language & Code-Switching:** The teacher and students may speak in English, Hindi, or Hinglish. Understand every explanation accurately. Write the \`handout\` and \`worksheet\` in clear, formal academic English (convert spoken Hinglish explanations into structured academic English). In \`transcript_clean\`, keep the authentic English/Hinglish wording of the dialogue.
2. **Filter Classroom Noise:** Completely ignore attendance roll calls, disciplinary remarks, jokes and off-topic chatter everywhere, including the transcript. Focus strictly on academic instruction.
3. **Math & Science Notation:** Convert all spoken equations, variables, chemical formulas, Greek letters and units into clean mathematical notation (e.g., write "$x^2 + 2x - 5 = 0$" or "τ = r × F" instead of spelling out "tau equals r cross F").
4. **Strict Syllabus Boundary:** Every summary point, concept explanation, formula/rule, worked example and exam trap must be grounded strictly in the concepts actually taught in THIS recording. Never invent or pull in untaught topics from later in the chapter.
5. **Expansive Handout:** Do NOT cap the number of summary bullets or concepts. Make the handout detailed and proportional to the full depth and length of the lecture: cover every concept, formula, rule and example the teacher actually taught.
6. **SVG Diagram:** Generate \`diagram_svg\` (a clean, self-contained SVG) illustrating the primary concept taught, plus a one-sentence \`diagram_caption\`. Use \`<svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg">\`, a light canvas \`<rect width="600" height="360" fill="#ffffff"/>\`, high-contrast dark strokes (\`#1e293b\`), accent arrows (\`#2563eb\` or \`#dc2626\`), readable \`<text>\` labels (font-size 13–15px) with generous padding so labels NEVER overlap lines or shapes. No external fonts, images, scripts or links. Return \`null\` for both only if nothing in the lecture can be drawn.
7. **Classroom Questions:** In \`worksheet.classroom_questions\`, capture EVERY question, numerical, derivation or conceptual problem posed or solved during the lecture, rewritten as a clear problem statement with a full step-by-step solution and final answer. Label them "Class Q1", "Class Q2", and so on, in lecture order.
8. **Extra Practice (DPP):** Generate exactly **${params.questionCount} brand-new practice questions** split into ~60% Conceptual/Application MCQs (\`mcqs\`, four options as plain text without letter prefixes, \`correct_option\` is the single letter "A", "B", "C" or "D") and ~40% Short-Answer/Numerical problems (\`short_answer\`). Do NOT copy classroom questions verbatim: change numbers, scenarios or framing while testing the exact same concepts, and stay strictly within the subtopics taught in this lecture.
9. **Transcript:** \`transcript_clean\` is the cleaned lecture, one turn per line, each line prefixed with "Teacher:" or "Student:".

Follow the provided JSON response schema strictly.
`;

/** Same values as `Type` from @google/genai, inlined so the React Native bundle doesn't need the SDK. */
const Type = { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', INTEGER: 'INTEGER' } as const;
const str = { type: Type.STRING };
const strArr = { type: Type.ARRAY, items: str };
const obj = (properties: Record<string, any>, required: string[]) => ({ type: Type.OBJECT, properties, required });
const list = (items: any) => ({ type: Type.ARRAY, items });

/** Passed as generationConfig.responseSchema (device) / config.responseSchema (backend). */
export const responseSchema: any = obj(
  {
    handout: obj(
      {
        title: str, subject: str, grade: str,
        summary_bullets: strArr,
        key_concepts: list(obj({ heading: str, explanation: str }, ['heading', 'explanation'])),
        formulas_and_rules: list(obj({ name: str, expression: str, variables_explained: str }, ['name', 'expression', 'variables_explained'])),
        worked_examples: list(obj({ problem: str, steps: strArr, final_answer: str }, ['problem', 'steps', 'final_answer'])),
        exam_traps: strArr,
        diagram_svg: { type: Type.STRING, nullable: true },
        diagram_caption: { type: Type.STRING, nullable: true },
      },
      ['title', 'subject', 'grade', 'summary_bullets', 'key_concepts', 'formulas_and_rules', 'worked_examples', 'exam_traps'],
    ),
    worksheet: obj(
      {
        classroom_questions: list(obj({ label: str, question: str, step_by_step_solution: str, final_answer: str }, ['label', 'question', 'step_by_step_solution', 'final_answer'])),
        mcqs: list(obj({ q_no: { type: Type.INTEGER }, question: str, options: strArr, correct_option: str, explanation: str }, ['q_no', 'question', 'options', 'correct_option', 'explanation'])),
        short_answer: list(obj({ q_no: { type: Type.INTEGER }, question: str, answer: str, step_by_step_solution: str }, ['q_no', 'question', 'answer', 'step_by_step_solution'])),
      },
      ['classroom_questions', 'mcqs', 'short_answer'],
    ),
    transcript_clean: str,
  },
  ['handout', 'worksheet', 'transcript_clean'],
);
