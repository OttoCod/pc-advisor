export type DemandLevel = "bajo" | "medio" | "alto";

export interface ComponentDemand {
  cpu: DemandLevel;
  gpu: DemandLevel;
  ram: DemandLevel;
}

function levelFromScore(score: number): DemandLevel {
  if (score <= 3) return "bajo";
  if (score <= 6) return "medio";
  return "alto";
}

/**
 * Estimación orientativa de cuánto exige un juego a cada componente, a partir
 * de su demandTier (1-10, pensado originalmente como exigencia gráfica general)
 * y su género. No es un perfilado real por componente: los títulos competitivos
 * suelen pedir más CPU de lo que su demandTier gráfico sugiere (buscan FPS muy
 * altos), así que se les suma un ajuste; el resto de los géneros restan un poco,
 * ya que en general la GPU es el cuello de botella más común.
 */
export function computeComponentDemand(game: { genre: string | null; demandTier: number }): ComponentDemand {
  const gpu = levelFromScore(game.demandTier);

  const isCompetitive = game.genre === "competitive";
  const cpuScore = isCompetitive ? game.demandTier + 3 : game.demandTier - 1;
  const cpu = levelFromScore(Math.max(1, cpuScore));

  const ram = levelFromScore(game.demandTier);

  return { cpu, gpu, ram };
}
