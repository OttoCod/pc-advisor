import { db } from "./client";
import { cpus, gpus, games, gameRequirements, benchmarks } from "./schema";

/**
 * IMPORTANTE sobre `relativePerformanceScore` (en cpus y gpus):
 * Es un valor de posicionamiento orientativo en escala 0-100, pensado únicamente
 * para que el motor de interpolación (lib/calculators/fps.ts) tenga un punto de
 * partida razonable desde el día uno. NO es un benchmark medido ni una cifra
 * oficial de ningún fabricante o suite de testing. A medida que se consigan
 * benchmarks reales, deben cargarse en la tabla `benchmarks` (source: "real"),
 * que siempre tiene prioridad sobre la interpolación por score.
 */

const cpuData: (typeof cpus.$inferInsert)[] = [
  { id: "ryzen-5-2600", brand: "AMD", model: "Ryzen 5 2600", generation: "Zen+", socket: "AM4", cores: 6, threads: 12, baseClockGhz: 3.4, boostClockGhz: 3.9, tdpWatts: 65, releaseYear: 2018, relativePerformanceScore: 25 },
  { id: "core-i3-10100", brand: "Intel", model: "Core i3-10100", generation: "10th gen", socket: "LGA1200", cores: 4, threads: 8, baseClockGhz: 3.6, boostClockGhz: 4.3, tdpWatts: 65, releaseYear: 2020, relativePerformanceScore: 28 },
  { id: "ryzen-3-3100", brand: "AMD", model: "Ryzen 3 3100", generation: "Zen2", socket: "AM4", cores: 4, threads: 8, baseClockGhz: 3.6, boostClockGhz: 3.9, tdpWatts: 65, releaseYear: 2020, relativePerformanceScore: 30 },
  { id: "ryzen-5-3600", brand: "AMD", model: "Ryzen 5 3600", generation: "Zen2", socket: "AM4", cores: 6, threads: 12, baseClockGhz: 3.6, boostClockGhz: 4.2, tdpWatts: 65, releaseYear: 2019, relativePerformanceScore: 38 },
  { id: "core-i5-10400f", brand: "Intel", model: "Core i5-10400F", generation: "10th gen", socket: "LGA1200", cores: 6, threads: 12, baseClockGhz: 2.9, boostClockGhz: 4.3, tdpWatts: 65, releaseYear: 2020, relativePerformanceScore: 40 },
  { id: "ryzen-5-5600", brand: "AMD", model: "Ryzen 5 5600", generation: "Zen3", socket: "AM4", cores: 6, threads: 12, baseClockGhz: 3.5, boostClockGhz: 4.4, tdpWatts: 65, releaseYear: 2022, relativePerformanceScore: 55 },
  { id: "ryzen-5-5600x", brand: "AMD", model: "Ryzen 5 5600X", generation: "Zen3", socket: "AM4", cores: 6, threads: 12, baseClockGhz: 3.7, boostClockGhz: 4.6, tdpWatts: 65, releaseYear: 2020, relativePerformanceScore: 58 },
  { id: "core-i5-12400f", brand: "Intel", model: "Core i5-12400F", generation: "12th gen", socket: "LGA1700", cores: 6, threads: 12, baseClockGhz: 2.5, boostClockGhz: 4.4, tdpWatts: 65, releaseYear: 2022, relativePerformanceScore: 60 },
  { id: "ryzen-7-5800x", brand: "AMD", model: "Ryzen 7 5800X", generation: "Zen3", socket: "AM4", cores: 8, threads: 16, baseClockGhz: 3.8, boostClockGhz: 4.7, tdpWatts: 105, releaseYear: 2020, relativePerformanceScore: 65 },
  { id: "ryzen-5-7600x", brand: "AMD", model: "Ryzen 5 7600X", generation: "Zen4", socket: "AM5", cores: 6, threads: 12, baseClockGhz: 4.7, boostClockGhz: 5.3, tdpWatts: 105, releaseYear: 2022, relativePerformanceScore: 74 },
  { id: "core-i7-12700k", brand: "Intel", model: "Core i7-12700K", generation: "12th gen", socket: "LGA1700", cores: 12, threads: 20, baseClockGhz: 3.6, boostClockGhz: 5.0, tdpWatts: 125, releaseYear: 2021, relativePerformanceScore: 80 },
  { id: "core-i5-13600k", brand: "Intel", model: "Core i5-13600K", generation: "13th gen", socket: "LGA1700", cores: 14, threads: 20, baseClockGhz: 3.5, boostClockGhz: 5.1, tdpWatts: 125, releaseYear: 2022, relativePerformanceScore: 82 },
  { id: "ryzen-7-7800x3d", brand: "AMD", model: "Ryzen 7 7800X3D", generation: "Zen4", socket: "AM5", cores: 8, threads: 16, baseClockGhz: 4.2, boostClockGhz: 5.0, tdpWatts: 120, releaseYear: 2023, relativePerformanceScore: 88 },
  { id: "ryzen-9-7950x", brand: "AMD", model: "Ryzen 9 7950X", generation: "Zen4", socket: "AM5", cores: 16, threads: 32, baseClockGhz: 4.5, boostClockGhz: 5.7, tdpWatts: 170, releaseYear: 2022, relativePerformanceScore: 90 },
  { id: "core-i9-13900k", brand: "Intel", model: "Core i9-13900K", generation: "13th gen", socket: "LGA1700", cores: 24, threads: 32, baseClockGhz: 3.0, boostClockGhz: 5.8, tdpWatts: 125, releaseYear: 2022, relativePerformanceScore: 95 },
];

