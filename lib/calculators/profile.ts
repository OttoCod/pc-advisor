import type { Cpu, Gpu, RamGb } from "./types";

export type StatusBarKey = "gaming1080p" | "gamingCompetitive" | "gamingAaa" | "productivity";

export interface StatusBar {
  key: StatusBarKey;
  label: string;
  score: number; // 0-100, orientativo
}

export interface ProfileResult {
  overallScore: number; // 0-100, orientativo — promedio de las 4 barras
  bars: StatusBar[];
}

function ramPenalty(ramGb: number): number {
  if (ramGb < 8) return 0.7;
  if (ramGb < 16) return 0.9;
  return 1;
}

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function computeProfile(cpu: Cpu, gpu: Gpu, ramGb: RamGb): ProfileResult {
  const ramFactor = ramPenalty(ramGb);
  const cpuScore = cpu.relativePerformanceScore;
  const gpuScore = gpu.relativePerformanceScore;

  const gaming1080p = clampScore((cpuScore * 0.4 + gpuScore * 0.6) * ramFactor);
  const gamingCompetitive = clampScore((cpuScore * 0.65 + gpuScore * 0.35) * ramFactor);
  const gamingAaa = clampScore((cpuScore * 0.25 + gpuScore * 0.75) * ramFactor);

  const productivityFactor = Math.min(1.25, cpu.threads / 12);
  const productivity = clampScore(cpuScore * productivityFactor * ramFactor);

  const bars: StatusBar[] = [
    { key: "gaming1080p", label: "Gaming 1080p", score: gaming1080p },
    { key: "gamingCompetitive", label: "Gaming competitivo", score: gamingCompetitive },
    { key: "gamingAaa", label: "Gaming AAA", score: gamingAaa },
    { key: "productivity", label: "Productividad", score: productivity },
  ];

  const overallScore = clampScore(bars.reduce((sum, bar) => sum + bar.score, 0) / bars.length);

  return { overallScore, bars };
}
