import { NextResponse } from "next/server";
import { fetchDefinition } from "@/lib/content-providers/dictionary";
import { getLanguage } from "@/lib/languages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; word: string }> }
) {
  const { lang, word } = await params;
  if (!getLanguage(lang)) {
    return NextResponse.json({ error: "Idioma no soportado" }, { status: 404 });
  }

  const definitions = await fetchDefinition(lang, word);
  if (!definitions) {
    return NextResponse.json({ error: "No se encontraron definiciones" }, { status: 404 });
  }

  return NextResponse.json({ word, definitions });
}
