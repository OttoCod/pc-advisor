import type { Benchmark, Cpu, Game, Gpu, Preset, Resolution } from "./types";
import { PRESETS } from "./types";
import { estimateFps, type FpsEstimate } from "./fps";

export interface GameEstimate {
  gameId: string;
  name: string;
  genre: string | null;
  estimates: Record<Preset, FpsEstimate>;
}

export function gamesYouCanPlay(params: {
  cpu: Cpu;
  gpu: Gpu;
  games: Game[];
  benchmarks: Benchmark[];
  resolution: Resolution;
  rayTracing?: boolean;
}): GameEstimate[] {
  const { cpu, gpu, games, benchmarks, resolution, rayTracing = false } = params;

  return games.map((game) => {
    const estimates = {} as Record<Preset, FpsEstimate>;
    for (const preset of PRESETS) {
      estimates[preset] = estimateFps({ cpu, gpu, game, resolution, preset, rayTracing, benchmarks });
    }
    return { gameId: game.id, name: game.name, genre: game.genre, estimates };
  });
}
