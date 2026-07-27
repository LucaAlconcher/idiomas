export type ContentItem = {
  id: string;
  title: string;
  text: string;
  url?: string;
  sourceType: "news" | "literature" | "sentence";
  sourceName: string;
};