const gpuData: (typeof gpus.$inferInsert)[] = [
  { id: "rx-580", brand: "AMD", model: "RX 580", vramGb: 8, tdpWatts: 185, releaseYear: 2017, supportsDlss: false, supportsFsr: true, supportsRayTracing: false, relativePerformanceScore: 22 },
  { id: "gtx-1650", brand: "NVIDIA", model: "GTX 1650", vramGb: 4, tdpWatts: 75, releaseYear: 2019, supportsDlss: false, supportsFsr: true, supportsRayTracing: false, relativePerformanceScore: 20 },
  { id: "gtx-1660-super", brand: "NVIDIA", model: "GTX 1660 Super", vramGb: 6, tdpWatts: 125, releaseYear: 2019, supportsDlss: false, supportsFsr: true, supportsRayTracing: false, relativePerformanceScore: 28 },
  { id: "rtx-2060", brand: "NVIDIA", model: "RTX 2060", vramGb: 6, tdpWatts: 160, releaseYear: 2019, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 35 },
  { id: "rtx-3050", brand: "NVIDIA", model: "RTX 3050", vramGb: 8, tdpWatts: 130, releaseYear: 2022, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 38 },
  { id: "rx-6600", brand: "AMD", model: "RX 6600", vramGb: 8, tdpWatts: 132, releaseYear: 2021, supportsDlss: false, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 42 },
  { id: "rtx-3060", brand: "NVIDIA", model: "RTX 3060", vramGb: 12, tdpWatts: 170, releaseYear: 2021, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 48 },
  { id: "rx-7600", brand: "AMD", model: "RX 7600", vramGb: 8, tdpWatts: 165, releaseYear: 2023, supportsDlss: false, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 52 },
  { id: "rtx-3060-ti", brand: "NVIDIA", model: "RTX 3060 Ti", vramGb: 8, tdpWatts: 200, releaseYear: 2020, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 55 },
  { id: "rtx-4060", brand: "NVIDIA", model: "RTX 4060", vramGb: 8, tdpWatts: 115, releaseYear: 2023, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 58 },
  { id: "rx-6700-xt", brand: "AMD", model: "RX 6700 XT", vramGb: 12, tdpWatts: 230, releaseYear: 2021, supportsDlss: false, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 60 },
  { id: "rtx-3070", brand: "NVIDIA", model: "RTX 3070", vramGb: 8, tdpWatts: 220, releaseYear: 2020, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 62 },
  { id: "rtx-4070", brand: "NVIDIA", model: "RTX 4070", vramGb: 12, tdpWatts: 200, releaseYear: 2023, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 72 },
  { id: "rx-7800-xt", brand: "AMD", model: "RX 7800 XT", vramGb: 16, tdpWatts: 263, releaseYear: 2023, supportsDlss: false, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 78 },
  { id: "rtx-3080", brand: "NVIDIA", model: "RTX 3080", vramGb: 10, tdpWatts: 320, releaseYear: 2020, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 75 },
  { id: "rtx-4070-ti-super", brand: "NVIDIA", model: "RTX 4070 Ti Super", vramGb: 16, tdpWatts: 285, releaseYear: 2024, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 85 },
  { id: "rtx-4090", brand: "NVIDIA", model: "RTX 4090", vramGb: 24, tdpWatts: 450, releaseYear: 2022, supportsDlss: true, supportsFsr: true, supportsRayTracing: true, relativePerformanceScore: 100 },
];

