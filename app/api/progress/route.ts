import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { recordExerciseAttempt } from "@/lib/progress";

export async function GET() {
  const userId = await getCurrentUserId();

  const progress = await prisma.progress
    .findMany({
      where: { userId },
      include: { language: true },
    })
    .catch(() => []);

  return NextResponse.json({ progress });
}

const bodySchema = z.object({
  languageCode: z.string(),
  exerciseId: z.string(),
  sourceText: z.string(),
  question: z.string(),
  userAnswer: z.string(),
  correct: z.boolean(),
});

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const progress = await recordExerciseAttempt({
    userId,
    ...parsed.data,
  }).catch((error) => {
    console.warn(
      "[api/progress] No se pudo guardar el intento (¿falta configurar la base de datos?):",
      error instanceof Error ? error.message : error
    );
    return null;
  });

  return NextResponse.json({ progress });
}
