import { eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import { db } from "@/db/client";
import { cpus, gpus } from "@/db/schema";
import { analyzeBalance } from "@/lib/calculators/bottleneck";
import { computeProfile } from "@/lib/calculators/profile";
import { parseShareParams } from "@/lib/shareParams";

const COLORS = {
  bg: "#0b0d10",
  surface: "#12161c",
  surface2: "#171c24",
  border: "#232a34",
  fg: "#f5f7fa",
  fgMuted: "#9ca3af",
  accent: "#5b8cff",
  good: "#34d399",
  warn: "#f5a623",
  danger: "#f0574f",
};

function severityColor(severity: string): string {
  if (severity === "fuerte") return COLORS.danger;
  if (severity === "moderada" || severity === "leve") return COLORS.warn;
  return COLORS.good;
}

function fallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.bg,
          color: COLORS.fg,
          fontSize: 48,
        }}
      >
        PC Advisor
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shared = parseShareParams(Object.fromEntries(searchParams));
  if (!shared) return fallbackImage();

  const [cpuRows, gpuRows] = await Promise.all([
    db.select().from(cpus).where(eq(cpus.id, shared.cpuId)),
    db.select().from(gpus).where(eq(gpus.id, shared.gpuId)),
  ]);
  const cpu = cpuRows[0];
  const gpu = gpuRows[0];
  if (!cpu || !gpu) return fallbackImage();

  const profile = computeProfile(cpu, gpu, shared.ramGb);
  const [balance] = analyzeBalance(cpu, gpu, [shared.resolution]);
  const limitLabel =
    balance.limitingComponent === "balanced" ? "Equilibrado" : balance.limitingComponent.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: COLORS.bg,
          padding: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              color: COLORS.accent,
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            PC ADVISOR
          </div>
          <div style={{ display: "flex", color: COLORS.fgMuted, fontSize: 20 }}>Diagnóstico de PC</div>
        </div>

        <div style={{ display: "flex", marginTop: 44, alignItems: "flex-end", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 148, fontWeight: 700, color: COLORS.fg, lineHeight: 1 }}>
            {profile.overallScore}
          </div>
          <div style={{ display: "flex", fontSize: 36, color: COLORS.fgMuted, marginBottom: 22 }}>/100</div>
        </div>

        <div style={{ display: "flex", fontSize: 28, color: COLORS.fg, marginTop: 4 }}>
          {cpu.brand} {cpu.model} · {gpu.brand} {gpu.model}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {profile.bars.map((bar) => (
            <div
              key={bar.key}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: COLORS.surface,
                borderRadius: 12,
                padding: 20,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div style={{ display: "flex", fontSize: 15, color: COLORS.fgMuted }}>{bar.label}</div>
              <div style={{ display: "flex", fontSize: 30, color: COLORS.fg, marginTop: 6 }}>{bar.score}</div>
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  height: 8,
                  borderRadius: 4,
                  background: COLORS.surface2,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    height: 8,
                    borderRadius: 4,
                    background: COLORS.accent,
                    width: `${bar.score}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              fontSize: 20,
              color: severityColor(balance.severity),
              border: `1px solid ${severityColor(balance.severity)}`,
            }}
          >
            {shared.resolution} · {limitLabel}
          </div>
        </div>

        <div style={{ display: "flex", marginTop: "auto", justifyContent: "flex-end", color: COLORS.fgMuted, fontSize: 18 }}>
          pc-advisor
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
