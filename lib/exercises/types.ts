import { z } from "zod";

export const exerciseQuestionSchema = z.object({
  type: z.enum(["multiple_choice", "fill_blank", "comprehension"]),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1),
});

export type ExerciseQuestion = z.infer<typeof exerciseQuestionSchema> & {
  id: string;
};

export type ExerciseSet = {
  id: string;
  languageCode: string;
  sourceText: string;
  sourceTitle?: string;
  questions: ExerciseQuestion[];
  generatedBy: "gemini" | "template";
};
