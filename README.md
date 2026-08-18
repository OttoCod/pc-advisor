# PC Advisor

Plataforma de análisis y recomendación de PCs Gaming. Cargás CPU, GPU, RAM y
resolución, y te devuelve una estimación de rendimiento (siempre como rango,
nunca como cifra exacta), qué componente te está limitando en cada resolución
y qué te conviene actualizar primero — todo con lenguaje claro y un nivel de
confianza explícito.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Drizzle ORM + `@libsql/client` (SQLite local, sin dependencias nativas)

## Cómo correrlo

```bash
npm install
cp .env.example .env        # DATABASE_URL=file:./pcadvisor.db
npm run db:generate         # genera la migración a partir de db/schema.ts (ya incluida en el repo)
npm run db:migrate          # crea pcadvisor.db y aplica el schema
npm run db:seed             # carga CPUs, GPUs, juegos y benchmarks de ejemplo
npm run dev                 # http://localhost:3000
```

Otros scripts útiles:

```bash
npx tsx scripts/test-calculators.ts   # smoke test del motor de cálculo por consola, sin UI
npm run db:studio                     # explorador visual de la base (Drizzle Studio)
npm run build                         # build de producción
```

## Estructura

```
app/
  page.tsx                 → home
  analizar/page.tsx        → PC Analyzer (server component, trae CPUs/GPUs de la DB)
  api/analyze/route.ts     → orquesta los calculators y devuelve el análisis completo
components/
  Header.tsx               → nav global sticky (en app/layout.tsx)
  AnalyzerForm.tsx          → formulario + resultados (client component)
  DiagnosticBar.tsx         → barra de lectura tipo instrumento, con conteo animado
db/
  schema.ts                 → cpus, gpus, games, game_requirements, benchmarks
  client.ts                  → conexión Drizzle + libsql
  seed.ts                     → datos de ejemplo (~15 CPUs, ~17 GPUs, 12 juegos)
lib/calculators/
  fps.ts                → estimación de FPS (benchmark real o interpolación)
  bottleneck.ts           → balance CPU/GPU por resolución
  upgrade.ts                → qué actualizar y por qué
  profile.ts                  → puntaje general + 4 barras de estado
  gamesYouCanPlay.ts            → corre fps.ts contra toda la base de juegos
scripts/
  test-calculators.ts          → smoke test manual
```

Todo el motor de cálculo es TypeScript puro sin dependencias de React —
`lib/calculators/*` se puede testear con `tsx` directamente, sin levantar la UI.

## Principios del motor de cálculo

- Los FPS siempre se muestran como rango (`fpsLow`–`fpsHigh`), nunca como
  cifra exacta, y siempre con un nivel de confianza (`high` / `medium` /
  `low`) según haya benchmark real cargado o sea interpolación.
- El bottleneck se calcula por resolución, no como un porcentaje único: el
  techo del CPU es constante entre resoluciones, la capacidad efectiva de la
  GPU cae a medida que sube la resolución. El resultado incluye una
  explicación en lenguaje natural, no solo una etiqueta.
- La interpolación de FPS solo se usa cuando no hay un benchmark real exacto
  cargado en la tabla `benchmarks` para esa combinación CPU+GPU+juego+
  resolución+preset+ray tracing.

## Qué quedó pendiente para un MVP completo

- **Más benchmarks reales**: hoy hay 31 filas cargadas a mano en
  `db/seed.ts` (`source: "real"`); el resto de las combinaciones se resuelve
  por interpolación. Cuantos más benchmarks reales se carguen, mejor la
  confianza general del sitio.
- **Persistencia de análisis**: no hay guardado de resultados ni historial
  (no hay tabla `users` todavía — deliberadamente fuera de este MVP).
- **SEO técnico**: no se agregó sitemap, JSON-LD ni metadata por página más
  allá del `<title>`/`<description>` base.
- **Responsive fino**: probado en 320/375/390/desktop sin overflow; vale una
  pasada de QA con dispositivos reales antes de producción.
- **Fase 2 (según la spec original, no implementado a propósito)**:
  motherboards/PSUs/cases/coolers, autenticación de usuarios, afiliados,
  AdSense, PC Builder, comparador de precios, multi-región, páginas
  individuales de juego/componente, comparador de configuraciones,
  migración a PostgreSQL (Neon/Supabase) — el schema actual está pensado
  para migrar sin romper nada.
- **Deploy**: no se configuró Vercel todavía; el proyecto corre 100% local
  con SQLite.

## Notas sobre los datos de seed

Los `relativePerformanceScore` de `cpus` y `gpus` son valores de
posicionamiento orientativo (0-100), no benchmarks medidos — están para que
el motor de interpolación funcione desde el día uno. Están comentados así
en `db/seed.ts`. A medida que se consigan benchmarks reales, se cargan en la
tabla `benchmarks` con `source: "real"`, que siempre tiene prioridad sobre
la interpolación por score.
