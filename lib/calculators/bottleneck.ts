import type { Cpu, Gpu, Resolution } from "./types";

export type LimitingComponent = "cpu" | "gpu" | "balanced";
export type Severity = "none" | "leve" | "moderada" | "fuerte";

export interface BottleneckResult {
  resolution: Resolution;
  limitingComponent: LimitingComponent;
  severity: Severity;
  relativeGap: number;
  explanation: string;
}

// El CPU impone un techo de FPS prácticamente constante entre resoluciones.
// La GPU tiene una capacidad efectiva que cae a medida que sube la resolución
// (más píxeles que renderizar), por eso a 4K el cuello de botella tiende a ser
// la GPU y a 1080p tiende a ser más parejo o CPU-relevante.
const GPU_FACTOR_BY_RESOLUTION: Record<Resolution, number> = {
  "1080p": 1.0,
  "1440p": 0.75,
  "4k": 0.5,
};

export function analyzeBalance(cpu: Cpu, gpu: Gpu, resolutions: Resolution[]): BottleneckResult[] {
  const cpuCeiling = cpu.relativePerformanceScore;

  return resolutions.map((resolution) => {
    const gpuEffective = gpu.relativePerformanceScore * GPU_FACTOR_BY_RESOLUTION[resolution];
    const gap = cpuCeiling - gpuEffective;
    const denom = Math.max(cpuCeiling, gpuEffective, 1);
    const relativeGap = gap / denom;
    const absGap = Math.abs(relativeGap);

    let limitingComponent: LimitingComponent;
    if (absGap < 0.08) {
      limitingComponent = "balanced";
    } else if (relativeGap > 0) {
      // El techo del CPU supera a la GPU efectiva: la GPU se queda corta primero.
      limitingComponent = "gpu";
    } else {
      limitingComponent = "cpu";
    }

    let severity: Severity;
    if (limitingComponent === "balanced") {
      severity = "none";
    } else if (absGap > 0.35) {
      severity = "fuerte";
    } else if (absGap > 0.18) {
      severity = "moderada";
    } else {
      severity = "leve";
    }

    return {
      resolution,
      limitingComponent,
      severity,
      relativeGap,
      explanation: buildExplanation(cpu, gpu, resolution, limitingComponent, severity),
    };
  });
}

function buildExplanation(
  cpu: Cpu,
  gpu: Gpu,
  resolution: Resolution,
  limitingComponent: LimitingComponent,
  severity: Severity
): string {
  const cpuName = `${cpu.brand} ${cpu.model}`;
  const gpuName = `${gpu.brand} ${gpu.model}`;

  if (limitingComponent === "balanced") {
    return `A ${resolution}, tu ${cpuName} y tu ${gpuName} están bien equilibrados. Ninguno de los dos limita claramente al otro.`;
  }

  const adverb = severity === "fuerte" ? "claramente " : severity === "moderada" ? "" : "levemente ";

  if (limitingComponent === "gpu") {
    return `A ${resolution}, tu ${gpuName} está ${adverb}limitando el rendimiento. Tu ${cpuName} tiene margen de sobra.`;
  }

  return `A ${resolution}, tu ${cpuName} está ${adverb}limitando el rendimiento. Tu ${gpuName} tiene margen de sobra.`;
}