const gameData: (typeof games.$inferInsert)[] = [
  { id: "valorant", name: "Valorant", genre: "competitive", developer: "Riot Games", releaseYear: 2020, demandTier: 2, supportsRayTracing: false, supportsDlss: false, supportsFsr: false },
  { id: "cs2", name: "Counter-Strike 2", genre: "competitive", developer: "Valve", releaseYear: 2023, demandTier: 3, supportsRayTracing: false, supportsDlss: false, supportsFsr: false },
  { id: "league-of-legends", name: "League of Legends", genre: "competitive", developer: "Riot Games", releaseYear: 2009, demandTier: 2, supportsRayTracing: false, supportsDlss: false, supportsFsr: false },
  { id: "fortnite", name: "Fortnite", genre: "competitive", developer: "Epic Games", releaseYear: 2017, demandTier: 5, supportsRayTracing: true, supportsDlss: true, supportsFsr: true },
  { id: "apex-legends", name: "Apex Legends", genre: "competitive", developer: "Respawn Entertainment", releaseYear: 2019, demandTier: 5, supportsRayTracing: false, supportsDlss: true, supportsFsr: true },
  { id: "minecraft", name: "Minecraft", genre: "survival", developer: "Mojang Studios", releaseYear: 2011, demandTier: 3, supportsRayTracing: true, supportsDlss: false, supportsFsr: false },
  { id: "gta-v", name: "Grand Theft Auto V", genre: "aaa", developer: "Rockstar Games", releaseYear: 2015, demandTier: 5, supportsRayTracing: false, supportsDlss: false, supportsFsr: false },
  { id: "helldivers-2", name: "Helldivers 2", genre: "aaa", developer: "Arrowhead Game Studios", releaseYear: 2024, demandTier: 7, supportsRayTracing: false, supportsDlss: true, supportsFsr: true },
  { id: "elden-ring", name: "Elden Ring", genre: "rpg", developer: "FromSoftware", releaseYear: 2022, demandTier: 6, supportsRayTracing: false, supportsDlss: false, supportsFsr: false },
  { id: "baldurs-gate-3", name: "Baldur's Gate 3", genre: "rpg", developer: "Larian Studios", releaseYear: 2023, demandTier: 6, supportsRayTracing: false, supportsDlss: false, supportsFsr: true },
  { id: "red-dead-redemption-2", name: "Red Dead Redemption 2", genre: "aaa", developer: "Rockstar Games", releaseYear: 2019, demandTier: 8, supportsRayTracing: false, supportsDlss: false, supportsFsr: false },
  { id: "cyberpunk-2077", name: "Cyberpunk 2077", genre: "rpg", developer: "CD Projekt Red", releaseYear: 2020, demandTier: 9, supportsRayTracing: true, supportsDlss: true, supportsFsr: true },
];

