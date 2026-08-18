"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DiagnosticBar } from "@/components/DiagnosticBar";
import { Spotlight } from "@/components/Spotlight";
import type { BottleneckResult, LimitingComponent, Severity } from "@/lib/calculators/bottleneck";
import type { GameEstimate } from "@/lib/calculators/gamesYouCanPlay";
import type { ProfileResult } from "@/lib/calculators/profile";
import type { Cpu, Gpu, Preset, RamGb, Resolution } from "@/lib/calculators/types";
import { PRESETS, RAM_OPTIONS, RESOLUTIONS } from "@/lib/calculators/types";
import { listUpgradeCandidates, type UpgradeSuggestion } from "@/lib/calculators/upgrade";
import { buildShareSearch, type ShareParams } from "@/lib/shareParams";

interface CompareResponse {
  candidate: Cpu | Gpu;
  profile: ProfileResult;
  games: GameEstimate[];
}

interface AnalyzeResponse {
  cpu: Cpu;
  gpu: Gpu;
  ramGb: RamGb;
  resolution: Resolution;
  profile: ProfileResult;
  balance: BottleneckResult[];
  upgrades: UpgradeSuggestion[];
  games: GameEstimate[];
}

const PRESET_LABELS: Record<Preset, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  ultra: "Ultra",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "alta",
  medium: "media",
  low: "baja",
};

const COMPONENT_LABELS: Record<LimitingComponent, string> = {
  cpu: "CPU",
  gpu: "GPU",
  balanced: "Equilibrado",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  none: "Equilibrado",
  leve: "Leve",
  moderada: "Moderada",
  fuerte: "Fuerte",
};

function severityTone(severity: Severity): string {
  if (severity === "fuerte") return "text-danger border-danger/40 bg-danger/10";
  if (severity === "moderada" || severity === "leve") return "text-warn border-warn/40 bg-warn/10";
  return "text-good border-good/40 bg-good/10";
}

