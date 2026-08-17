import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { getLanguage } from "@/lib/languages";
import { translateDefinitionsToSpanish } from "@/lib/gemini";

export type DictionaryDefinition = {
  partOfSpeech: string;
  definitions: string[];
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function parseEnglishEntry(
  $: cheerio.CheerioAPI,
  entry: cheerio.Cheerio<AnyNode>
): DictionaryDefinition {
  const partOfSpeech = entry.find(".pos.dpos").first().text().trim();
  const definitions: string[] = [];

  entry.find(".def-block.ddef_block").each((_, block) => {
    const $block = $(block);
    const definition = $block.find(".def.ddef_d").first().text().trim().replace(/:\s*$/, "");
    if (definition) definitions.push(definition);
  });

  return { partOfSpeech, definitions };
}

function parseBilingualEntry(
  $: cheerio.CheerioAPI,
  entry: cheerio.Cheerio<AnyNode>
): DictionaryDefinition {
  const partOfSpeech = entry.find(".pos.dpos").first().text().trim();
  const defBlocks = entry.find(".def-block.ddef_block");

  const definitions: string[] = [];

  if (defBlocks.length > 0) {
    defBlocks.each((_, block) => {
      const $block = $(block);
      const translation = $block.find(".dtrans").first().text().trim();
      const nativeDefinition = $block
        .find(".def.ddef_d")
        .first()
        .text()
        .trim()
        .replace(/:\s*$/, "");
      if (translation && nativeDefinition) {
        definitions.push(`${translation} — ${nativeDefinition}`);
      } else if (translation) {
        definitions.push(translation);
      } else if (nativeDefinition) {
        definitions.push(nativeDefinition);
      }
    });
  } else {
    const seen = new Set<string>();
    entry.find(".dtrans").each((_, node) => {
      const text = $(node).text().trim();
      if (text && !seen.has(text)) {
        seen.add(text);
        definitions.push(text);
      }
    });
  }

  return { partOfSpeech, definitions };
}

export async function fetchDefinition(
  langCode: string,
  word: string
): Promise<DictionaryDefinition[] | null> {
  const language = getLanguage(langCode);
  if (!language) return null;

  const url = `https://dictionary.cambridge.org/dictionary/${language.cambridgeSlug}/${encodeURIComponent(word.toLowerCase())}`;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 86400 },
  });
  if (!response.ok) return null;

  const html = await response.text();
  const $ = cheerio.load(html);

  const isMonolingual = language.cambridgeSlug === "english";
  const entries = isMonolingual ? $(".pr.entry-body__el") : $(".pr.di.kdic");

  const results: DictionaryDefinition[] = [];
  entries.each((_, el) => {
    const entry = $(el);
    const parsed = isMonolingual ? parseEnglishEntry($, entry) : parseBilingualEntry($, entry);
    if (parsed.definitions.length > 0) results.push(parsed);
  });

  // Cambridge no ofrece pares en español para todos los idiomas (p. ej.
  // portuguese-english o chinese-simplified-english solo traducen al inglés,
  // y el diccionario monolingüe de inglés está en inglés). Para mostrar
  // siempre las definiciones en español, se traducen con Gemini; si no está
  // configurado o falla, se degrada mostrando el texto original.
  const translated = await translateDefinitionsToSpanish(word, results);
  return translated ?? results;
}
