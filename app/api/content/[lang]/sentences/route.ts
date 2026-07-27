import { NextResponse } from "next/server";
import { fetchSentences } from "@/lib/content-providers/sentences";
import { getLanguage } from "@/lib/languages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  if (!getLanguage(lang)) {
    return NextResponse.json({ error: "Idioma no soportado" }, { status: 404 });
  }

  const items = await fetchSentences(lang);
  return NextResponse.json({ items });
}
