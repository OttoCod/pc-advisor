import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { benchmarks, cpus, games, gpus } from "@/db/schema";
import { gamesYouCanPlay } from "@/lib/calculators/gamesYouCanPlay";
import { computeProfile } from "@/lib/calculators/profile";
import { computeTier } from "@/lib/calculators/tier";
import { RAM_OPTIONS, RESOLUTIONS, type RamGb, type Resolution } from "@/lib/calculators/types";

interface CompareRequestBody {
  cpuId: string;
  gpuId: string;
  ramGb: RamGb;
  resolution: Resolution;
  replace: "cpu" | "gpu";
  candidateId: string;
}

function isValidResolution(value: unknown): value is Resolution {
  return typeof value === "string" && (RESOLUTIONS as string[]).includes(value);
}

function isValidRamGb(value: unknown): value is RamGb {
  return typeof value === "number" && (RAM_OPTIONS as number[]).includes(value);
}

export async function POST(request: NextRequest) {
  let body: Partial<CompareRequestBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { cpuId, gpuId, ramGb, resolution, replace, candidateId } = body;

  if (
    typeof cpuId !== "string" ||
    typeof gpuId !== "string" ||
    !isValidRamGb(ramGb) ||
    !isValidResolution(resolution) ||
    (replace !== "cpu" && replace !== "gpu") ||
    typeof candidateId !== "string"
  ) {
    return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
  }

  const [cpuRows, gpuRows, candidateCpuRows, candidateGpuRows, allGames, allBenchmarks] = await Promise.all([
    db.select().from(cpus).where(eq(cpus.id, cpuId)),
    db.select().from(gpus).where(eq(gpus.id, gpuId)),
    replace === "cpu" ? db.select().from(cpus).where(eq(cpus.id, candidateId)) : Promise.resolve([]),
    replace === "gpu" ? db.select().from(gpus).where(eq(gpus.id, candidateId)) : Promise.resolve([]),
    db.select().from(games),
    db.select().from(benchmarks),
  ]);

  const currentCpu = cpuRows[0];
  const currentGpu = gpuRows[0];

  if (!currentCpu || !currentGpu) {
    return NextResponse.json({ error: "CPU o GPU no encontrada." }, { status: 404 });
  }

  const candidateCpu = candidateCpuRows[0];
  const candidateGpu = candidateGpuRows[0];

  if (replace === "cpu" && !candidateCpu) {
    return NextResponse.json({ error: "CPU candidata no encontrada." }, { status: 404 });
  }
  if (replace === "gpu" && !candidateGpu) {
    return NextResponse.json({ error: "GPU candidata no encontrada." }, { status: 404 });
  }

  const altCpu = replace === "cpu" ? candidateCpu! : currentCpu;
  const altGpu = replace === "gpu" ? candidateGpu! : currentGpu;

  const profile = computeProfile(altCpu, altGpu, ramGb);
  const tier = computeTier(profile.overallScore, `${altCpu.id}-${altGpu.id}-${ramGb}`);
  const gamesList = gamesYouCanPlay({
    cpu: altCpu,
    gpu: altGpu,
    games: allGames,
    benchmarks: allBenchmarks,
    resolution,
  });

  return NextResponse.json({
    candidate: replace === "cpu" ? candidateCpu : candidateGpu,
    profile,
    tier,
    games: gamesList,
  });
}
