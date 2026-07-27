import type { ExerciseQuestion } from "./types";

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 20 && sentence.length <= 220);
}

function pickBlankWord(sentence: string): string | null {
  const words = sentence.match(/[\p{L}]{4,}/gu);
  if (!words || words.length === 0) return null;
  return words[Math.floor(Math.random() * words.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Rule-based fallback used when Gemini is not configured or fails.
 * Builds fill-in-the-blank questions directly from real sentences in the source text.
 */
export function generateTemplateExercises(text: string): ExerciseQuestion[] {
  const sentences = splitSentences(text);
  const allWords = Array.from(new Set(text.match(/[\p{L}]{4,}/gu) ?? []));

  const questions: ExerciseQuestion[] = [];

  for (const sentence of sentences) {
    if (questions.length >= 5) break;

    const word = pickBlankWord(sentence);
    if (!word) continue;

    const prompt = sentence.replace(new RegExp(`\\b${word}\\b`), "___");
    if (prompt === sentence) continue;

    const distractors = shuffle(allWords.filter((w) => w.toLowerCase() !== word.toLowerCase())).slice(0, 3);

    questions.push({
      id: `template-${questions.length}`,
      type: "fill_blank",
      prompt,
      options: distractors.length === 3 ? shuffle([word, ...distractors]) : undefined,
      answer: word,
    });
  }

  return questions;
}
