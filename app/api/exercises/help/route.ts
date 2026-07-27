import { NextResponse } from "next/server";
import { z } from "zod";
import { getLanguage } from "@/lib/languages";
import { generateHintWithGemini, isGeminiConfigured } from "@/lib/gemini";

const bodySchema = z.object({
  languageCode: z.string(),
  question: z.string().min(1),
  sourceText: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { languageCode, question, sourceText } = parsed.data;
  const language = getLanguage(languageCode);
  if (!language) {
    return NextResponse.json({ error: "Idioma no soportado" }, { status: 404 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json({
      hint: "Revisa el texto original: la respuesta suele estar cerca de palabras clave relacionadas con la pregunta. (Configura GEMINI_API_KEY para pistas generadas por IA.)",
    });
  }

  const hint = await generateHintWithGemini({
    question,
    sourceText,
    languageName: language.name,
  });

  return NextResponse.json({
    hint: hint ?? "No se pudo generar una pista en este momento. Intenta de nuevo.",
  });
}
