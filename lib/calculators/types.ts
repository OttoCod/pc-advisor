import type { InferSelectModel } from "drizzle-orm";
import type { cpus, gpus, games, benchmarks } from "@/db/schema";

export type Cpu = InferSelectModel<typeof cpus>;
export type Gpu = InferSelectModel<typeof gpus>;
export type Game = InferSelectModel<typeof games>;
export type Benchmark = InferSelectModel<typeof benchmarks>;

export type Resolution = "1080p" | "1440p" | "4k";
export type Preset = "low" | "medium" | "high" | "ultra";
export type Confidence = "high" | "medium" | "low";
export type RamGb = 4 | 8 | 16 | 32 | 64 | 128;

export const RESOLUTIONS: Resolution[] = ["1080p", "1440p", "4k"];
export const PRESETS: Preset[] = ["low", "medium", "high", "ultra"];
export const RAM_OPTIONS: RamGb[] = [4, 8, 16, 32, 64, 128];
