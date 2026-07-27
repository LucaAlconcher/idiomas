import { notFound } from "next/navigation";
import { getLanguage } from "@/lib/languages";
import { Header } from "@/components/Header";
import { CustomTextWorkspace } from "@/components/CustomTextWorkspace";

export default async function CustomTextPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = getLanguage(lang);
  if (!language) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tu propio texto</h1>
          <p className="text-sm text-muted">
            Pegá un texto en {language.name} para escucharlo y generar ejercicios.
          </p>
        </div>
        <CustomTextWorkspace
          languageCode={lang}
          languageName={language.name}
          ttsLocale={language.ttsLocale}
        />
      </main>
    </>
  );
}
