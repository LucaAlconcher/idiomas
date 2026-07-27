import { getLanguage } from "@/lib/languages";
import type { ContentItem } from "./types";

type TatoebaResult = {
  id: number;
  text: string;
  lang: string;
};

type TatoebaSearchResponse = {
  results: TatoebaResult[];
};

export async function fetchSentences(langCode: string, limit = 15): Promise<ContentItem[]> {
  const language = getLanguage(langCode);
  if (!language) return [];

  const url = `https://tatoeba.org/eng/api_v0/search?from=${language.tatoebaCode}&to=${language.tatoebaCode}&orphans=no&unapproved=no`;

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) return [];

  const data = (await response.json()) as TatoebaSearchResponse;

  return (data.results ?? []).slice(0, limit).map((result): ContentItem => ({
    id: `sentence-${result.id}`,
    title: "Oración de ejemplo",
    text: result.text,
    url: `https://tatoeba.org/en/sentences/show/${result.id}`,
    sourceType: "sentence",
    sourceName: "Tatoeba",
  }));
}
