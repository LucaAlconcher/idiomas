import { prisma } from "@/lib/prisma";

function daysBetween(a: Date, b: Date): number {
  const startOfA = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const startOfB = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((startOfB.getTime() - startOfA.getTime()) / (1000 * 60 * 60 * 24));
}

export async function recordExerciseAttempt(params: {
  userId: string;
  languageCode: string;
  exerciseId: string;
  sourceText: string;
  question: string;
  userAnswer: string;
  correct: boolean;
}) {
  await prisma.exerciseAttempt.create({
    data: {
      userId: params.userId,
      languageCode: params.languageCode,
      exerciseId: params.exerciseId,
      sourceText: params.sourceText.slice(0, 5000),
      question: params.question,
      userAnswer: params.userAnswer,
      correct: params.correct,
    },
  });

  const existing = await prisma.progress.findUnique({
    where: {
      userId_languageCode: {
        userId: params.userId,
        languageCode: params.languageCode,
      },
    },
  });

  const now = new Date();
  let streak = 1;

  if (existing?.lastStudiedAt) {
    const diff = daysBetween(existing.lastStudiedAt, now);
    if (diff === 0) streak = existing.streak;
    else if (diff === 1) streak = existing.streak + 1;
    else streak = 1;
  }

  return prisma.progress.upsert({
    where: {
      userId_languageCode: {
        userId: params.userId,
        languageCode: params.languageCode,
      },
    },
    create: {
      userId: params.userId,
      languageCode: params.languageCode,
      exercisesCompleted: 1,
      correctCount: params.correct ? 1 : 0,
      streak: 1,
      lastStudiedAt: now,
    },
    update: {
      exercisesCompleted: { increment: 1 },
      correctCount: params.correct ? { increment: 1 } : undefined,
      streak,
      lastStudiedAt: now,
    },
  });
}
