"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Beaker } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SAMPLES: { label: string; value: string; tag: string }[] = [
  {
    label: "Diagnostics — paper electrochemical biosensor for CRP",
    tag: "Diagnostics",
    value:
      "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  },
  {
    label: "Gut Health — LGG probiotic and intestinal permeability in mice",
    tag: "Microbiology",
    value:
      "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  },
  {
    label: "Cell Biology — trehalose vs sucrose cryoprotectant in HeLa",
    tag: "Cell Biology",
    value:
      "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.",
  },
  {
    label: "Climate — Sporomusa ovata CO₂ fixation in a BES",
    tag: "Climate",
    value:
      "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400 mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.",
  },
];

export function HypothesisInput({
  onSubmit,
  busy,
  initial,
}: {
  onSubmit: (h: string) => void;
  busy: boolean;
  initial?: string;
}) {
  const [value, setValue] = useState<string>(initial ?? "");
  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-300" />
        <span className="label">Hypothesis</span>
      </div>
      <textarea
        className={cn("input min-h-[120px] resize-y text-base leading-relaxed")}
        placeholder="State a falsifiable hypothesis. Include the intervention, comparator, model system, and a measurable outcome with a threshold."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={busy}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <motion.button
              key={s.label}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setValue(s.value)}
              className="pill hover:bg-ink-800"
              type="button"
              disabled={busy}
            >
              <Beaker className="h-3 w-3 text-accent-300" /> {s.tag}
            </motion.button>
          ))}
        </div>

        <button
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => value.trim().length > 10 && onSubmit(value.trim())}
          disabled={busy || value.trim().length < 10}
        >
          {busy ? "Working…" : "Generate plan"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
