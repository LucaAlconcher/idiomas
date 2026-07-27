// Clases de Tailwind reutilizadas para mantener una identidad visual
// consistente en toda la app (botones, tarjetas, inputs).

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimarySm =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50";

export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";

export const btnOutlineSm =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "text-sm font-medium text-muted transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";

export const card = "rounded-2xl border border-border bg-surface shadow-sm";

export const cardAccent =
  "rounded-2xl border-2 border-dashed border-accent/40 bg-accent-soft/50 shadow-sm";

export const input =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent";

export const badge =
  "inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent";
