"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles, Beaker, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HypothesisInputHandle {
  setValue: (v: string) => void;
}

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

const PLACEHOLDERS = [
  "Can a probiotic measurably strengthen the gut lining in mice?",
  "Will trehalose beat DMSO at preserving HeLa cells through freeze-thaw?",
  "Can a paper biosensor match ELISA for CRP in 10 minutes?",
  "Can Sporomusa ovata convert CO₂ to acetate at >150 mmol/L/day?",
  "Does compound X at 5 μM reduce tau aggregation by ≥40%?",
];

export function HypothesisInput({
  onSubmit,
  busy,
  initial,
  externalValue,
  onChange,
}: {
  onSubmit: (h: string) => void;
  busy: boolean;
  initial?: string;
  /** When this changes, the textarea is updated (used by the rewrite suggestion). */
  externalValue?: string;
  /** Called with the latest text on every change. */
  onChange?: (v: string) => void;
}) {
  const [value, setValueState] = useState<string>(initial ?? "");
  const setValue = (v: string) => {
    setValueState(v);
    onChange?.(v);
  };
  useEffect(() => {
    if (externalValue != null && externalValue !== value) {
      setValueState(externalValue);
      onChange?.(externalValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);
  const [placeholder, setPlaceholder] = useState<string>("");
  const [phIdx, setPhIdx] = useState(0);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Cycling typewriter placeholder
  useEffect(() => {
    if (value) return;
    let i = 0;
    let dir: 1 | -1 = 1;
    const target = PLACEHOLDERS[phIdx];
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i += dir;
      setPlaceholder(target.slice(0, i));
      if (dir === 1 && i >= target.length) {
        timer = setTimeout(() => {
          dir = -1;
          step();
        }, 1600);
        return;
      }
      if (dir === -1 && i <= 0) {
        setPhIdx((p) => (p + 1) % PLACEHOLDERS.length);
        return;
      }
      timer = setTimeout(step, dir === 1 ? 28 + Math.random() * 28 : 14);
    };
    timer = setTimeout(step, 400);
    return () => clearTimeout(timer);
  }, [phIdx, value]);

  // Magnetic submit button
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const max = 80;
      if (dist > max) {
        el.style.transform = "translate(0,0)";
        return;
      }
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.18}px)`;
    };
    const onLeave = () => (el.style.transform = "translate(0,0)");
    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const ready = value.trim().length > 10 && !busy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card ring-grad p-6 sm:p-8"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-300" />
          <span className="label">Hypothesis</span>
        </div>
        <span className="hidden text-[11px] text-ink-400 sm:block">
          ⌘ + ↵ to generate
        </span>
      </div>

      <div className="relative">
        <textarea
          className={cn("input min-h-[140px] resize-y font-display text-base leading-relaxed sm:text-lg")}
          placeholder={value ? "" : placeholder + (placeholder ? "▍" : "")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && ready) onSubmit(value.trim());
          }}
          disabled={busy}
        />
        <div className="pointer-events-none absolute right-3 top-3 text-[10px] uppercase tracking-widest text-ink-400">
          {value.length} ch
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Wand2 className="h-3.5 w-3.5 text-ink-400" />
          <span className="text-xs text-ink-400">Try:</span>
          {SAMPLES.map((s, i) => (
            <motion.button
              key={s.label}
              type="button"
              disabled={busy}
              onClick={() => setValue(s.value)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="pill border-white/10 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-100"
            >
              <Beaker className="h-3 w-3 text-violet-300" /> {s.tag}
            </motion.button>
          ))}
        </div>

        <motion.button
          ref={btnRef}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => ready && onSubmit(value.trim())}
          disabled={!ready}
          whileTap={{ scale: 0.97 }}
          style={{ transition: "transform 180ms cubic-bezier(0.22,1,0.36,1)" }}
        >
          {busy ? "Working…" : "Generate plan"}
          <motion.span
            animate={busy ? { x: [0, 4, 0] } : { x: 0 }}
            transition={busy ? { repeat: Infinity, duration: 1.1 } : undefined}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
}
