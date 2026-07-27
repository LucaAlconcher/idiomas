"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReadAloud, tokenize } from "@/lib/tts";
import { btnPrimarySm, btnOutlineSm, card } from "@/lib/ui";

export function ReadAloud({
  text,
  locale,
  onWordClick,
}: {
  text: string;
  locale: string;
  onWordClick?: (word: string) => void;
}) {
  const { play, pause, resume, stop, isPlaying, isPaused, rate, setRate, charIndex } =
    useReadAloud(text, locale);

  const tokens = useMemo(() => tokenize(text), [text]);
  const currentWordRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isPlaying) {
      currentWordRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [charIndex, isPlaying]);

  return (
    <div className="flex flex-col gap-4">
      <div className={`${card} flex flex-wrap items-center gap-3 px-4 py-3`}>
        {!isPlaying && (
          <button onClick={play} className={btnPrimarySm}>
            ▶ Leer en voz alta
          </button>
        )}
        {isPlaying && !isPaused && (
          <button onClick={pause} className={btnPrimarySm}>
            ⏸ Pausar
          </button>
        )}
        {isPlaying && isPaused && (
          <button onClick={resume} className={btnPrimarySm}>
            ▶ Continuar
          </button>
        )}
        {isPlaying && (
          <button onClick={stop} className={btnOutlineSm}>
            ⏹ Detener
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          Velocidad
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="accent-accent"
          />
        </label>
      </div>

      <p className={`${card} p-5 leading-loose whitespace-pre-wrap`}>
        {tokens.map((token, index) => {
          const isCurrent =
            isPlaying && charIndex >= token.start && charIndex < token.start + token.text.length;
          const isWord = /\S/.test(token.text);
          const highlightClass = isCurrent ? "rounded bg-accent-soft text-accent" : "";

          if (!isWord || !onWordClick) {
            return (
              <span
                key={index}
                ref={isCurrent ? (el) => { currentWordRef.current = el; } : undefined}
                className={highlightClass || undefined}
              >
                {token.text}
              </span>
            );
          }

          return (
            <button
              key={index}
              type="button"
              ref={isCurrent ? (el) => { currentWordRef.current = el; } : undefined}
              onClick={() => onWordClick(token.text.replace(/[.,!?¿¡"'`;:()]/g, ""))}
              className={`cursor-pointer rounded transition hover:bg-accent-soft hover:text-accent ${highlightClass}`}
            >
              {token.text}
            </button>
          );
        })}
      </p>
    </div>
  );
}
