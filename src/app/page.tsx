"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, FlaskConical, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Stepper, type Stage } from "@/components/Stepper";
import { HypothesisInput } from "@/components/HypothesisInput";
import { NoveltyCard } from "@/components/NoveltyCard";
import { PlanView } from "@/components/PlanView";
import type {
  ExperimentPlan,
  FeedbackEntry,
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

  const run = useCallback(async (hypothesis: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setS({ hypothesis, stage: "intent", streamLen: 0 });

    try {
      // 1) intent
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

      // 2) novelty
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

      // 3) plan (streaming SSE)
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
      <header className="mb-8 flex flex-col items-start justify-between gap-3 sm:mb-12 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-700 bg-ink-900 shadow-glow">
            <FlaskConical className="h-5 w-5 text-accent-300" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-ink-300">Fulcrum × Hack-Nation</div>
            <div className="text-lg font-semibold text-ink-50">The AI Scientist</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={handleSeed} type="button">
            <Sparkles className="h-4 w-4" /> Load demo plan
          </button>
          <a className="btn-ghost" href="/api/plans" target="_blank" rel="noreferrer">
            Plans API
          </a>
        </div>
      </header>

      <section className="grid-bg mb-8 rounded-3xl border border-ink-700 p-6 sm:p-10">
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-ink-50 sm:text-5xl">
          From a scientific question to a runnable experiment plan — in seconds.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-ink-200 sm:text-lg">
          Convert a natural-language hypothesis into a full operational plan a real lab could pick
          up on Monday. Protocol, materials with catalog numbers, budget, timeline, validation —
          grounded in real suppliers and prior literature.
        </p>
        <div className="mt-6">
          <Stepper stage={s.stage} />
        </div>
      </section>

      <section className="space-y-6">
        <HypothesisInput
          onSubmit={run}
          busy={s.stage === "intent" || s.stage === "novelty" || s.stage === "plan"}
          initial={s.hypothesis}
        />

        {s.stage === "error" && s.error && (
          <div className="card flex items-start gap-3 p-4 text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium">Something went wrong</div>
              <div className="text-rose-200/90">{s.error}</div>
              <div className="mt-2 text-xs text-ink-300">
                Tip: ensure <code>LLM_API_KEY</code> and <code>TAVILY_API_KEY</code> are set, or
                click <strong>Load demo plan</strong> to explore the UI without keys.
              </div>
            </div>
          </div>
        )}

        {s.intent && (
          <div className="card p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-300" />
              <span className="label">Structured intent</span>
              {(s.stage === "novelty" || s.stage === "plan") && (
                <Loader2 className="ml-auto h-4 w-4 animate-spin text-ink-400" />
              )}
              {s.stage === "done" && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />}
            </div>
            <IntentPills intent={s.intent} />
          </div>
        )}

        {s.novelty && <NoveltyCard novelty={s.novelty} />}

        {s.stage === "plan" && !s.stored && <StreamingHint len={s.streamLen} />}

        {s.stored && (
          <PlanView
            stored={s.stored}
            onSavePlan={handleSavePlan}
            onSubmitFeedback={handleFeedback}
            onRegenerate={handleRegenerate}
            regenBusy={regenBusy}
          />
        )}
      </section>

      <footer className="mt-12 text-center text-xs text-ink-400">
        Built for Hack-Nation × World Bank Youth Summit · Fulcrum Science · 2026
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
        <div className="mt-1 flex flex-wrap gap-1.5">
          {intent.keywords.map((k) => (
            <span key={k} className="pill">
              {k}
            </span>
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
    <div className="card flex items-center gap-3 p-4 text-sm text-ink-200">
      <Loader2 className="h-4 w-4 animate-spin text-accent-300" />
      Drafting protocol, sourcing materials, costing the run…
      <span className="ml-auto font-mono text-xs text-ink-400">{len.toLocaleString()} chars</span>
    </div>
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
