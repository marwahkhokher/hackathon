"use client";

import { motion } from "framer-motion";
import { Atom, Beaker, FileSearch, ListChecks } from "lucide-react";
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
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((s, i) => {
        const stepOrder = order.indexOf(s.id);
        const state =
          idx > stepOrder ? "done" : idx === stepOrder ? "active" : "idle";
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex items-center gap-2 sm:gap-3">
            <motion.div
              layout
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl border transition",
                state === "done" && "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
                state === "active" && "border-accent-500/60 bg-accent-500/10 text-accent-200",
                state === "idle" && "border-ink-700 bg-ink-900 text-ink-400"
              )}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
            <div className="hidden sm:block">
              <div className={cn("text-xs", state === "idle" ? "text-ink-400" : "text-ink-100")}>
                Step {i + 1}
              </div>
              <div className="text-sm">{s.label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-6 bg-ink-700 sm:w-12" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
