"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  FlaskConical,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  Zap,
} from "lucide-react";
import { Stepper, type Stage } from "@/components/Stepper";
import { HypothesisInput } from "@/components/HypothesisInput";
import { NoveltyCard } from "@/components/NoveltyCard";
import { PlanView } from "@/components/PlanView";
import { Spotlight } from "@/components/Spotlight";
import { HypothesisQualityCard } from "@/components/HypothesisQualityCard";
import type {
  ExperimentPlan,
  FeedbackEntry,
  HypothesisQuality,
  NoveltyResult,
  ScientificIntent,
  StoredPlan,
} from "@/lib/schemas";

interface PipelineState {
  hypothesis: string;
  intent?: ScientificIntent;
  novelty?: NoveltyResult;
  stored?: StoredPlan;
  stage: Stage;
  error?: string;
  streamLen: number;
}

const initial: PipelineState = { hypothesis: "", stage: "idle", streamLen: 0 };

export default function Page() {
  const [s, setS] = useState<PipelineState>(initial);
  const [regenBusy, setRegenBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Hypothesis pre-flight check (debounced)
  const [hypoText, setHypoText] = useState<string>("");
  const [hypoQuality, setHypoQuality] = useState<HypothesisQuality | null>(null);
  const [hypoRewriteBusy, setHypoRewriteBusy] = useState(false);
  const [appliedRewrite, setAppliedRewrite] = useState<string | undefined>();

  useEffect(() => {
    const t = hypoText.trim();
    if (t.length < 10) {
      setHypoQuality(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch("/api/hypothesis-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hypothesis: t }),
          signal: ctrl.signal,
        });
        if (!r.ok) return;
        const j = (await r.json()) as { quality: HypothesisQuality };
        setHypoQuality(j.quality);
      } catch {
        /* aborted */
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [hypoText]);

  const requestRewrite = useCallback(async () => {
    if (hypoText.trim().length < 10) return;
    setHypoRewriteBusy(true);
    try {
      const r = await fetch("/api/hypothesis-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis: hypoText, rewrite: true }),
      });
      if (r.ok) {
        const j = (await r.json()) as { quality: HypothesisQuality };
        setHypoQuality(j.quality);
      }
    } finally {
      setHypoRewriteBusy(false);
    }
  }, [hypoText]);

  const run = useCallback(async (hypothesis: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setS({ hypothesis, stage: "intent", streamLen: 0 });
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );

    try {
      const intentRes = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis }),
        signal: ctrl.signal,
      });
      if (!intentRes.ok) {
        const err = await intentRes.json().catch(() => ({}));
        throw new Error(err.error || `intent failed (${intentRes.status})`);
      }
      const { intent } = (await intentRes.json()) as { intent: ScientificIntent };
      setS((prev) => ({ ...prev, intent, stage: "novelty" }));

      const novRes = await fetch("/api/novelty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
        signal: ctrl.signal,
      });
      if (!novRes.ok) {
        const err = await novRes.json().catch(() => ({}));
        throw new Error(err.error || `novelty failed (${novRes.status})`);
      }
      const { novelty } = (await novRes.json()) as { novelty: NoveltyResult };
      setS((prev) => ({ ...prev, novelty, stage: "plan" }));

      await streamPlan({ hypothesis, intent, novelty, ctrl, onState: setS });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setS((prev) => ({ ...prev, stage: "error", error: (e as Error).message }));
    }
  }, []);

  const handleSeed = useCallback(async () => {
    const r = await fetch("/api/seed", { method: "POST" });
    if (!r.ok) return;
    const { plan } = (await r.json()) as { plan: StoredPlan };
    setS({
      hypothesis: plan.hypothesis,
      intent: plan.intent,
      novelty: plan.novelty,
      stored: plan,
      stage: "done",
      streamLen: 0,
    });
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }, []);

  const handleSavePlan = useCallback(
    async (plan: ExperimentPlan) => {
      if (!s.stored) return;
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: s.stored.id, edited_plan: plan }),
      });
      const j = (await r.json()) as { plan: StoredPlan };
      if (j.plan) setS((prev) => ({ ...prev, stored: j.plan }));
    },
    [s.stored]
  );

  const handleFeedback = useCallback(
    async (entry: Omit<FeedbackEntry, "id" | "created_at" | "plan_id">) => {
      if (!s.stored) return;
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: s.stored.id, ...entry }),
      });
    },
    [s.stored]
  );

  const handleRegenerate = useCallback(async () => {
    if (!s.intent || !s.novelty || !s.hypothesis) return;
    setRegenBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await streamPlan({
        hypothesis: s.hypothesis,
        intent: s.intent,
        novelty: s.novelty,
        ctrl,
        onState: setS,
      });
    } finally {
      setRegenBusy(false);
    }
  }, [s.hypothesis, s.intent, s.novelty]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:pt-12">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 flex flex-col items-start justify-between gap-3 sm:mb-14 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-400/40 blur-md" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-ink-950/80 shadow-glow">
              <FlaskConical className="h-5 w-5 text-violet-200" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink-300">
              Fulcrum × Hack-Nation
            </div>
            <div className="font-display text-lg font-semibold text-ink-50">The AI Scientist</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="btn-ghost"
            onClick={handleSeed}
            type="button"
          >
            <Sparkles className="h-4 w-4 text-violet-300" /> Load demo plan
          </motion.button>
          <a className="btn-ghost" href="/api/plans" target="_blank" rel="noreferrer">
            Plans API
          </a>
        </div>
      </motion.header>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:mb-14 sm:p-12"
      >
        {/* hero gradient ring */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

        <div className="grid items-end gap-8 sm:grid-cols-[1fr_auto]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-ink-200"
            >
              <Zap className="h-3.5 w-3.5 text-violet-300" />
              From hypothesis to runnable plan in seconds
            </motion.div>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              <span className="text-gradient">From a scientific question</span>
              <br />
              <span className="text-gradient-accent">to a runnable experiment plan.</span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-5 max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg"
            >
              Convert a natural-language hypothesis into a full operational plan a real lab could
              pick up on Monday — protocol, materials with catalog numbers, budget, timeline, and
              validation, grounded in real suppliers and prior literature.
            </motion.p>
          </div>

          {/* floating stat card */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="hidden sm:block"
          >
            <Spotlight tilt className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="label">Pipeline latency</div>
              <div className="mt-1 font-display text-3xl font-semibold text-gradient-accent">≈ 8s</div>
              <div className="text-xs text-ink-400">intent → QC → streamed plan</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-ink-300">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                  <div className="font-display text-base text-ink-50">Zod</div>
                  schemas
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                  <div className="font-display text-base text-ink-50">SSE</div>
                  streaming
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                  <div className="font-display text-base text-ink-50">RAG</div>
                  feedback
                </div>
              </div>
            </Spotlight>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-8"
        >
          <Stepper stage={s.stage} />
        </motion.div>
      </motion.section>

      <section ref={resultRef} className="space-y-6">
        <HypothesisInput
          onSubmit={run}
          busy={s.stage === "intent" || s.stage === "novelty" || s.stage === "plan"}
          initial={s.hypothesis}
          externalValue={appliedRewrite}
          onChange={setHypoText}
        />

        <AnimatePresence>
          {hypoQuality && !s.intent && (
            <HypothesisQualityCard
              key="hquality"
              quality={hypoQuality}
              loadingRewrite={hypoRewriteBusy}
              onRequestRewrite={requestRewrite}
              onApplyImproved={(v) => setAppliedRewrite(v)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {s.stage === "error" && s.error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card flex items-start gap-3 p-4 text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Something went wrong</div>
                <div className="text-rose-200/90">{s.error}</div>
                <div className="mt-2 text-xs text-ink-300">
                  Tip: ensure <code>LLM_API_KEY</code> and <code>TAVILY_API_KEY</code> are set, or
                  click <strong>Load demo plan</strong> to explore the UI without keys.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {s.intent && (
            <motion.div
              key="intent-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45 }}
              className="card p-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-300" />
                <span className="label">Structured intent</span>
                {(s.stage === "novelty" || s.stage === "plan") && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin text-ink-400" />
                )}
                {s.stage === "done" && (
                  <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
                )}
              </div>
              <IntentPills intent={s.intent} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{s.novelty && <NoveltyCard novelty={s.novelty} />}</AnimatePresence>

        <AnimatePresence>
          {s.stage === "plan" && !s.stored && <StreamingHint len={s.streamLen} />}
        </AnimatePresence>

        <AnimatePresence>
          {s.stored && (
            <PlanView
              key={`plan-${s.stored.id}-v${s.stored.version}`}
              stored={s.stored}
              onSavePlan={handleSavePlan}
              onSubmitFeedback={handleFeedback}
              onRegenerate={handleRegenerate}
              regenBusy={regenBusy}
            />
          )}
        </AnimatePresence>
      </section>

      <footer className="mt-16 flex flex-col items-center gap-2 text-center text-xs text-ink-400">
        <div className="flex items-center gap-1.5">
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
          Built for Hack-Nation × World Bank Youth Summit · Fulcrum Science · 2026
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        </div>
      </footer>
    </main>
  );
}

function IntentPills({ intent }: { intent: ScientificIntent }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Pair k="Domain" v={intent.domain.replace("_", " ")} />
      <Pair k="Model system" v={intent.model_system} />
      <Pair k="Intervention" v={intent.intervention} />
      <Pair k="Comparator" v={intent.comparator} />
      <Pair k="Outcome" v={`${intent.outcome.name} · ${intent.outcome.metric}`} />
      <Pair k="Threshold" v={intent.outcome.threshold ?? "—"} />
      <div className="sm:col-span-2">
        <div className="label">Keywords</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {intent.keywords.map((k, i) => (
            <motion.span
              key={k}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.025 * i, duration: 0.3 }}
              className="pill"
            >
              {k}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="label">{k}</div>
      <div className="mt-1 text-sm text-ink-100">{v}</div>
    </div>
  );
}

function StreamingHint({ len }: { len: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="scan-rail card flex items-center gap-3 p-4 text-sm text-ink-200"
    >
      <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
      <span className="typing-caret">Drafting protocol, sourcing materials, costing the run</span>
      <ArrowDown className="ml-auto h-4 w-4 animate-bounce text-ink-400" />
      <span className="font-mono text-xs text-ink-400">{len.toLocaleString()} chars</span>
    </motion.div>
  );
}

// ---------- streaming SSE plan reader ----------

async function streamPlan({
  hypothesis,
  intent,
  novelty,
  ctrl,
  onState,
}: {
  hypothesis: string;
  intent: ScientificIntent;
  novelty: NoveltyResult;
  ctrl: AbortController;
  onState: React.Dispatch<React.SetStateAction<PipelineState>>;
}) {
  const r = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hypothesis, intent, novelty, stream: true }),
    signal: ctrl.signal,
  });
  if (!r.ok || !r.body) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `plan failed (${r.status})`);
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const lines = evt.split("\n");
      const event = lines.find((l) => l.startsWith("event: "))?.slice(7).trim();
      const data = lines.find((l) => l.startsWith("data: "))?.slice(6);
      if (!event || !data) continue;
      const parsed = JSON.parse(data);
      if (event === "chunk") {
        onState((prev) => ({ ...prev, streamLen: parsed.total_len ?? prev.streamLen }));
      } else if (event === "plan") {
        const stored = parsed as StoredPlan;
        onState((prev) => ({ ...prev, stored, stage: "done" }));
      } else if (event === "error") {
        onState((prev) => ({ ...prev, stage: "error", error: parsed.error }));
      }
    }
  }
}
