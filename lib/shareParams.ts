import { RAM_OPTIONS, RESOLUTIONS, type RamGb, type Resolution } from "./calculators/types";

export interface ShareParams {
  cpuId: string;
  gpuId: string;
  ramGb: RamGb;
  resolution: Resolution;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseShareParams(sp: RawSearchParams): ShareParams | null {
  const cpuId = typeof sp.cpu === "string" ? sp.cpu : undefined;
  const gpuId = typeof sp.gpu === "string" ? sp.gpu : undefined;
  const ramRaw = typeof sp.ram === "string" ? Number(sp.ram) : undefined;
  const resolution = typeof sp.res === "string" ? sp.res : undefined;

  if (!cpuId || !gpuId) return null;
  if (!ramRaw || !(RAM_OPTIONS as number[]).includes(ramRaw)) return null;
  if (!resolution || !(RESOLUTIONS as string[]).includes(resolution)) return null;

  return { cpuId, gpuId, ramGb: ramRaw as RamGb, resolution: resolution as Resolution };
}

export function buildShareSearch(shared: ShareParams): string {
  return new URLSearchParams({
    cpu: shared.cpuId,
    gpu: shared.gpuId,
    ram: String(shared.ramGb),
    res: shared.resolution,
  }).toString();
}
