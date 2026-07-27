import { NextResponse } from "next/server";
import { fetchNews } from "@/lib/content-providers/news";
import { getLanguage } from "@/lib/languages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  if (!getLanguage(lang)) {
    return NextResponse.json({ error: "Idioma no soportado" }, { status: 404 });
  }

  const items = await fetchNews(lang);
  return NextResponse.json({ items });
}
