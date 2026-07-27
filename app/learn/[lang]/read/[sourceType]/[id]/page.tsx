import { notFound } from "next/navigation";
import { getLanguage } from "@/lib/languages";
import { fetchNews } from "@/lib/content-providers/news";
import { fetchLiterature } from "@/lib/content-providers/literature";
import { fetchSentences } from "@/lib/content-providers/sentences";
import type { ContentItem } from "@/lib/content-providers/types";
import { Header } from "@/components/Header";
import { ReadingWorkspace } from "@/components/ReadingWorkspace";

async function findItem(
  lang: string,
  sourceType: string,
  id: string
): Promise<ContentItem | null> {
  let items: ContentItem[] = [];
  if (sourceType === "news") items = await fetchNews(lang, 20);
  else if (sourceType === "literature") items = await fetchLiterature(lang, 10);
  else if (sourceType === "sentence") items = await fetchSentences(lang, 30);

  return items.find((item) => item.id === id) ?? null;
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ lang: string; sourceType: string; id: string }>;
}) {
  const { lang, sourceType, id } = await params;
  const language = getLanguage(lang);
  if (!language) notFound();

  const item = await findItem(lang, sourceType, decodeURIComponent(id));
  if (!item) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{item.title}</h1>
          <p className="text-sm text-muted">{item.sourceName}</p>
        </div>
        <ReadingWorkspace
          languageCode={lang}
          languageName={language.name}
          ttsLocale={language.ttsLocale}
          text={item.text}
          sourceTitle={item.title}
        />
      </main>
    </>
  );
}
