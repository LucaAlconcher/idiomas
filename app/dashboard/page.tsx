import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/currentUser";
import { LANGUAGES } from "@/lib/languages";
import { Header } from "@/components/Header";
import { card } from "@/lib/ui";

const BADGES: Record<string, string> = {
  en: "EN",
  pt: "PT",
  zh: "中",
};

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  // Si todavía no hay una base de datos real conectada (desarrollo local
  // sin DATABASE_URL configurada), se sigue mostrando el dashboard sin
  // progreso en vez de romper la página.
  const progressRows = await prisma.progress
    .findMany({ where: { userId } })
    .catch(() => []);
  const progressByLanguage = new Map(progressRows.map((p) => [p.languageCode, p]));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-foreground">Elige un idioma para estudiar</h1>
        <p className="mt-1 text-sm text-muted">Tu progreso se guarda automáticamente en cada idioma.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {LANGUAGES.map((language) => {
            const progress = progressByLanguage.get(language.code);
            return (
              <Link
                key={language.code}
                href={`/learn/${language.code}`}
                className={`${card} p-5 transition hover:border-accent hover:shadow-md`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {BADGES[language.code] ?? language.code.toUpperCase()}
                </span>
                <h2 className="mt-2 text-lg font-semibold text-foreground">{language.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {progress
                    ? `${progress.exercisesCompleted} ejercicios · racha ${progress.streak}d`
                    : "Sin actividad todavía"}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
