export type PcTier = "S" | "A" | "B" | "C" | "D" | "E" | "F";

export interface TierResult {
  tier: PcTier;
  label: string;
  message: string;
}

export const TIER_LABELS: Record<PcTier, string> = {
  S: "Entusiasta",
  A: "Muy alto",
  B: "Alto",
  C: "Medio",
  D: "Bajo",
  E: "Entrada",
  F: "Obsoleto",
};

// Umbrales sobre overallScore (0-100, ya clampeado en profile.ts).
const TIER_THRESHOLDS: { tier: PcTier; min: number }[] = [
  { tier: "S", min: 90 },
  { tier: "A", min: 78 },
  { tier: "B", min: 63 },
  { tier: "C", min: 48 },
  { tier: "D", min: 33 },
  { tier: "E", min: 18 },
  { tier: "F", min: 0 },
];

const TIER_MESSAGES: Record<PcTier, string[]> = {
  S: [
    "Tu PC no juega, hace trampa. Ultra en todo, sin culpa.",
    "Esto ya no es hardware, es un arma de destrucción de FPS masiva.",
    "Con esta PC el límite no es tu equipo, sos vos jugando mal.",
  ],
  A: [
    "PC de la que todos hablan mal por envidia. Casi todo corre perfecto.",
    "Estás un escalón abajo de lo top, y ni se nota.",
    "Con esto podés jugar tranquilo y todavía te sobra margen.",
  ],
  B: [
    "Buena PC, seria. No brilla en las specs pero labura como nadie.",
    "No es la más linda de la fiesta pero baila bien todos los juegos.",
    "Rendimiento sólido: sin lujos, sin dramas.",
  ],
  C: [
    "Cumple. Ni te hace quedar como capo ni te da vergüenza mostrarla.",
    "Cumplidora silenciosa: no impresiona a nadie, pero tampoco falla.",
    "PC del montón, en el buen sentido. Corre lo importante.",
  ],
  D: [
    "Tu PC va a fuego lento. Empezá a juntar plata para un upgrade.",
    "Se puede jugar, sí. ¿Cómodo? Ya es otra discusión.",
    "Rendimiento ajustado. Bajale el preset y hacé de cuenta que no pasa nada.",
  ],
  E: [
    "Estás en modo supervivencia. Cada FPS se pelea con uñas y dientes.",
    "Esto corre PowerPoint con más fluidez que algunos juegos.",
    "Nivel de entrada real: cualquier cosa moderna te va a hacer sufrir.",
  ],
  F: [
    "Esto ya no es una PC gamer, es una pieza de museo.",
    "Con este hardware, hasta el Buscaminas pide clemencia.",
    "Momento de ser honestos: esta PC no juega, sobrevive.",
  ],
};

export function tierFromScore(score: number): PcTier {
  const match = TIER_THRESHOLDS.find((t) => score >= t.min);
  return match ? match.tier : "F";
}

// Hash simple y determinístico: mismo hardware siempre muestra el mismo mensaje,
// pero distintas combinaciones dentro de un mismo tier pueden variar.
function pickMessage(tier: PcTier, seed: string): string {
  const pool = TIER_MESSAGES[tier];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}

export function computeTier(overallScore: number, seed: string): TierResult {
  const tier = tierFromScore(overallScore);
  return { tier, label: TIER_LABELS[tier], message: pickMessage(tier, seed) };
}
