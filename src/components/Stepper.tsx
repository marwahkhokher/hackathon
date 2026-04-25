"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Atom, Beaker, FileSearch, ListChecks, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Stage = "idle" | "intent" | "novelty" | "plan" | "done" | "error";

const STEPS: { id: Stage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "intent", label: "Structuring intent", icon: Atom },
  { id: "novelty", label: "Literature QC", icon: FileSearch },
  { id: "plan", label: "Generating plan", icon: Beaker },
  { id: "done", label: "Ready to review", icon: ListChecks },
];

export function Stepper({ stage }: { stage: Stage }) {
  const order: Stage[] = ["idle", "intent", "novelty", "plan", "done"];
  const idx = order.indexOf(stage);
  const progressPct = idx <= 0 ? 0 : ((idx - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="relative">
      {/* connector rail */}
      <div className="pointer-events-none absolute left-4 right-4 top-[18px] h-px overflow-hidden">
        <div className="h-px w-full bg-white/10" />
        <motion.div
          className="absolute left-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, rgba(139,92,246,0.8), rgba(34,211,238,0.8), rgba(45,212,191,0.8))",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="relative flex items-start justify-between gap-2">
        {STEPS.map((s, i) => {
          const stepOrder = order.indexOf(s.id);
          const state =
            idx > stepOrder ? "done" : idx === stepOrder ? "active" : "idle";
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center text-center">
              <div className="relative">
                {/* pulse ring for active */}
                <AnimatePresence>
                  {state === "active" && (
                    <motion.span
                      key="ring"
                      initial={{ opacity: 0.5, scale: 1 }}
                      animate={{ opacity: 0, scale: 2.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-xl border border-violet-400/60"
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  layout
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition",
                    state === "done" && "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
                    state === "active" &&
                      "border-violet-400/60 bg-violet-500/15 text-violet-200 shadow-glow",
                    state === "idle" && "border-white/10 bg-white/[0.03] text-ink-400"
                  )}
                  whileHover={state !== "idle" ? { y: -1 } : undefined}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {state === "done" ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 16 }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
              <div className="mt-2 hidden sm:block">
                <div className="text-[10px] uppercase tracking-wider text-ink-400">
                  Step {i + 1}
                </div>
                <div
                  className={cn(
                    "text-xs font-medium transition",
                    state === "active" && "text-ink-50",
                    state === "done" && "text-emerald-200",
                    state === "idle" && "text-ink-400"
                  )}
                >
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
