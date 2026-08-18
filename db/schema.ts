import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const cpus = sqliteTable("cpus", {
  id: text("id").primaryKey(), // slug, ej "ryzen-5-5600x"
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  generation: text("generation"),
  socket: text("socket").notNull(),
  cores: integer("cores").notNull(),
  threads: integer("threads").notNull(),
  baseClockGhz: real("base_clock_ghz"),
  boostClockGhz: real("boost_clock_ghz"),
  tdpWatts: integer("tdp_watts"),
  releaseYear: integer("release_year"),
  // 0-100, posicionamiento orientativo (no es un benchmark medido). Ver comentario en db/seed.ts.
  relativePerformanceScore: integer("relative_performance_score").notNull(),
});

export const gpus = sqliteTable("gpus", {
  id: text("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  vramGb: integer("vram_gb").notNull(),
  tdpWatts: integer("tdp_watts"),
  releaseYear: integer("release_year"),
  supportsDlss: integer("supports_dlss", { mode: "boolean" }).default(false),
  supportsFsr: integer("supports_fsr", { mode: "boolean" }).default(false),
  supportsRayTracing: integer("supports_ray_tracing", { mode: "boolean" }).default(false),
  // 0-100, posicionamiento orientativo (no es un benchmark medido). Ver comentario en db/seed.ts.
  relativePerformanceScore: integer("relative_performance_score").notNull(),
});

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  genre: text("genre"), // aaa | competitive | indie | rpg | simulation | survival
  developer: text("developer"),
  releaseYear: integer("release_year"),
  imageUrl: text("image_url"),
  demandTier: integer("demand_tier").notNull(), // 1 (liviano) a 10 (muy exigente)
  supportsRayTracing: integer("supports_ray_tracing", { mode: "boolean" }).default(false),
  supportsDlss: integer("supports_dlss", { mode: "boolean" }).default(false),
  supportsFsr: integer("supports_fsr", { mode: "boolean" }).default(false),
});

export const gameRequirements = sqliteTable("game_requirements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: text("game_id").notNull().references(() => games.id),
  tier: text("tier").notNull(), // "minimum" | "recommended"
  cpuText: text("cpu_text").notNull(),
  gpuText: text("gpu_text").notNull(),
  ramGb: integer("ram_gb").notNull(),
  storageGb: integer("storage_gb"),
});

export const benchmarks = sqliteTable("benchmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cpuId: text("cpu_id").notNull().references(() => cpus.id),
  gpuId: text("gpu_id").notNull().references(() => gpus.id),
  gameId: text("game_id").notNull().references(() => games.id),
  resolution: text("resolution").notNull(), // "1080p" | "1440p" | "4k"
  preset: text("preset").notNull(), // "low" | "medium" | "high" | "ultra"
  rayTracing: integer("ray_tracing", { mode: "boolean" }).default(false),
  fpsLow: integer("fps_low").notNull(),
  fpsHigh: integer("fps_high").notNull(),
  source: text("source").notNull().default("interpolated"), // "real" | "interpolated"
  confidence: text("confidence").notNull(), // "high" | "medium" | "low"
});
