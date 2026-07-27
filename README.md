# Idiomas

Plataforma personal para estudiar inglés, portugués y chino (fácilmente extensible a más idiomas), con:

- **Lecturas de fuentes reales**: noticias (RSS), literatura de dominio público (Project Gutenberg) y oraciones de ejemplo (Tatoeba).
- **Lectura en voz alta (TTS)** usando la Web Speech API del navegador, con resaltado de la palabra actual.
- **Diccionario integrado**: click en cualquier palabra del texto para ver su definición (Cambridge Dictionary).
- **Ejercicios generados** a partir del texto que estás leyendo, usando la API gratuita de Google Gemini, con una **ayuda/pista** por ejercicio. Si no hay `GEMINI_API_KEY` configurada, cae automáticamente a ejercicios de plantilla (fill-in-the-blank basados en el propio texto).
- **Progreso persistente** por idioma (ejercicios completados, aciertos, racha de días) en una base de datos Postgres vía Prisma.
- **Sin login ni registro**: es una app personal de uso libre; todo el progreso se guarda automáticamente bajo un único usuario que se crea solo.

## Requisitos

- Node.js 20+
- Una base de datos Postgres gratuita (recomendado: [Neon](https://neon.tech))
- Una clave gratuita de Google Gemini (opcional, pero recomendada): https://aistudio.google.com/app/apikey

## Setup local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar `.env.example` a `.env` y completar:
   - `DATABASE_URL` / `DIRECT_URL`: connection strings de tu base Postgres (ver sección de Neon abajo).
   - `GEMINI_API_KEY` con tu clave gratuita de Google AI Studio.
3. Crear las tablas y sembrar los idiomas iniciales:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
4. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir http://localhost:3000 y elegir un idioma directamente — no hace falta crear cuenta ni iniciar sesión.

## Publicar la app en internet (Vercel + Neon, gratis)

1. **Base de datos (Neon)**: crear una cuenta gratuita en https://neon.tech, crear un proyecto. En el dashboard del proyecto, copiar:
   - El **connection string con pooling** (host termina en `-pooler`) → va en `DATABASE_URL`.
   - El **connection string directo** (sin `-pooler`) → va en `DIRECT_URL` (Prisma lo necesita para correr las migraciones).
2. **Repositorio (GitHub)**: crear un repositorio vacío en GitHub y subir el proyecto:
   ```bash
   git remote add origin <url-del-repo>
   git push -u origin master
   ```
3. **Hosting (Vercel)**: crear una cuenta gratuita en https://vercel.com (podés entrar con tu cuenta de GitHub), hacer "Add New… → Project" e importar el repositorio.
4. En "Environment Variables" del proyecto en Vercel, cargar:
   - `DATABASE_URL`, `DIRECT_URL` (de Neon)
   - `GEMINI_API_KEY`
5. Deploy. El comando de build (`prisma migrate deploy && prisma db seed && next build`) crea las tablas y siembra los idiomas automáticamente en cada deploy.

## Agregar un idioma nuevo

Edita `lib/languages.ts` y agrega una entrada al arreglo `LANGUAGES` con:
- `code`: código corto (ej. `"fr"`)
- `ttsLocale`: BCP-47 para el TTS del navegador (ej. `"fr-FR"`)
- `gutenbergCode`, `tatoebaCode`: códigos de idioma de Gutendex y Tatoeba
- `rssFeeds`: feeds RSS confiables en ese idioma
- `cambridgeSlug`: slug del diccionario de Cambridge (ej. `"english"`, `"portuguese-english"`)

Luego siembra el idioma en la base de datos agregándolo también a `prisma/seed.ts` y corriendo `npm run db:seed`.

## Estructura

- `app/` — páginas y rutas API (App Router de Next.js)
- `lib/languages.ts` — registro central de idiomas soportados
- `lib/content-providers/` — un módulo por fuente de contenido (news, literature, sentences, dictionary)
- `lib/gemini.ts` — generación de ejercicios y pistas con Gemini (con fallback en `lib/exercises/templates.ts`)
- `lib/tts.ts` + `components/ReadAloud.tsx` — lectura en voz alta
- `prisma/schema.prisma` — modelo de datos (usuarios, idiomas, progreso, intentos de ejercicios)

## Scripts útiles

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run db:migrate` — aplica migraciones de Prisma
- `npm run db:seed` — siembra los idiomas
- `npm run db:studio` — abre Prisma Studio para ver los datos
