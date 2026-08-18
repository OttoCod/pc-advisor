"use client";

import { useEffect, useState } from "react";

interface DiagnosticBarProps {
  label: string;
  value: number; // 0-100
  sublabel?: string;
  size?: "md" | "lg";
}

const TICKS = 10;

export function DiagnosticBar({ label, value, sublabel, size = "md" }: DiagnosticBarProps) {
  const [display, setDisplay] = useState(0);
  const [locked, setLocked] = useState(false);
  const target = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplay(target);
      setLocked(true);
      return;
    }

    let raf: number;
    const duration = 900;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * target);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        setLocked(true);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const roundedDisplay = Math.round(display);

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className={`font-body text-fg-muted ${size === "lg" ? "text-sm" : "text-xs"}`}>{label}</span>
        <span
          className={`font-mono tabular-nums text-fg ${size === "lg" ? "text-3xl font-medium" : "text-sm"}`}
        >
          {roundedDisplay}
          <span className="text-fg-muted">{size === "lg" ? "/100" : ""}</span>
        </span>
      </div>
      <div
        className={`relative h-2.5 overflow-hidden rounded-full border border-border bg-surface-2 ${locked ? "animate-lock-in" : ""}`}
      >
        <div className="absolute inset-0 z-10 flex justify-between">
          {Array.from({ length: TICKS - 1 }).map((_, i) => (
            <span key={i} className="h-full w-px bg-bg/60" />
          ))}
        </div>
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${display}%` }}
        />
      </div>
      {sublabel && <p className="mt-1.5 text-xs text-fg-muted">{sublabel}</p>}
    </div>
  );
}
