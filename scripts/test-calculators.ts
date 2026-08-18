import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { benchmarks, cpus, games, gpus } from "../db/schema";
import { analyzeBalance } from "../lib/calculators/bottleneck";
import { computeProfile } from "../lib/calculators/profile";
import { gamesYouCanPlay } from "../lib/calculators/gamesYouCanPlay";
import { suggestUpgrades } from "../lib/calculators/upgrade";
import type { RamGb, Resolution } from "../lib/calculators/types";

async function main() {
  const [cpu] = await db.select().from(cpus).where(eq(cpus.id, "ryzen-5-5600x"));
  const [gpu] = await db.select().from(gpus).where(eq(gpus.id, "rtx-3060"));
  const allGames = await db.select().from(games);
  const allBenchmarks = await db.select().from(benchmarks);

  if (!cpu || !gpu) {
    throw new Error("No se encontraron datos de seed. Corré `npm run db:seed` primero.");
  }

  const ramGb: RamGb = 16;
  const targetResolution: Resolution = "1440p";

  console.log("=== PC Advisor — smoke test del motor de cálculo ===\n");
  console.log(`CPU: ${cpu.brand} ${cpu.model} (score ${cpu.relativePerformanceScore})`);
  console.log(`GPU: ${gpu.brand} ${gpu.model} (score ${gpu.relativePerformanceScore})`);
  console.log(`RAM: ${ramGb} GB — Resolución objetivo: ${targetResolution}\n`);

  console.log("--- Estado de tu PC ---");
  const profile = computeProfile(cpu, gpu, ramGb);
  console.log(`Puntaje general: ${profile.overallScore}/100`);
  for (const bar of profile.bars) {
    console.log(`  ${bar.label.padEnd(22)} ${bar.score}/100`);
  }

  console.log("\n--- ¿Qué está limitando tu PC? ---");
  const balance = analyzeBalance(cpu, gpu, ["1080p", "1440p", "4k"]);
  for (const b of balance) {
    console.log(`  [${b.resolution}] ${b.limitingComponent.toUpperCase()} (${b.severity}) — ${b.explanation}`);
  }

  console.log("\n--- ¿Qué deberías actualizar? ---");
  const upgrades = suggestUpgrades(cpu, gpu, ramGb, targetResolution);
  for (const u of upgrades) {
    const stars = "★".repeat(u.priority) + "☆".repeat(5 - u.priority);
    console.log(`  ${u.component.toUpperCase().padEnd(4)} ${stars}  ${u.reason}`);
  }

  console.log(`\n--- ¿Qué juegos podés jugar? (${targetResolution}, preset alto) ---`);
  const gamesList = gamesYouCanPlay({ cpu, gpu, games: allGames, benchmarks: allBenchmarks, resolution: targetResolution });
  for (const g of gamesList) {
    const e = g.estimates.high;
    console.log(`  ${g.name.padEnd(26)} ${String(e.fpsLow).padStart(3)}-${e.fpsHigh} FPS  (confianza ${e.confidence}, ${e.source})`);
  }

  console.log("\nOK — motor de cálculo funcionando de punta a punta.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
