"use client";

import { useState } from "react";
import { ReadAloud } from "@/components/ReadAloud";
import type { ExerciseSet } from "@/lib/exercises/types";
import type { DictionaryDefinition } from "@/lib/content-providers/dictionary";
import { btnPrimary, btnPrimarySm, card, cardAccent, badge, input as inputClass } from "@/lib/ui";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?¿¡"'`]/g, "");
}

function isCorrect(userAnswer: string, expected: string): boolean {
  const a = normalize(userAnswer);
  const b = normalize(expected);
  if (!a) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function ReadingWorkspace({
  languageCode,
  languageName,
  ttsLocale,
  text,
  sourceTitle,
}: {
  languageCode: string;
  languageName: string;
  ttsLocale: string;
  text: string;
  sourceTitle: string;
}) {
  const [exerciseSet, setExerciseSet] = useState<ExerciseSet | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean> | null>(null);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [loadingHint, setLoadingHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definitions, setDefinitions] = useState<DictionaryDefinition[] | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);

  async function lookupWord(word: string) {
    setSelectedWord(word);
    setDefinitions(null);
    setLoadingDefinition(true);
    try {
      const response = await fetch(
        `/api/dictionary/${languageCode}/${encodeURIComponent(word.toLowerCase())}`
      );
      if (response.ok) {
        const data = await response.json();
        setDefinitions(data.definitions);
      } else {
        setDefinitions([]);
      }
    } finally {
      setLoadingDefinition(false);
    }
  }

  async function generateExercises() {
    setLoadingExercises(true);
    setResults(null);
    setAnswers({});
    setHints({});

    try {
      const response = await fetch("/api/exercises/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageCode, text, sourceTitle }),
      });
      if (response.ok) {
        const data = await response.json();
        setExerciseSet(data.exerciseSet);
      }
    } finally {
      setLoadingExercises(false);
    }
  }

  async function requestHint(questionId: string, prompt: string) {
    setLoadingHint(questionId);
    try {
      const response = await fetch("/api/exercises/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageCode, question: prompt, sourceText: text }),
      });
      const data = await response.json();
      setHints((prev) => ({ ...prev, [questionId]: data.hint }));
    } finally {
      setLoadingHint(null);
    }
  }

  async function checkAnswers() {
    if (!exerciseSet) return;
    setSubmitting(true);

    const newResults: Record<string, boolean> = {};
    for (const question of exerciseSet.questions) {
      const userAnswer = answers[question.id] ?? "";
      newResults[question.id] = isCorrect(userAnswer, question.answer);
    }
    setResults(newResults);

    try {
      await Promise.all(
        exerciseSet.questions.map((question) =>
          fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              languageCode,
              exerciseId: exerciseSet.id,
              sourceText: text,
              question: question.prompt,
              userAnswer: answers[question.id] ?? "",
              correct: newResults[question.id],
            }),
          })
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  const correctCount = results
    ? Object.values(results).filter(Boolean).length
    : null;

  return (
    <div className="flex flex-col gap-8">
      <ReadAloud text={text} locale={ttsLocale} onWordClick={lookupWord} />

      {selectedWord && (
        <div className={`${card} relative p-4 pr-10 text-sm text-foreground`}>
          <button
            onClick={() => {
              setSelectedWord(null);
              setDefinitions(null);
            }}
            aria-label="Cerrar definición"
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-accent-soft hover:text-accent"
          >
            ✕
          </button>
          <p className="font-semibold text-accent">{selectedWord}</p>
          {loadingDefinition && <p className="mt-1 text-muted">Buscando definición...</p>}
          {!loadingDefinition && definitions && definitions.length === 0 && (
            <p className="mt-1 text-muted">Sin definiciones encontradas.</p>
          )}
          {!loadingDefinition &&
            definitions?.map((entry, index) => (
              <div key={index} className="mt-2">
                <p className="text-xs font-medium italic text-muted">{entry.partOfSpeech}</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {entry.definitions.slice(0, 3).map((def, defIndex) => (
                    <li key={defIndex}>{def}</li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}

      {!exerciseSet && (
        <button onClick={generateExercises} disabled={loadingExercises} className={`self-start ${btnPrimary}`}>
          {loadingExercises ? "Generando ejercicios..." : "✨ Generar ejercicios"}
        </button>
      )}

      {exerciseSet && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ejercicios de {languageName}</h2>
            <span className={badge}>
              {exerciseSet.generatedBy === "gemini" ? "Generado con IA" : "Ejercicios de plantilla"}
            </span>
          </div>

          {exerciseSet.questions.map((question, index) => (
            <div key={question.id} className={`${card} p-4`}>
              <p className="font-medium">
                {index + 1}. {question.prompt}
              </p>

              {question.options && question.options.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: option }))
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        answers[question.id] === option
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface hover:border-accent hover:text-accent"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[question.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                  }
                  placeholder="Tu respuesta"
                  className={`mt-3 ${inputClass}`}
                />
              )}

              {results && (
                <p
                  className={`mt-2 text-sm font-medium ${
                    results[question.id] ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {results[question.id]
                    ? "✓ Correcto"
                    : `✗ Incorrecto. Respuesta esperada: ${question.answer}`}
                </p>
              )}

              <div className="mt-3">
                <button
                  onClick={() => requestHint(question.id, question.prompt)}
                  disabled={loadingHint === question.id}
                  className="text-xs font-medium text-accent underline decoration-accent/40 underline-offset-2 disabled:opacity-50"
                >
                  {loadingHint === question.id ? "Pensando..." : "💡 Pedir ayuda"}
                </button>
                {hints[question.id] && (
                  <p className={`mt-2 ${cardAccent} p-2 text-xs text-foreground`}>{hints[question.id]}</p>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-4">
            <button onClick={checkAnswers} disabled={submitting} className={btnPrimarySm}>
              {submitting ? "Comprobando..." : "Comprobar respuestas"}
            </button>
            {correctCount !== null && (
              <span className="text-sm font-medium text-muted">
                {correctCount} / {exerciseSet.questions.length} correctas
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
