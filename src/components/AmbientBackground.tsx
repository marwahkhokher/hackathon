"use client";

import { useEffect, useRef } from "react";

/**
 * AmbientBackground — a fixed, full-viewport layer of futuristic flair:
 *   - Three slow-drifting aurora "blobs" (CSS-animated)
 *   - A masked grid plane
 *   - A cursor-following spotlight that paints onto the grid
 *
 * Pure CSS for the blobs (cheap), one rAF loop for the spotlight.
 * Respects prefers-reduced-motion via globals.css overrides.
 */
export function AmbientBackground() {
  const spotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let target = { x: 50, y: 30 };
    let current = { x: 50, y: 30 };
    const onMove = (e: PointerEvent) => {
      target = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
    };
    const tick = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      const el = spotRef.current;
      if (el) {
        el.style.background = `radial-gradient(600px circle at ${current.x}% ${current.y}%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(800px circle at ${100 - current.x}% ${100 - current.y}%, rgba(34,211,238,0.10), transparent 55%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      {/* Base radial wash */}
      <div className="absolute inset-0 bg-aurora opacity-70" />

      {/* Drifting aurora blobs */}
      <div className="absolute -left-32 -top-24 h-[42rem] w-[42rem] rounded-full bg-violet-600/30 blur-3xl animate-blob-1" />
      <div className="absolute right-[-10rem] top-20 h-[36rem] w-[36rem] rounded-full bg-cyan-500/25 blur-3xl animate-blob-2" />
      <div className="absolute bottom-[-12rem] left-1/3 h-[40rem] w-[40rem] rounded-full bg-teal-400/20 blur-3xl animate-blob-3" />

      {/* Masked grid plane */}
      <div className="absolute inset-0 grid-bg" />

      {/* Cursor spotlight overlay */}
      <div ref={spotRef} className="absolute inset-0 transition-[background] duration-75 ease-out" />

      {/* Subtle vignette to deepen edges */}
      <div className="absolute inset-0 [background:radial-gradient(120%_80%_at_50%_0%,transparent_50%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
