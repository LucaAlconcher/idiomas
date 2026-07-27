import { NextResponse } from "next/server";
import { z } from "zod";
import { getLanguage } from "@/lib/languages";
import { generateExercisesWithGemini } from "@/lib/gemini";
import { generateTemplateExercises } from "@/lib/exercises/templates";
import type { ExerciseSet } from "@/lib/exercises/types";

const bodySchema = z.object({
  languageCode: z.string(),
  text: z.string().min(20),
  sourceTitle: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { languageCode, text, sourceTitle, level } = parsed.data;
  const language = getLanguage(languageCode);
  if (!language) {
    return NextResponse.json({ error: "Idioma no soportado" }, { status: 404 });
  }

  const geminiQuestions = await generateExercisesWithGemini({
    text,
    languageName: language.name,
    level,
  });

  const questions = geminiQuestions
    ? geminiQuestions.map((question, index) => ({ ...question, id: `gemini-${index}` }))
    : generateTemplateExercises(text);

  const exerciseSet: ExerciseSet = {
    id: crypto.randomUUID(),
    languageCode,
    sourceText: text,
    sourceTitle,
    questions,
    generatedBy: geminiQuestions ? "gemini" : "template",
  };

  return NextResponse.json({ exerciseSet });
}
