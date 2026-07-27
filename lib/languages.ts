export type RssFeed = {
  name: string;
  url: string;
};

export type LanguageConfig = {
  code: string; // matches Language.code in the database
  name: string;
  /** BCP-47 tag used to pick a speechSynthesis voice */
  ttsLocale: string;
  /** Gutendex (Project Gutenberg API) language code */
  gutenbergCode: string;
  /** Tatoeba language code (ISO 639-3) */
  tatoebaCode: string;
  /** Trusted public RSS feeds for current news content */
  rssFeeds: RssFeed[];
  /** Cambridge Dictionary URL slug used for dictionary lookups (dictionary.cambridge.org/dictionary/{slug}/{word}) */
  cambridgeSlug: string;
};

export const LANGUAGES: LanguageConfig[] = [
  {
    code: "en",
    name: "English",
    ttsLocale: "en-US",
    gutenbergCode: "en",
    tatoebaCode: "eng",
    rssFeeds: [
      { name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
      { name: "NPR", url: "https://feeds.npr.org/1004/rss.xml" },
    ],
    cambridgeSlug: "english",
  },
  {
    code: "pt",
    name: "Português",
    ttsLocale: "pt-BR",
    gutenbergCode: "pt",
    tatoebaCode: "por",
    rssFeeds: [
      { name: "BBC Brasil", url: "https://www.bbc.com/portuguese/index.xml" },
      { name: "Público", url: "https://www.publico.pt/rss" },
    ],
    cambridgeSlug: "portuguese-english",
  },
  {
    code: "zh",
    name: "中文",
    ttsLocale: "zh-CN",
    gutenbergCode: "zh",
    tatoebaCode: "cmn",
    rssFeeds: [
      { name: "BBC Chinese", url: "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml" },
    ],
    cambridgeSlug: "chinese-simplified-english",
  },
];

export function getLanguage(code: string): LanguageConfig | undefined {
  return LANGUAGES.find((language) => language.code === code);
}
