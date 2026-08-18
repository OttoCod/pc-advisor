import { asc } from "drizzle-orm";
import { AnalyzerForm } from "@/components/AnalyzerForm";
import { db } from "@/db/client";
import { cpus, gpus } from "@/db/schema";

export default async function AnalizarPage() {
  const [cpuList, gpuList] = await Promise.all([
    db.select().from(cpus).orderBy(asc(cpus.brand), asc(cpus.model)),
    db.select().from(gpus).orderBy(asc(gpus.brand), asc(gpus.model)),
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
      <AnalyzerForm cpus={cpuList} gpus={gpuList} />
    </main>
  );
}
