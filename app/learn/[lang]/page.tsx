import { notFound } from "next/navigation";
import Link from "next/link";
import { getLanguage } from "@/lib/languages";
import { fetchNews } from "@/lib/content-providers/news";
import { fetchLiterature } from "@/lib/content-providers/literature";
import { fetchSentences } from "@/lib/content-providers/sentences";
import type { ContentItem } from "@/lib/content-providers/types";
import { Header } from "@/components/Header";
import { card, cardAccent } from "@/lib/ui";

function ContentSection({
  title,
  items,
  lang,
}: {
  title: string;
  items: ContentItem[];
  lang: string;
}) {
  if (items.length === 0) {
    return (
      <section>
        <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted">No se pudo cargar contenido en este momento.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/learn/${lang}/read/${item.sourceType}/${encodeURIComponent(item.id)}`}
              className={`block ${card} p-3 transition hover:border-accent`}
            >
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{item.text}</p>
              <p className="mt-1 text-xs text-muted/70">{item.sourceName}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function LanguageHubPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = getLanguage(lang);
  if (!language) notFound();

  const [news, literature, sentences] = await Promise.all([
    fetchNews(lang),
    fetchLiterature(lang),
    fetchSentences(lang),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
        <h1 className="text-2xl font-semibold text-foreground">{language.name}</h1>
        <section>
          <Link href={`/learn/${lang}/custom`} className={`block ${cardAccent} p-4 transition hover:border-accent`}>
            <p className="font-semibold text-accent">✏️ Usar mi propio texto</p>
            <p className="mt-1 text-sm text-foreground/80">
              Pegá cualquier texto en {language.name} para escucharlo y generar ejercicios.
            </p>
          </Link>
        </section>
        <ContentSection title="Noticias" items={news} lang={lang} />
        <ContentSection title="Literatura" items={literature} lang={lang} />
        <ContentSection title="Oraciones de ejemplo" items={sentences} lang={lang} />
      </main>
    </>
  );
}
