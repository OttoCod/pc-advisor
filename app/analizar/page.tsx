import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { AnalyzerForm } from "@/components/AnalyzerForm";
import { db } from "@/db/client";
import { cpus, games, gpus } from "@/db/schema";
import { computeProfile } from "@/lib/calculators/profile";
import { buildShareSearch, parseShareParams } from "@/lib/shareParams";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const shared = parseShareParams(await searchParams);

  if (!shared) {
    return {
      title: "PC Analyzer — PC Advisor",
      description: "Analizá tu PC: FPS estimados, cuello de botella y qué actualizar primero.",
    };
  }

  const [cpuRows, gpuRows] = await Promise.all([
    db.select().from(cpus).where(eq(cpus.id, shared.cpuId)),
    db.select().from(gpus).where(eq(gpus.id, shared.gpuId)),
  ]);
  const cpu = cpuRows[0];
  const gpu = gpuRows[0];

  if (!cpu || !gpu) {
    return { title: "PC Analyzer — PC Advisor" };
  }

  const profile = computeProfile(cpu, gpu, shared.ramGb);
  const title = `${cpu.brand} ${cpu.model} + ${gpu.brand} ${gpu.model} — ${profile.overallScore}/100 | PC Advisor`;
  const description = `Puntaje general ${profile.overallScore}/100 a ${shared.resolution}. Mirá el diagnóstico completo: FPS estimados, cuello de botella y qué actualizar primero.`;
  const ogImage = `/api/og?${buildShareSearch(shared)}`;

  return {
    title,
    description,
    openGraph: { title, description, images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function AnalizarPage({ searchParams }: { searchParams: SearchParams }) {
  const shared = parseShareParams(await searchParams);

  const [cpuList, gpuList, gameList] = await Promise.all([
    db.select().from(cpus).orderBy(asc(cpus.brand), asc(cpus.model)),
    db.select().from(gpus).orderBy(asc(gpus.brand), asc(gpus.model)),
    db.select().from(games).orderBy(asc(games.name)),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="animate-fade-up mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">PC Analyzer</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Analizá tu PC
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
          Cargá tu CPU, GPU, RAM y la resolución en la que jugás. Te mostramos una estimación de
          rendimiento, dónde está el límite real de tu equipo y qué te conviene actualizar primero.
        </p>
      </div>
      <AnalyzerForm cpus={cpuList} gpus={gpuList} games={gameList} initialShare={shared} />
    </main>
  );
}
