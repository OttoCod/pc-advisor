import type { Cpu, Gpu, RamGb, Resolution } from "./types";
import { analyzeBalance } from "./bottleneck";

export type UpgradePriority = 1 | 2 | 3 | 4 | 5;

export interface UpgradeSuggestion {
  component: "cpu" | "gpu" | "ram";
  priority: UpgradePriority;
  reason: string;
}

export function suggestUpgrades(cpu: Cpu, gpu: Gpu, ramGb: RamGb, resolution: Resolution): UpgradeSuggestion[] {
  const [balance] = analyzeBalance(cpu, gpu, [resolution]);

  const cpuName = `${cpu.brand} ${cpu.model}`;
  const gpuName = `${gpu.brand} ${gpu.model}`;

  let cpuPriority: UpgradePriority = 2;
  let gpuPriority: UpgradePriority = 2;
  let cpuReason: string;
  let gpuReason: string;

  if (balance.limitingComponent === "cpu") {
    cpuPriority = balance.severity === "fuerte" ? 5 : balance.severity === "moderada" ? 4 : 3;
    gpuPriority = 1;
    cpuReason = `A ${resolution}, tu ${cpuName} está limitando a tu ${gpuName}. Actualizarlo es lo que más FPS te desbloquearía.`;
    gpuReason = `Tu ${gpuName} tiene margen de sobra frente a tu CPU actual; no es prioridad hoy.`;
  } else if (balance.limitingComponent === "gpu") {
    gpuPriority = balance.severity === "fuerte" ? 5 : balance.severity === "moderada" ? 4 : 3;
    cpuPriority = 1;
    gpuReason = `A ${resolution}, tu ${gpuName} está limitando a tu ${cpuName}. Es tu cuello de botella principal.`;
    cpuReason = `Tu ${cpuName} tiene margen de sobra frente a tu GPU actual; no es prioridad hoy.`;
  } else {
    cpuPriority = 2;
    gpuPriority = 2;
    cpuReason = `Tu CPU y tu GPU están equilibrados a ${resolution}. Cualquiera de los dos suma rendimiento por igual.`;
    gpuReason = cpuReason;
  }

  let ramPriority: UpgradePriority;
  let ramReason: string;
  if (ramGb < 16) {
    ramPriority = 4;
    ramReason = `Tenés ${ramGb} GB de RAM. La mayoría de los juegos actuales piden 16 GB; es una actualización barata con impacto real.`;
  } else if (ramGb === 16) {
    ramPriority = 2;
    ramReason = `Tenés 16 GB de RAM, suficiente para la mayoría de los juegos actuales.`;
  } else {
    ramPriority = 1;
    ramReason = `Tenés ${ramGb} GB de RAM, de sobra para gaming. No es una prioridad.`;
  }

  return [
    { component: "cpu", priority: cpuPriority, reason: cpuReason },
    { component: "gpu", priority: gpuPriority, reason: gpuReason },
    { component: "ram", priority: ramPriority, reason: ramReason },
  ];
}

const MAX_UPGRADE_CANDIDATES = 6;

/**
 * Componentes del mismo tipo (CPU o GPU) mejores que el actual, ordenados de
 * menor a mayor score. Sirve para armar la lista "qué comprar" en la UI, sin
 * lógica de precio (todavía no hay tabla de precios en el MVP).
 */
export function listUpgradeCandidates<T extends { id: string; relativePerformanceScore: number }>(
  current: T,
  options: T[],
  limit: number = MAX_UPGRADE_CANDIDATES
): T[] {
  return options
    .filter((option) => option.id !== current.id && option.relativePerformanceScore > current.relativePerformanceScore)
    .sort((a, b) => a.relativePerformanceScore - b.relativePerformanceScore)
    .slice(0, limit);
}
