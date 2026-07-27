"use client";

import { useState } from "react";
import { ReadingWorkspace } from "@/components/ReadingWorkspace";
import { btnPrimary, btnGhost, card, input } from "@/lib/ui";

export function CustomTextWorkspace({
  languageCode,
  languageName,
  ttsLocale,
}: {
  languageCode: string;
  languageName: string;
  ttsLocale: string;
}) {
  const [draft, setDraft] = useState("");
  const [submittedText, setSubmittedText] = useState<string | null>(null);

  if (submittedText) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setSubmittedText(null)} className={`self-start ${btnGhost}`}>
          ← Escribir otro texto
        </button>
        <ReadingWorkspace
          languageCode={languageCode}
          languageName={languageName}
          ttsLocale={ttsLocale}
          text={submittedText}
          sourceTitle="Texto propio"
        />
      </div>
    );
  }

  return (
    <div className={`${card} flex flex-col gap-3 p-4`}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={`Pegá o escribí un texto en ${languageName}...`}
        rows={10}
        className={`${input} resize-y`}
      />
      <button
        onClick={() => setSubmittedText(draft.trim())}
        disabled={draft.trim().length < 20}
        className={`self-start ${btnPrimary}`}
      >
        Usar este texto
      </button>
      {draft.trim().length > 0 && draft.trim().length < 20 && (
        <p className="text-xs text-muted">Escribí al menos 20 caracteres.</p>
      )}
    </div>
  );
}
