"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps children with a moving radial spotlight driven by --x/--y
 * CSS variables, plus a soft 3D tilt on hover. Cheap, no framer.
 */
export function Spotlight({
  children,
  className = "",
  tilt = false,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--x", `${x}%`);
      el.style.setProperty("--y", `${y}%`);
      if (tilt) {
        const rx = (y - 50) / -25;
        const ry = (x - 50) / 25;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    };
    const onLeave = () => {
      if (tilt) el.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [tilt]);

  return (
    <div
      ref={ref}
      className={`spotlight transition-transform duration-300 ease-out ${className}`}
      style={{ transformStyle: tilt ? "preserve-3d" : undefined }}
    >
      {children}
    </div>
  );
}
