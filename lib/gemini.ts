import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { exerciseQuestionSchema } from "@/lib/exercises/types";

const MODEL_NAME = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: MODEL_NAME });
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const exercisesResponseSchema = z.array(exerciseQuestionSchema).min(1).max(10);

export async function generateExercisesWithGemini(params: {
  text: string;
  languageName: string;
  level: string;
}): Promise<z.infer<typeof exercisesResponseSchema> | null> {
  const model = getModel();
  if (!model) return null;

  const prompt = `Eres un profesor de ${params.languageName}. A partir del siguiente texto, crea entre 4 y 6 ejercicios para un estudiante de nivel ${params.level}. Combina tipos: "multiple_choice" (con 3-4 "options" y una "answer" que sea exactamente una de las opciones), "fill_blank" (usa "___" en el "prompt" para el hueco, y "answer" con la palabra correcta) y "comprehension" (pregunta de comprensión sobre el texto, "answer" con la respuesta esperada, sin "options").

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, con este formato exacto:
[{"type": "multiple_choice" | "fill_blank" | "comprehension", "prompt": string, "options"?: string[], "answer": string}]

Texto:
"""
${params.text.slice(0, 4000)}
"""`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const raw = result.response.text();
    const parsed = JSON.parse(raw);
    const validated = exercisesResponseSchema.safeParse(parsed);
    if (!validated.success) return null;

    return validated.data;
  } catch {
    return null;
  }
}

export async function generateHintWithGemini(params: {
  question: string;
  sourceText: string;
  languageName: string;
}): Promise<string | null> {
  const model = getModel();
  if (!model) return null;

  const prompt = `Eres un profesor de ${params.languageName} ayudando a un estudiante con un ejercicio. NO reveles la respuesta correcta directamente. Da una pista breve (1-2 frases, en español) que lo guíe a razonar la respuesta, basándote en el contexto del texto.

Texto de referencia:
"""
${params.sourceText.slice(0, 2000)}
"""

Pregunta del ejercicio: "${params.question}"

Da solo la pista, sin introducciones.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const hint = result.response.text().trim();
    return hint.length > 0 ? hint : null;
  } catch {
    return null;
  }
}
