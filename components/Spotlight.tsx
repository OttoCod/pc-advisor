"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
}

export function Spotlight({ children, className = "" }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={`group/spot relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, var(--accent) 28%, transparent), transparent 70%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
