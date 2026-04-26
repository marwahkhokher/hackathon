"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, GitCompare, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import type { AlternativeApproach, ExperimentPlan } from "@/lib/schemas";
import { cn, fmtUSD } from "@/lib/utils";

const REC_META: Record<
  AlternativeApproach["recommendation"],
  { label: string; tone: string }
> = {
  primary: {
    label: "Primary",
    tone: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  alternative: {
    label: "Alternative",
    tone: "border-violet-400/40 bg-violet-400/10 text-violet-300",
  },
  not_recommended: {
    label: "Not recommended",
    tone: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  },
};

export function AlternativesPanel({
  plan,
  startOpen = false,
}: {
  plan: ExperimentPlan;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const alts = plan.alternatives ?? [];
  if (alts.length === 0) return null;

  const primary: AlternativeApproach = {
    name: plan.title,
    description: plan.summary,
    pros: plan.why_this_plan.slice(0, 3),
    cons: plan.assumptions.slice(0, 2),
    est_total_cost_usd: plan.budget.total_usd,
    est_timeline_weeks: plan.timeline.total_weeks,
    est_success_probability: 0.7,
    recommendation: "primary",
  };
  const all = [primary, ...alts];

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-left transition hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            <GitCompare className="h-4 w-4 text-violet-300" />
          </span>
          <div>
            <div className="font-display text-sm font-semibold text-ink-50">
              Compare approaches
            </div>
            <div className="text-xs text-ink-300">
              Senior-scientist sanity check — {alts.length} alternative
              {alts.length === 1 ? "" : "s"} considered
            </div>
          </div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-4 w-4 text-ink-300" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-5">
              {/* Comparison table */}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-ink-300">
                    <tr>
                      <th className="p-3 text-left">Approach</th>
                      <th className="p-3 text-right">Cost</th>
                      <th className="p-3 text-right">Timeline</th>
                      <th className="p-3 text-right">P(success)</th>
                      <th className="p-3 text-left">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {all.map((a, i) => {
                      const m = REC_META[a.recommendation];
                      return (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * i, duration: 0.35 }}
                          className={cn(
                            "border-t border-white/10",
                            a.recommendation === "primary" && "bg-emerald-400/[0.04]"
                          )}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2 font-medium text-ink-50">
                              {a.recommendation === "primary" && (
                                <Star className="h-3.5 w-3.5 text-emerald-300" />
                              )}
                              {a.name}
                            </div>
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            {fmtUSD(a.est_total_cost_usd)}
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            {a.est_timeline_weeks} wk
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            {a.est_success_probability != null
                              ? `${Math.round(a.est_success_probability * 100)}%`
                              : "—"}
                          </td>
                          <td className="p-3">
                            <span className={cn("pill", m.tone)}>{m.label}</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Detailed cards for the alternatives */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {alts.map((a, i) => {
                  const m = REC_META[a.recommendation];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.4 }}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-display text-sm font-semibold text-ink-50">{a.name}</div>
                        <span className={cn("pill text-[10px]", m.tone)}>{m.label}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ink-200">
                        {a.description}
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                        <Stat label="Cost" value={fmtUSD(a.est_total_cost_usd)} />
                        <Stat label="Timeline" value={`${a.est_timeline_weeks} wk`} />
                        <Stat
                          label="P(success)"
                          value={a.est_success_probability != null ? `${Math.round(a.est_success_probability * 100)}%` : "—"}
                        />
                      </div>
                      {(a.pros.length > 0 || a.cons.length > 0) && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {a.pros.length > 0 && (
                            <div>
                              <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-300">
                                <ThumbsUp className="h-3 w-3" /> Pros
                              </div>
                              <ul className="space-y-0.5 text-xs text-ink-200">
                                {a.pros.map((p, j) => (
                                  <li key={j}>• {p}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {a.cons.length > 0 && (
                            <div>
                              <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-rose-300">
                                <ThumbsDown className="h-3 w-3" /> Cons
                              </div>
                              <ul className="space-y-0.5 text-xs text-ink-200">
                                {a.cons.map((c, j) => (
                                  <li key={j}>• {c}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className="font-display text-xs font-semibold text-ink-50">{value}</div>
    </div>
  );
}
