import { getLanguage } from "@/lib/languages";
import type { ContentItem } from "./types";

type GutendexBook = {
  id: number;
  title: string;
  formats: Record<string, string>;
};

const START_MARKER = /\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
const END_MARKER = /\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
const EXCERPT_LENGTH = 2500;

function stripGutenbergBoilerplate(fullText: string): string {
  const startMatch = fullText.match(START_MARKER);
  const startIndex = startMatch ? (startMatch.index ?? 0) + startMatch[0].length : 0;

  const endMatch = fullText.match(END_MARKER);
  const endIndex = endMatch ? endMatch.index : fullText.length;

  return fullText.slice(startIndex, endIndex).trim();
}

function pickPlainTextUrl(formats: Record<string, string>): string | undefined {
  const entry = Object.entries(formats).find(
    ([mime]) => mime.startsWith("text/plain") && !mime.includes("zip")
  );
  return entry?.[1];
}

export async function fetchLiterature(langCode: string, limit = 5): Promise<ContentItem[]> {
  const language = getLanguage(langCode);
  if (!language) return [];

  const listResponse = await fetch(
    `https://gutendex.com/books?languages=${language.gutenbergCode}&sort=popular`,
    { next: { revalidate: 3600 } }
  );
  if (!listResponse.ok) return [];

  const listData = (await listResponse.json()) as { results: GutendexBook[] };
  const books = listData.results.slice(0, limit);

  const items = await Promise.allSettled(
    books.map(async (book): Promise<ContentItem> => {
      const textUrl = pickPlainTextUrl(book.formats);
      let excerpt = "";

      if (textUrl) {
        const textResponse = await fetch(textUrl, { next: { revalidate: 86400 } });
        if (textResponse.ok) {
          const fullText = await textResponse.text();
          excerpt = stripGutenbergBoilerplate(fullText).slice(0, EXCERPT_LENGTH);
        }
      }

      return {
        id: `literature-${book.id}`,
        title: book.title,
        text: excerpt,
        url: textUrl,
        sourceType: "literature",
        sourceName: "Project Gutenberg",
      };
    })
  );

  return items
    .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((item) => item.text.length > 0);
}
