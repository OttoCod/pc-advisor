import type { Benchmark, Confidence, Cpu, Game, Gpu, Preset, Resolution } from "./types";

export interface FpsEstimate {
  fpsLow: number;
  fpsHigh: number;
  confidence: Confidence;
  source: "real" | "interpolated";
}

// El peso de la GPU crece con la resolución; el resto del peso es del CPU.
const GPU_WEIGHT_BY_RESOLUTION: Record<Resolution, number> = {
  "1080p": 0.6,
  "1440p": 0.75,
  "4k": 0.85,
};

// low > medium > high > ultra en FPS resultante.
const PRESET_MULTIPLIER: Record<Preset, number> = {
  low: 1.35,
  medium: 1.0,
  high: 0.8,
  ultra: 0.6,
};

const RAY_TRACING_PENALTY = 0.55;

// Piso de sanity para que nunca se muestre un rango absurdo (ej. 0-0 FPS) en hardware muy débil.
const MIN_BASE_FPS = 4;

export function estimateFps(params: {
  cpu: Cpu;
  gpu: Gpu;
  game: Game;
  resolution: Resolution;
  preset: Preset;
  rayTracing: boolean;
  benchmarks: Benchmark[];
}): FpsEstimate {
  const { cpu, gpu, game, resolution, preset, rayTracing, benchmarks } = params;
  const effectiveRayTracing = rayTracing && !!game.supportsRayTracing;

  const exact = benchmarks.find(
    (b) =>
      b.cpuId === cpu.id &&
      b.gpuId === gpu.id &&
      b.gameId === game.id &&
      b.resolution === resolution &&
      b.preset === preset &&
      !!b.rayTracing === effectiveRayTracing
  );

  if (exact) {
    return {
      fpsLow: exact.fpsLow,
      fpsHigh: exact.fpsHigh,
      confidence: exact.confidence as Confidence,
      source: exact.source as "real" | "interpolated",
    };
  }

  const gpuWeight = GPU_WEIGHT_BY_RESOLUTION[resolution];
  const cpuWeight = 1 - gpuWeight;
  const combinedScore = cpu.relativePerformanceScore * cpuWeight + gpu.relativePerformanceScore * gpuWeight;

  // demandTier 1 (liviano) a 10 (muy exigente): decae de forma no lineal, para que
  // títulos livianos (esports) despeguen claramente por encima de los AAA exigentes
  // en vez de una diferencia plana.
  const demandFactor = 12 / (2 + game.demandTier);
  let baseFps = combinedScore * demandFactor;

  baseFps *= PRESET_MULTIPLIER[preset];

  if (effectiveRayTracing) {
    baseFps *= RAY_TRACING_PENALTY;
  }

  baseFps = Math.max(baseFps, MIN_BASE_FPS);

  const fpsLow = Math.round(baseFps * 0.85);
  const fpsHigh = Math.round(baseFps * 1.15);

  // Confianza media si hay al menos un benchmark real del mismo juego/resolución para
  // orientar la interpolación (aunque con otro hardware o preset); si no, es una
  // extrapolación pura a partir de los scores relativos, y la confianza es baja.
  const hasNearbyReference = benchmarks.some((b) => b.gameId === game.id && b.resolution === resolution);

  return {
    fpsLow,
    fpsHigh,
    confidence: hasNearbyReference ? "medium" : "low",
    source: "interpolated",
  };
}