const requirementsData: (typeof gameRequirements.$inferInsert)[] = [
  { gameId: "valorant", tier: "minimum", cpuText: "Intel Core 2 Duo E8400", gpuText: "Intel HD 4000", ramGb: 4, storageGb: 30 },
  { gameId: "valorant", tier: "recommended", cpuText: "Intel Core i3-4150", gpuText: "GTX 1050 Ti", ramGb: 8, storageGb: 30 },
  { gameId: "cs2", tier: "minimum", cpuText: "Core i5-750 / Athlon II X4 645", gpuText: "GTX 660 / Radeon HD 7850", ramGb: 8, storageGb: 85 },
  { gameId: "cs2", tier: "recommended", cpuText: "Core i5-9400", gpuText: "GTX 1660 Super", ramGb: 16, storageGb: 85 },
  { gameId: "league-of-legends", tier: "minimum", cpuText: "Core i3-530", gpuText: "GT 640", ramGb: 4, storageGb: 20 },
  { gameId: "league-of-legends", tier: "recommended", cpuText: "Core i5-3300", gpuText: "GTX 560", ramGb: 8, storageGb: 20 },
  { gameId: "fortnite", tier: "minimum", cpuText: "Core i3-3225", gpuText: "Intel HD 4000", ramGb: 8, storageGb: 30 },
  { gameId: "fortnite", tier: "recommended", cpuText: "Core i5-7300U", gpuText: "GTX 960", ramGb: 16, storageGb: 30 },
  { gameId: "apex-legends", tier: "minimum", cpuText: "Core i3-6300", gpuText: "GT 640", ramGb: 6, storageGb: 75 },
  { gameId: "apex-legends", tier: "recommended", cpuText: "Core i5-3570K", gpuText: "GTX 970", ramGb: 8, storageGb: 75 },
  { gameId: "minecraft", tier: "minimum", cpuText: "Intel Core i3-3210", gpuText: "Intel HD Graphics 4000", ramGb: 4, storageGb: 4 },
  { gameId: "minecraft", tier: "recommended", cpuText: "Intel Core i5-4690", gpuText: "GTX 700 Series", ramGb: 8, storageGb: 4 },
  { gameId: "gta-v", tier: "minimum", cpuText: "Core 2 Quad Q6600", gpuText: "9800 GT 1GB", ramGb: 4, storageGb: 95 },
  { gameId: "gta-v", tier: "recommended", cpuText: "Core i5-3470", gpuText: "GTX 660", ramGb: 8, storageGb: 95 },
  { gameId: "helldivers-2", tier: "minimum", cpuText: "Core i7-4790K", gpuText: "GTX 1050 Ti", ramGb: 8, storageGb: 100 },
  { gameId: "helldivers-2", tier: "recommended", cpuText: "Core i7-9700K", gpuText: "RTX 2060 Super", ramGb: 16, storageGb: 100 },
  { gameId: "elden-ring", tier: "minimum", cpuText: "Core i5-8400", gpuText: "GTX 1060 3GB", ramGb: 12, storageGb: 60 },
  { gameId: "elden-ring", tier: "recommended", cpuText: "Core i7-8700K", gpuText: "GTX 1070 8GB", ramGb: 16, storageGb: 60 },
  { gameId: "baldurs-gate-3", tier: "minimum", cpuText: "Core i5-4690", gpuText: "GTX 970", ramGb: 8, storageGb: 150 },
  { gameId: "baldurs-gate-3", tier: "recommended", cpuText: "Core i7-8700K", gpuText: "RTX 2060", ramGb: 16, storageGb: 150 },
  { gameId: "red-dead-redemption-2", tier: "minimum", cpuText: "Core i5-2500K", gpuText: "GTX 770 2GB", ramGb: 8, storageGb: 150 },
  { gameId: "red-dead-redemption-2", tier: "recommended", cpuText: "Core i7-4770K", gpuText: "GTX 1060 6GB", ramGb: 12, storageGb: 150 },
  { gameId: "cyberpunk-2077", tier: "minimum", cpuText: "Core i7-6700", gpuText: "GTX 1060 6GB", ramGb: 12, storageGb: 70 },
  { gameId: "cyberpunk-2077", tier: "recommended", cpuText: "Core i7-12700", gpuText: "RTX 2060 Super", ramGb: 16, storageGb: 70 },
];

