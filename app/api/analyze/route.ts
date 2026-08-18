import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { benchmarks, cpus, games, gpus } from "@/db/schema";
import { analyzeBalance } from "@/lib/calculators/bottleneck";
import { gamesYouCanPlay } from "@/lib/calculators/gamesYouCanPlay";
import { computeProfile } from "@/lib/calculators/profile";
import { computeTier } from "@/lib/calculators/tier";
import { RAM_OPTIONS, RESOLUTIONS, type RamGb, type Resolution } from "@/lib/calculators/types";
import { suggestUpgrades } from "@/lib/calculators/upgrade";

interface AnalyzeRequestBody {
  cpuId: string;
  gpuId: string;
  ramGb: RamGb;
  resolution: Resolution;
}

function isValidResolution(value: unknown): value is Resolution {
  return typeof value === "string" && (RESOLUTIONS as string[]).includes(value);
}

function isValidRamGb(value: unknown): value is RamGb {
  return typeof value === "number" && (RAM_OPTIONS as number[]).includes(value);
}

export async function POST(request: NextRequest) {
  let body: Partial<AnalyzeRequestBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { cpuId, gpuId, ramGb, resolution } = body;

  if (
    typeof cpuId !== "string" ||
    typeof gpuId !== "string" ||
    !isValidRamGb(ramGb) ||
    !isValidResolution(resolution)
  ) {
    return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
  }

  const [cpuRows, gpuRows, allGames, allBenchmarks] = await Promise.all([
    db.select().from(cpus).where(eq(cpus.id, cpuId)),
    db.select().from(gpus).where(eq(gpus.id, gpuId)),
    db.select().from(games),
    db.select().from(benchmarks),
  ]);

  const cpu = cpuRows[0];
  const gpu = gpuRows[0];

  if (!cpu || !gpu) {
    return NextResponse.json({ error: "CPU o GPU no encontrada." }, { status: 404 });
  }

  const profile = computeProfile(cpu, gpu, ramGb);
  const tier = computeTier(profile.overallScore, `${cpu.id}-${gpu.id}-${ramGb}`);
  const balance = analyzeBalance(cpu, gpu, RESOLUTIONS);
  const upgrades = suggestUpgrades(cpu, gpu, ramGb, resolution);
  const gamesList = gamesYouCanPlay({
    cpu,
    gpu,
    games: allGames,
    benchmarks: allBenchmarks,
    resolution,
  });

  return NextResponse.json({
    cpu,
    gpu,
    ramGb,
    resolution,
    profile,
    tier,
    balance,
    upgrades,
    games: gamesList,
  });
}
