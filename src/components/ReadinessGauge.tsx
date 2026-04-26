"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import type { ReadinessScore, ReadinessSubScore } from "@/lib/readinessScore";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";

const BAND_META = {
  ready: {
    label: "Monday-ready",
    grad: "from-emerald-400 via-cyan-400 to-violet-400",
    text: "text-emerald-300",
    border: "border-emerald-400/40",
    chipBg: "bg-emerald-400/10",
  },
  near_ready: {
    label: "Almost there",
    grad: "from-amber-400 via-violet-400 to-cyan-400",
    text: "text-amber-300",
    border: "border-amber-400/40",
    chipBg: "bg-amber-400/10",
  },
  needs_work: {
    label: "Needs work",
    grad: "from-rose-400 via-amber-400 to-violet-400",
    text: "text-rose-300",
    border: "border-rose-400/40",
    chipBg: "bg-rose-400/10",
  },
};

const SUB_KEY_META: Record<
  ReadinessSubScore["key"],
  { abbr: string; tone: string }
> = {
  protocol_clarity: { abbr: "PC", tone: "from-violet-400 to-violet-500" },
  materials_availability: { abbr: "MA", tone: "from-cyan-400 to-cyan-500" },
  budget_realism: { abbr: "BR", tone: "from-teal-400 to-emerald-400" },
  timeline_feasibility: { abbr: "TF", tone: "from-amber-400 to-violet-500" },
};

export function ReadinessGauge({ score }: { score: ReadinessScore }) {
  const meta = BAND_META[score.band];
  const radius = 64;
  const stroke = 10;
  const c = 2 * Math.PI * radius;
  const offset = c - (score.overall / 100) * c;

  return (
    <div
      className={cn(
        "relative grid gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:grid-cols-[auto_1fr]",
        meta.border
      )}
    >
      {/* gradient frame line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(34,211,238,0.6), transparent)",
        }}
      />

      {/* radial gauge */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="relative h-44 w-44">
          {/* glow halo */}
          <div className="absolute inset-2 rounded-full opacity-60 blur-2xl" style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.35), transparent 70%)" }} />
          <svg viewBox="0 0 160 160" className="relative h-full w-full -rotate-90">
            <defs>
              <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={stroke}
              fill="none"
            />
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#gauge-grad)"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.4))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={cn("text-[10px] uppercase tracking-[0.2em]", meta.text)}>
              <ShieldCheck className="mb-0.5 inline h-3 w-3" /> Monday Readiness
            </div>
            <div className="font-display text-5xl font-semibold leading-none">
              <AnimatedNumber value={score.overall} />
            </div>
            <div className="text-[10px] text-ink-400">/ 100</div>
          </div>
        </div>
      </div>

      {/* right side */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "pill border px-3 py-1.5 text-xs font-medium",
              meta.border,
              meta.chipBg,
              meta.text
            )}
          >
            {score.band === "ready" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {meta.label}
          </span>
          <span className="pill text-[11px] text-ink-300">composite of 4 sub-scores</span>
        </div>
        <p className="font-display text-sm leading-relaxed text-ink-100">{score.headline}</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {score.sub_scores.map((s, i) => (
            <SubScore key={s.key} sub={s} delay={0.05 * i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SubScore({ sub, delay }: { sub: ReadinessSubScore; delay: number }) {
  const meta = SUB_KEY_META[sub.key];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-violet-400/30"
      title={[
        ...(sub.reasons.map((r) => `✓ ${r}`)),
        ...(sub.flags.map((f) => `⚠ ${f}`)),
      ].join("\n")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-300">
            {meta.abbr}
          </span>
          <div className="text-xs font-medium text-ink-100">{sub.label}</div>
        </div>
        <div className="font-display text-sm tabular-nums">
          <AnimatedNumber value={sub.score} />
          <span className="text-ink-400">/100</span>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${sub.score}%` }}
          transition={{ delay: delay + 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full bg-gradient-to-r", meta.tone)}
          style={{ boxShadow: "0 0 12px rgba(139,92,246,0.35)" }}
        />
      </div>
      {(sub.reasons.length > 0 || sub.flags.length > 0) && (
        <div className="mt-2 space-y-0.5 text-[10px] text-ink-400">
          {sub.reasons.slice(0, 2).map((r, i) => (
            <div key={i} className="truncate text-emerald-300/80">✓ {r}</div>
          ))}
          {sub.flags.slice(0, 2).map((f, i) => (
            <div key={i} className="truncate text-amber-300/80">⚠ {f}</div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
