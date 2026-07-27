import Parser from "rss-parser";
import { getLanguage } from "@/lib/languages";
import type { ContentItem } from "./types";

const parser = new Parser({
  timeout: 8000,
});

export async function fetchNews(langCode: string, limit = 10): Promise<ContentItem[]> {
  const language = getLanguage(langCode);
  if (!language) return [];

  const results = await Promise.allSettled(
    language.rssFeeds.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items ?? []).slice(0, limit).map((item, index): ContentItem => ({
        id: `news-${feed.name}-${index}-${item.guid ?? item.link ?? index}`,
        title: item.title ?? "Sin título",
        text: item.contentSnippet ?? item.content ?? item.summary ?? "",
        url: item.link,
        sourceType: "news",
        sourceName: feed.name,
      }));
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<ContentItem[]> => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .slice(0, limit);
}