// Benchmarks reales cargados a mano (source: "real", confidence: "high"), usados
// como referencia exacta por el motor de FPS cuando la combinación coincide.
// El resto de las combinaciones se resuelve por interpolación (ver lib/calculators/fps.ts).
const benchmarkData: (typeof benchmarks.$inferInsert)[] = [
  { cpuId: "ryzen-5-5600x", gpuId: "rtx-3060", gameId: "cyberpunk-2077", resolution: "1080p", preset: "high", rayTracing: false, fpsLow: 52, fpsHigh: 64, source: "real", confidence: "high" },
  { cpuId: "ryzen-5-5600x", gpuId: "rtx-3060", gameId: "cyberpunk-2077", resolution: "1440p", preset: "high", rayTracing: false, fpsLow: 38, fpsHigh: 48, source: "real", confidence: "high" },
  { cpuId: "ryzen-5-5600x", gpuId: "rtx-3060", gameId: "valorant", resolution: "1080p", preset: "high", rayTracing: false, fpsLow: 280, fpsHigh: 340, source: "real", confidence: "high" },
  { cpuId: "core-i5-12400f", gpuId: "rtx-4070", gameId: "elden-ring", resolution: "1440p", preset: "high", rayTracing: false, fpsLow: 65, fpsHigh: 75, source: "real", confidence: "high" },
  { cpuId: "core-i5-12400f", gpuId: "rtx-4070", gameId: "baldurs-gate-3", resolution: "1080p", preset: "ultra", rayTracing: false, fpsLow: 70, fpsHigh: 85, source: "real", confidence: "high" },
  { cpuId: "ryzen-7-7800x3d", gpuId: "rtx-4090", gameId: "cs2", resolution: "1080p", preset: "high", rayTracing: false, fpsLow: 450, fpsHigh: 550, source: "real", confidence: "high" },
  { cpuId: "ryzen-7-7800x3d", gpuId: "rtx-4090", gameId: "cyberpunk-2077", resolution: "4k", preset: "ultra", rayTracing: true, fpsLow: 45, fpsHigh: 60, source: "real", confidence: "high" },
  { cpuId: "core-i3-10100", gpuId: "gtx-1650", gameId: "gta-v", resolution: "1080p", preset: "medium", rayTracing: false, fpsLow: 55, fpsHigh: 68, source: "real", confidence: "high" },
  { cpuId: "ryzen-5-3600", gpuId: "rtx-3060-ti", gameId: "red-dead-redemption-2", resolution: "1080p", preset: "high", rayTracing: false, fpsLow: 60, fpsHigh: 72, source: "real", confidence: "high" },
  { cpuId: "ryzen-9-7950x", gpuId: "rtx-4070-ti-super", gameId: "helldivers-2", resolution: "1440p", preset: "high", rayTracing: false, fpsLow: 90, fpsHigh: 105, source: "real", confidence: "high" },
];

async function main() {
  console.log("Seeding database...");

  await db.delete(benchmarks);
  await db.delete(gameRequirements);
  await db.delete(games);
  await db.delete(gpus);
  await db.delete(cpus);

  await db.insert(cpus).values(cpuData);
  console.log(`  ${cpuData.length} CPUs`);

  await db.insert(gpus).values(gpuData);
  console.log(`  ${gpuData.length} GPUs`);

  await db.insert(games).values(gameData);
  console.log(`  ${gameData.length} juegos`);

  await db.insert(gameRequirements).values(requirementsData);
  console.log(`  ${requirementsData.length} filas de requisitos`);

  await db.insert(benchmarks).values(benchmarkData);
  console.log(`  ${benchmarkData.length} benchmarks reales`);

  console.log("Listo.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
