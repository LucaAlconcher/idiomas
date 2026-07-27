"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Token = { text: string; start: number };

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /\S+|\s+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({ text: match[0], start: match.index });
  }
  return tokens;
}

export function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === locale) ??
    voices.find((voice) => voice.lang.startsWith(locale.split("-")[0]))
  );
}

// Palabras por minuto asumidas para el estimador de progreso cuando el
// navegador/voz no emite eventos "word" (limitación conocida de la Web
// Speech API en varias voces, sobre todo las "Natural" de Windows/Edge).
const BASE_WORDS_PER_MINUTE = 165;

// Cada cuántos ms "pellizcamos" (pause/resume) la síntesis para evitar el bug
// conocido de Chrome donde las lecturas largas (~15s+) dejan de emitir
// eventos y de sonar si no se las reinicia periódicamente.
const KEEP_ALIVE_INTERVAL_MS = 10000;
const FALLBACK_TICK_MS = 100;

export function useReadAloud(text: string, locale: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [charIndex, setCharIndex] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const receivedWordBoundaryRef = useRef(false);
  const userPausedRef = useRef(false);
  const playStartRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseStartRef = useRef(0);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wordCount = useMemo(
    () => tokenize(text).filter((token) => /\S/.test(token.text)).length,
    [text]
  );

  const clearFallback = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearFallback();
      clearKeepAlive();
      window.speechSynthesis.cancel();
    };
  }, [clearFallback, clearKeepAlive]);

  const play = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    clearFallback();
    clearKeepAlive();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = rate;
    const voice = pickVoice(locale);
    if (voice) utterance.voice = voice;

    receivedWordBoundaryRef.current = false;
    userPausedRef.current = false;
    pausedAccumRef.current = 0;

    const totalEstimatedMs = wordCount > 0 ? (wordCount / (BASE_WORDS_PER_MINUTE * rate)) * 60000 : 0;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        receivedWordBoundaryRef.current = true;
        clearFallback();
        setCharIndex(event.charIndex);
      }
    };
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      playStartRef.current = Date.now();

      // Estimador de respaldo: si en ~100ms no llegó ningún evento "word"
      // real, avanzamos el resaltado en base al tiempo transcurrido y una
      // velocidad de lectura estimada. Se cancela solo apenas llega un
      // evento real, que siempre tiene prioridad.
      fallbackIntervalRef.current = setInterval(() => {
        if (receivedWordBoundaryRef.current) {
          clearFallback();
          return;
        }
        if (userPausedRef.current || totalEstimatedMs <= 0) return;

        const elapsed = Date.now() - playStartRef.current - pausedAccumRef.current;
        const ratio = Math.min(Math.max(elapsed / totalEstimatedMs, 0), 1);
        setCharIndex(Math.floor(ratio * text.length));
      }, FALLBACK_TICK_MS);

      // Workaround del bug de Chrome: en lecturas largas, sin este "empujón"
      // periódico la síntesis se corta en silencio y deja de emitir eventos.
      keepAliveIntervalRef.current = setInterval(() => {
        if (userPausedRef.current) return;
        if (!window.speechSynthesis.speaking) return;
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, KEEP_ALIVE_INTERVAL_MS);
    };
    utterance.onend = () => {
      clearFallback();
      clearKeepAlive();
      setIsPlaying(false);
      setIsPaused(false);
      setCharIndex(0);
    };
    utterance.onerror = () => {
      clearFallback();
      clearKeepAlive();
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, locale, rate, wordCount, clearFallback, clearKeepAlive]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    userPausedRef.current = true;
    pauseStartRef.current = Date.now();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    if (pauseStartRef.current) {
      pausedAccumRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = 0;
    }
    userPausedRef.current = false;
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    clearFallback();
    clearKeepAlive();
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCharIndex(0);
  }, [clearFallback, clearKeepAlive]);

  return { play, pause, resume, stop, isPlaying, isPaused, rate, setRate, charIndex };
}