function confidenceTone(confidence: string): string {
  if (confidence === "high") return "text-good border-good/40";
  if (confidence === "medium") return "text-warn border-warn/40";
  return "text-fg-muted border-border";
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-dot-pulse h-1.5 w-1.5 rounded-full bg-white"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

function StarRating({ priority }: { priority: number }) {
  return (
    <span className="font-mono text-sm text-accent" aria-label={`Prioridad ${priority} de 5`}>
      {"★".repeat(priority)}
      <span className="text-border">{"★".repeat(5 - priority)}</span>
    </span>
  );
}

function ShareButton({ result }: { result: AnalyzeResponse }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/analizar?${buildShareSearch({
          cpuId: result.cpu.id,
          gpuId: result.gpu.id,
          ramGb: result.ramGb,
          resolution: result.resolution,
        })}`
      : "";

  async function handleShareClick() {
    setOpen(true);
    setCopied(false);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — the input below still lets the user copy manually
    }
    requestAnimationFrame(() => inputRef.current?.select());
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleShareClick}
        className="btn-sheen inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs font-medium text-fg transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-dim"
      >
        {copied ? "¡Copiado!" : "Compartir mi diagnóstico"}
      </button>
      {open && (
        <input
          ref={inputRef}
          readOnly
          value={shareUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="animate-fade-up w-full max-w-xs rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-fg-muted outline-none focus:border-accent sm:max-w-sm"
        />
      )}
    </div>
  );
}

function UpgradeCandidates({
  component,
  current,
  candidates,
  cpuId,
  gpuId,
  ramGb,
  resolution,
  preset,
  mainGames,
  currentOverallScore,
}: {
  component: "cpu" | "gpu";
  current: Cpu | Gpu;
  candidates: (Cpu | Gpu)[];
  cpuId: string;
  gpuId: string;
  ramGb: RamGb;
  resolution: Resolution;
  preset: Preset;
  mainGames: GameEstimate[];
  currentOverallScore: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<CompareResponse | null>(null);

  if (candidates.length === 0) return null;

  async function handleSelect(candidateId: string) {
    setSelectedId(candidateId);
    setLoading(true);
    setError(null);
    setComparison(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpuId, gpuId, ramGb, resolution, replace: component, candidateId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No pudimos comparar. Intentá de nuevo.");
      }

      const data: CompareResponse = await res.json();
      setComparison(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const mainGamesById = new Map(mainGames.map((g) => [g.gameId, g]));
  const sortedComparisonGames = comparison
    ? [...comparison.games].sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const scoreImproved = comparison ? comparison.profile.overallScore > currentOverallScore : false;

  return (
    <div className="mt-6 border-t border-border pt-5">
      <p className="text-xs text-fg-muted">
        {component === "cpu" ? "CPUs" : "GPUs"} mejores que tu {current.brand} {current.model}, de menor a
        mayor:
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {candidates.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => handleSelect(candidate.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedId === candidate.id
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface-2 text-fg-muted hover:text-fg"
            }`}
          >
            {candidate.brand} {candidate.model}
          </button>
        ))}
      </div>

      {loading && (
        <p className="mt-4 flex items-center gap-2 text-xs text-fg-muted">
          Calculando comparación <LoadingDots />
        </p>
      )}

      {error && <p className="mt-4 text-xs text-danger">{error}</p>}

      {comparison && !loading && (
        <div className="animate-fade-up mt-4 rounded-lg border border-border bg-surface-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <span>Puntaje general:</span>
            <span className="font-mono text-fg-muted">{currentOverallScore}</span>
            <span>→</span>
            <span className={`font-mono font-medium ${scoreImproved ? "text-good" : "text-fg"}`}>
              {comparison.profile.overallScore}
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                  <th className="pb-2 font-medium">Juego</th>
                  <th className="pb-2 font-medium">FPS actual</th>
                  <th className="pb-2 font-medium">
                    FPS con {comparison.candidate.brand} {comparison.candidate.model}
                  </th>
                  <th className="pb-2 font-medium">Δ</th>
                </tr>
              </thead>
              <tbody>
                {sortedComparisonGames.map((game) => {
                  const before = mainGamesById.get(game.gameId)?.estimates[preset];
                  const after = game.estimates[preset];
                  if (!before) return null;
                  const beforeMid = (before.fpsLow + before.fpsHigh) / 2;
                  const afterMid = (after.fpsLow + after.fpsHigh) / 2;
                  const delta = Math.round(afterMid - beforeMid);
                  return (
                    <tr key={game.gameId} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 text-fg">{game.name}</td>
                      <td className="py-2.5 font-mono tabular-nums text-fg-muted">
                        {before.fpsLow}–{before.fpsHigh}
                      </td>
                      <td className="py-2.5 font-mono tabular-nums text-fg">
                        {after.fpsLow}–{after.fpsHigh}
                      </td>
                      <td
                        className={`py-2.5 font-mono tabular-nums ${
                          delta > 0 ? "text-good" : delta < 0 ? "text-danger" : "text-fg-muted"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-fg-muted">
            Estimación manteniendo el resto de tu hardware igual, a {resolution} y calidad{" "}
            {PRESET_LABELS[preset].toLowerCase()}. Sigue siendo una proyección, no una medición.
          </p>
        </div>
      )}
    </div>
  );
}

export function AnalyzerForm({
  cpus,
  gpus,
  initialShare,
}: {
  cpus: Cpu[];
  gpus: Gpu[];
  initialShare?: ShareParams | null;
}) {
  const [cpuId, setCpuId] = useState(initialShare?.cpuId ?? "");
  const [gpuId, setGpuId] = useState(initialShare?.gpuId ?? "");
  const [ramGb, setRamGb] = useState<RamGb>(initialShare?.ramGb ?? 16);
  const [resolution, setResolution] = useState<Resolution>(initialShare?.resolution ?? "1080p");
  const [preset, setPreset] = useState<Preset>("high");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const canSubmit = cpuId !== "" && gpuId !== "" && !loading;

  const runAnalysis = useCallback(
    async (params: { cpuId: string; gpuId: string; ramGb: RamGb; resolution: Resolution }) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "No pudimos analizar tu PC. Intentá de nuevo.");
        }

        const data: AnalyzeResponse = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !initialShare) return;
    autoRan.current = true;
    runAnalysis(initialShare);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    runAnalysis({ cpuId, gpuId, ramGb, resolution });
  }

  return (
    <div className="space-y-10">
      <form
        onSubmit={handleSubmit}
        className="animate-fade-up grid gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-fg-muted">Procesador (CPU)</span>
          <select
            value={cpuId}
            onChange={(e) => setCpuId(e.target.value)}
            required
            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-fg outline-none transition-colors focus:border-accent"
          >
            <option value="" disabled>
              Elegí tu CPU
            </option>
            {cpus.map((cpu) => (
              <option key={cpu.id} value={cpu.id}>
                {cpu.brand} {cpu.model}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-fg-muted">Placa de video (GPU)</span>
          <select
            value={gpuId}
            onChange={(e) => setGpuId(e.target.value)}
            required
            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-fg outline-none transition-colors focus:border-accent"
          >
            <option value="" disabled>
              Elegí tu GPU
            </option>
            {gpus.map((gpu) => (
              <option key={gpu.id} value={gpu.id}>
                {gpu.brand} {gpu.model}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-fg-muted">Memoria RAM</span>
          <select
            value={ramGb}
            onChange={(e) => setRamGb(Number(e.target.value) as RamGb)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-fg outline-none transition-colors focus:border-accent"
          >
            {RAM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} GB
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-fg-muted">Resolución</span>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as Resolution)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-fg outline-none transition-colors focus:border-accent"
          >
            {RESOLUTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-sheen inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
          >
            {loading ? (
              <>
                Analizando <LoadingDots />
              </>
            ) : (
              "Analizar mi PC"
            )}
          </button>
        </div>
      </form>

      {error && (
        <p className="animate-fade-up rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {result && (
        <Results
          key={`${result.cpu.id}-${result.gpu.id}-${result.ramGb}-${result.resolution}`}
          result={result}
          preset={preset}
          onPresetChange={setPreset}
          cpus={cpus}
          gpus={gpus}
        />
      )}
    </div>
  );
}

function Results({
  result,
  preset,
  onPresetChange,
  cpus,
  gpus,
}: {
  result: AnalyzeResponse;
  preset: Preset;
  onPresetChange: (preset: Preset) => void;
  cpus: Cpu[];
  gpus: Gpu[];
}) {
  const sortedGames = [...result.games].sort((a, b) => a.name.localeCompare(b.name));

  const primaryUpgrade = result.upgrades.find(
    (u): u is UpgradeSuggestion & { component: "cpu" | "gpu" } =>
      (u.component === "cpu" || u.component === "gpu") && u.priority >= 3
  );
  const upgradeCandidates = primaryUpgrade
    ? listUpgradeCandidates(
        primaryUpgrade.component === "cpu" ? result.cpu : result.gpu,
        primaryUpgrade.component === "cpu" ? cpus : gpus
      )
    : [];

  return (
    <div className="space-y-10">
      {/* 1. Estado de tu PC */}
      <section className="animate-fade-up rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-fg">Estado de tu PC</h2>
            <p className="mt-1 text-xs text-fg-muted">
              Puntaje orientativo 0-100 según tu hardware. No es una medición absoluta.
            </p>
          </div>
          <ShareButton result={result} />
        </div>

        <div className="mt-6 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex w-full flex-col items-center gap-2 sm:w-56 sm:border-r sm:border-border sm:pr-8">
            <DiagnosticBar label="Puntaje general" value={result.profile.overallScore} size="lg" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {result.profile.bars.map((bar, i) => (
              <div key={bar.key} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <DiagnosticBar label={bar.label} value={bar.score} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Qué está limitando tu PC */}
      <section className="animate-fade-up rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-fg">¿Qué está limitando tu PC?</h2>
        <p className="mt-1 text-xs text-fg-muted">
          El límite cambia según la resolución: a mayor resolución, más peso tiene la GPU.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {result.balance.map((b, i) => (
            <div key={b.resolution} className="animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
              <Spotlight className="rounded-lg border border-border bg-surface-2 p-4 transition-colors duration-200 hover:border-accent-dim">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-fg">{b.resolution}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${severityTone(b.severity)}`}
                  >
                    {b.limitingComponent === "balanced"
                      ? SEVERITY_LABELS.none
                      : `${COMPONENT_LABELS[b.limitingComponent]} · ${SEVERITY_LABELS[b.severity]}`}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{b.explanation}</p>
              </Spotlight>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Qué deberías actualizar */}
      <section className="animate-fade-up rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-fg">¿Qué deberías actualizar?</h2>
        <p className="mt-1 text-xs text-fg-muted">
          Prioridad calculada para {result.resolution}, tu resolución objetivo.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {result.upgrades.map((upgrade, i) => (
            <div key={upgrade.component} className="animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
              <Spotlight className="rounded-lg border border-border bg-surface-2 p-4 transition-colors duration-200 hover:border-accent-dim">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-fg">
                    {upgrade.component}
                  </span>
                  <StarRating priority={upgrade.priority} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">{upgrade.reason}</p>
              </Spotlight>
            </div>
          ))}
        </div>

        {primaryUpgrade && upgradeCandidates.length > 0 && (
          <UpgradeCandidates
            component={primaryUpgrade.component}
            current={primaryUpgrade.component === "cpu" ? result.cpu : result.gpu}
            candidates={upgradeCandidates}
            cpuId={result.cpu.id}
            gpuId={result.gpu.id}
            ramGb={result.ramGb}
            resolution={result.resolution}
            preset={preset}
            mainGames={result.games}
            currentOverallScore={result.profile.overallScore}
          />
        )}
      </section>

      {/* 4. Qué juegos podés jugar */}
      <section className="animate-fade-up rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-fg">¿Qué juegos podés jugar?</h2>
            <p className="mt-1 text-xs text-fg-muted">FPS estimados a {result.resolution}.</p>
          </div>

          <div className="relative grid grid-cols-4 rounded-lg border border-border bg-surface-2 p-1">
            <div
              aria-hidden
              className="absolute inset-y-1 rounded-md bg-accent transition-[left] duration-300 ease-out"
              style={{ left: `calc(${PRESETS.indexOf(preset)} * 25% + 2px)`, width: "calc(25% - 4px)" }}
            />
            {PRESETS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onPresetChange(option)}
                className={`relative z-10 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  preset === option ? "text-white" : "text-fg-muted hover:text-fg"
                }`}
              >
                {PRESET_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                <th className="pb-2 font-medium">Juego</th>
                <th className="pb-2 font-medium">Género</th>
                <th className="pb-2 font-medium">FPS estimado</th>
                <th className="pb-2 font-medium">Confianza</th>
              </tr>
            </thead>
            <tbody>
              {sortedGames.map((game) => {
                const estimate = game.estimates[preset];
                return (
                  <tr
                    key={game.gameId}
                    className="border-b border-border/60 transition-colors duration-150 last:border-0 hover:bg-surface-2"
                  >
                    <td className="py-3 text-fg">{game.name}</td>
                    <td className="py-3 capitalize text-fg-muted">{game.genre ?? "—"}</td>
                    <td className="py-3 font-mono tabular-nums text-fg">
                      {estimate.fpsLow}–{estimate.fpsHigh} FPS
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${confidenceTone(estimate.confidence)}`}
                      >
                        {CONFIDENCE_LABELS[estimate.confidence]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-fg-muted">
          Los FPS son estimaciones, no mediciones exactas. Se muestran siempre como rango, y la
          confianza indica si están respaldados por un benchmark real (alta) o interpolados a
          partir de tu hardware (media/baja).
        </p>
      </section>
    </div>
  );
}
