"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, X, Sparkles, ArrowRightLeft } from "lucide-react";
import type { HypothesisQuality } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const STATUS_META = {
  pass: {
    Icon: Check,
    tone: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  warn: {
    Icon: AlertTriangle,
    tone: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  },
  fail: {
    Icon: X,
    tone: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  },
};

export function HypothesisQualityCard({
  quality,
  onApplyImproved,
  loadingRewrite,
  onRequestRewrite,
}: {
  quality: HypothesisQuality;
  onApplyImproved?: (text: string) => void;
  loadingRewrite?: boolean;
  onRequestRewrite?: () => void;
}) {
  const score = quality.score;
  const band =
    score >= 85 ? "strong" : score >= 60 ? "decent" : "weak";
  const bandTone =
    band === "strong"
      ? "from-emerald-400 to-cyan-400 text-emerald-300"
      : band === "decent"
      ? "from-amber-400 to-violet-400 text-amber-300"
      : "from-rose-400 to-amber-400 text-rose-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-300" />
          <span className="label">Hypothesis quality</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("font-display text-xs uppercase tracking-wider bg-gradient-to-r bg-clip-text text-transparent", bandTone)}>
            {band === "strong" ? "Strong" : band === "decent" ? "Workable" : "Weak"}
          </span>
          <div className="flex h-7 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 font-mono text-xs">
            <span className="text-ink-300">score</span>
            <motion.span
              key={score}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-semibold text-ink-50"
            >
              {score}
            </motion.span>
            <span className="text-ink-400">/100</span>
          </div>
        </div>
      </div>

      {/* score bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          key={score}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(244,63,94,0.95), rgba(245,158,11,0.95), rgba(34,211,238,0.95), rgba(45,212,191,0.95))",
          }}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {quality.checks.map((c, i) => {
          const m = STATUS_META[c.status];
          const Icon = m.Icon;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                  m.tone
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink-50">{c.label}</div>
                <div className="text-xs text-ink-300">{c.evidence}</div>
                {c.hint && c.status !== "pass" && (
                  <div className="mt-1 text-[11px] text-violet-300">→ {c.hint}</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {quality.improved_version && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-xl border border-violet-400/30 bg-violet-500/5 p-3">
              <div className="mb-1 flex items-center gap-2">
                <ArrowRightLeft className="h-3.5 w-3.5 text-violet-300" />
                <span className="label">Suggested rewrite</span>
              </div>
              <p className="font-display text-sm leading-relaxed text-ink-50">
                {quality.improved_version}
              </p>
              {quality.rationale && (
                <p className="mt-1 text-xs text-ink-300">{quality.rationale}</p>
              )}
              {onApplyImproved && (
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => onApplyImproved(quality.improved_version!)}
                  >
                    Use this version
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!quality.improved_version && score < 85 && onRequestRewrite && (
        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            disabled={loadingRewrite}
            onClick={onRequestRewrite}
            className="btn-ghost text-xs"
          >
            {loadingRewrite ? "Rewriting…" : "Suggest a stronger version"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
