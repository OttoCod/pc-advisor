"use client";

import { useEffect, useRef, useState } from "react";

const DOT_SIZE = 6;
const PADDING = 6;

export function CursorTargetLock() {
  const frameRef = useRef<HTMLDivElement>(null);
  const current = useRef({ x: 0, y: 0, w: DOT_SIZE, h: DOT_SIZE });
  const target = useRef({ x: 0, y: 0, w: DOT_SIZE, h: DOT_SIZE });
  const lockedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (prefersReducedMotion || !isFinePointer) return;

    let raf: number;

    function handleMove(e: MouseEvent) {
      if (!lockedRef.current) {
        target.current = { x: e.clientX - DOT_SIZE / 2, y: e.clientY - DOT_SIZE / 2, w: DOT_SIZE, h: DOT_SIZE };
      }
      setReady(true);
    }

    function handleOver(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        "a, button, select, input, [data-cursor-target]"
      );
      if (el) {
        const rect = el.getBoundingClientRect();
        lockedRef.current = true;
        setIsLocked(true);
        target.current = {
          x: rect.left - PADDING,
          y: rect.top - PADDING,
          w: rect.width + PADDING * 2,
          h: rect.height + PADDING * 2,
        };
      } else {
        lockedRef.current = false;
        setIsLocked(false);
      }
    }

    function tick() {
      const c = current.current;
      const t = target.current;
      c.x += (t.x - c.x) * 0.25;
      c.y += (t.y - c.y) * 0.25;
      c.w += (t.w - c.w) * 0.25;
      c.h += (t.h - c.h) * 0.25;
      if (frameRef.current) {
        frameRef.current.style.transform = `translate(${c.x}px, ${c.y}px)`;
        frameRef.current.style.width = `${c.w}px`;
        frameRef.current.style.height = `${c.h}px`;
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      aria-hidden
      className={`pointer-events-none fixed left-0 top-0 z-[100] transition-opacity duration-150 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
      style={{ width: DOT_SIZE, height: DOT_SIZE }}
    >
      {isLocked ? (
        <>
          <span className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-accent" />
          <span className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-accent" />
          <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-accent" />
          <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-accent" />
        </>
      ) : (
        <span className="absolute inset-0 rounded-full bg-accent" />
      )}
    </div>
  );
}
