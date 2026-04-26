"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import {
  Beaker,
  ClipboardList,
  Coins,
  CalendarRange,
  ShieldCheck,
  Users,
  AlertOctagon,
  Lightbulb,
  Pencil,
  Save,
  Star,
  Loader2,
  RefreshCcw,
  X,
} from "lucide-react";
import type { ExperimentPlan, FeedbackEntry, StoredPlan } from "@/lib/schemas";
import { cn, fmtUSD } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { Spotlight } from "./Spotlight";

type Section =
  | "summary"
  | "protocol"
  | "materials"
  | "budget"
  | "timeline"
  | "validation"
  | "controls"
  | "risks"
  | "personnel"
  | "why";

const TABS: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "summary", label: "Summary", icon: Lightbulb },
  { id: "protocol", label: "Protocol", icon: ClipboardList },
  { id: "materials", label: "Materials", icon: Beaker },
  { id: "budget", label: "Budget", icon: Coins },
  { id: "timeline", label: "Timeline", icon: CalendarRange },
  { id: "validation", label: "Validation", icon: ShieldCheck },
  { id: "personnel", label: "Personnel", icon: Users },
  { id: "risks", label: "Risks", icon: AlertOctagon },
  { id: "why", label: "Why", icon: Lightbulb },
];

interface PlanViewProps {
  stored: StoredPlan;
  onSavePlan: (plan: ExperimentPlan) => Promise<void>;
  onSubmitFeedback: (entry: Omit<FeedbackEntry, "id" | "created_at" | "plan_id">) => Promise<void>;
  onRegenerate: () => void;
  regenBusy?: boolean;
}

export function PlanView({
  stored,
  onSavePlan,
  onSubmitFeedback,
  onRegenerate,
  regenBusy,
}: PlanViewProps) {
  const [tab, setTab] = useState<Section>("summary");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ExperimentPlan>(stored.plan);
  const plan = editing ? draft : stored.plan;

  const totalMaterials = useMemo(
    () => plan.materials.reduce((s, m) => s + (m.total_cost_usd || 0), 0),
    [plan.materials]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden"
    >
      {/* header */}
      <div className="relative flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-start sm:justify-between">
        {/* subtle gradient header glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">v{stored.version}</span>
            <span className="pill capitalize">{plan.intent.domain.replace("_", " ")}</span>
            {stored.novelty?.status && (
              <span className="pill capitalize">{stored.novelty.status.replace(/_/g, " ")}</span>
            )}
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-50 sm:text-3xl">
            {plan.title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-200">{plan.summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {editing ? (
            <>
              <button
                className="btn-ghost"
                onClick={() => {
                  setDraft(stored.plan);
                  setEditing(false);
                }}
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                className="btn-primary"
                onClick={async () => {
                  await onSavePlan(draft);
                  setEditing(false);
                }}
              >
                <Save className="h-4 w-4" /> Save edits
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> Edit plan
              </button>
              <button className="btn-primary" onClick={onRegenerate} disabled={regenBusy}>
                {regenBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Regenerate from feedback
              </button>
            </>
          )}
        </div>
      </div>

      {/* metric strip with animated counters */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-4">
        <Metric
          label="Budget"
          big={
            <AnimatedNumber
              value={plan.budget.total_usd}
              format={(n) => fmtUSD(Math.round(n))}
            />
          }
          sub={`+${plan.budget.contingency_pct}% contingency`}
          accent="violet"
        />
        <Metric
          label="Timeline"
          big={
            <>
              <AnimatedNumber value={plan.timeline.total_weeks} /> weeks
            </>
          }
          sub={`${plan.timeline.phases.length} phases`}
          accent="cyan"
        />
        <Metric
          label="Materials"
          big={
            <>
              <AnimatedNumber value={plan.materials.length} /> items
            </>
          }
          sub={fmtUSD(totalMaterials)}
          accent="teal"
        />
        <Metric
          label="Validation"
          big={
            <>
              <AnimatedNumber value={plan.validation.length} /> criteria
            </>
          }
          sub={`${plan.controls.length} controls`}
          accent="violet"
        />
      </div>

      {/* tabs */}
      <LayoutGroup id="plan-tabs">
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm transition",
                  active ? "text-ink-50" : "text-ink-300 hover:text-ink-100"
                )}
              >
                <Icon className={cn("h-4 w-4 transition", active && "text-violet-300")} />
                {t.label}
                {active && (
                  <motion.span
                    layoutId="active-tab"
                    className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(139,92,246,0.95), rgba(34,211,238,0.95))",
                      boxShadow: "0 0 12px rgba(139,92,246,0.6)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {/* body */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "summary" && <SummaryView plan={plan} />}
            {tab === "protocol" && (
              <ProtocolView
                plan={plan}
                editing={editing}
                onChange={(p) => setDraft({ ...draft, ...p })}
              />
            )}
            {tab === "materials" && (
              <MaterialsView
                plan={plan}
                editing={editing}
                onChange={(p) => setDraft({ ...draft, ...p })}
              />
            )}
            {tab === "budget" && (
              <BudgetView plan={plan} editing={editing} onChange={(p) => setDraft({ ...draft, ...p })} />
            )}
            {tab === "timeline" && <TimelineView plan={plan} />}
            {tab === "validation" && <ValidationView plan={plan} />}
            {tab === "personnel" && <PersonnelView plan={plan} />}
            {tab === "risks" && <RisksView plan={plan} />}
            {tab === "why" && <WhyView plan={plan} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <FeedbackPanel
        defaultSection={
          tab === "why" || tab === "summary" ? "general" : (tab as FeedbackEntry["section"])
        }
        onSubmit={onSubmitFeedback}
        plan={plan}
      />
    </motion.div>
  );
}

function Metric({
  label,
  big,
  sub,
  accent = "violet",
}: {
  label: string;
  big: React.ReactNode;
  sub?: string;
  accent?: "violet" | "cyan" | "teal";
}) {
  const accentClass =
    accent === "cyan"
      ? "from-cyan-400/40 to-cyan-400/0"
      : accent === "teal"
      ? "from-teal-400/40 to-teal-400/0"
      : "from-violet-400/40 to-violet-400/0";
  return (
    <div className="relative bg-ink-950/80 px-5 py-4">
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r", accentClass)} />
      <div className="label">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold text-ink-50 sm:text-2xl">{big}</div>
      {sub && <div className="text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

function SummaryView({ plan }: { plan: ExperimentPlan }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Spotlight className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="label">Intent</div>
        <div className="mt-2 space-y-1.5 text-sm">
          <KV k="Intervention" v={plan.intent.intervention} />
          <KV k="Comparator" v={plan.intent.comparator} />
          <KV k="Model system" v={plan.intent.model_system} />
          <KV k="Outcome" v={`${plan.intent.outcome.name} — ${plan.intent.outcome.metric}`} />
          {plan.intent.outcome.threshold && <KV k="Threshold" v={plan.intent.outcome.threshold} />}
        </div>
      </Spotlight>
      <Spotlight className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="label">Controls</div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {plan.controls.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="pill mt-0.5 capitalize">{c.type}</span>
              <span className="text-ink-100">{c.description}</span>
            </li>
          ))}
        </ul>
      </Spotlight>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
        <div className="label">Assumptions</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink-100">
          {plan.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-32 shrink-0 text-ink-400">{k}</span>
      <span className="text-ink-100">{v}</span>
    </div>
  );
}

function ProtocolView({
  plan,
  editing,
  onChange,
}: {
  plan: ExperimentPlan;
  editing: boolean;
  onChange: (patch: Partial<ExperimentPlan>) => void;
}) {
  return (
    <ol className="space-y-3">
      {plan.protocol.map((step, i) => (
        <motion.li
          key={step.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.35 }}
          className="group relative rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-violet-400/30"
        >
          {/* step rail */}
          <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-violet-400/40 via-cyan-400/30 to-transparent opacity-0 transition group-hover:opacity-100" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill border-violet-400/30 bg-violet-500/10 text-violet-200">{step.id}</span>
            <span className="pill">{step.phase}</span>
            <span className="pill">{step.duration}</span>
            {editing ? (
              <input
                className="input mt-2 w-full"
                value={step.title}
                onChange={(e) => {
                  const next = [...plan.protocol];
                  next[i] = { ...step, title: e.target.value };
                  onChange({ protocol: next });
                }}
              />
            ) : (
              <h4 className="font-display text-sm font-semibold text-ink-50">{step.title}</h4>
            )}
          </div>
          {editing ? (
            <textarea
              className="input mt-2 min-h-[110px] text-sm"
              value={step.description}
              onChange={(e) => {
                const next = [...plan.protocol];
                next[i] = { ...step, description: e.target.value };
                onChange({ protocol: next });
              }}
            />
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-100">
              {step.description}
            </p>
          )}
          {step.critical_parameters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {step.critical_parameters.map((cp, j) => (
                <span key={j} className="pill border-violet-400/30 bg-violet-500/10 text-violet-200">
                  {cp}
                </span>
              ))}
            </div>
          )}
          {step.safety_notes.length > 0 && (
            <div className="mt-2 text-xs text-amber-300">
              Safety: {step.safety_notes.join(" · ")}
            </div>
          )}
        </motion.li>
      ))}
    </ol>
  );
}

function MaterialsView({
  plan,
  editing,
  onChange,
}: {
  plan: ExperimentPlan;
  editing: boolean;
  onChange: (patch: Partial<ExperimentPlan>) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-ink-300">
          <tr>
            <th className="p-3 text-left">Item</th>
            <th className="p-3 text-left">Supplier</th>
            <th className="p-3 text-left">Catalog #</th>
            <th className="p-3 text-left">Qty</th>
            <th className="p-3 text-right">Unit</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {plan.materials.map((m, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.025 * i, duration: 0.3 }}
              className="border-t border-white/10 transition hover:bg-white/[0.03]"
            >
              <td className="p-3">
                <div className="font-medium text-ink-50">{m.name}</div>
                <div className="text-xs text-ink-400">{m.category}</div>
              </td>
              <td className="p-3 text-ink-200">{m.supplier}</td>
              <td className="p-3 font-mono text-xs">
                {m.url ? (
                  <a className="text-cyan-300 underline-offset-2 hover:underline" target="_blank" rel="noreferrer" href={m.url}>
                    {m.catalog_number}
                  </a>
                ) : (
                  m.catalog_number ?? "—"
                )}
              </td>
              <td className="p-3 text-ink-200">
                {editing ? (
                  <input
                    className="input"
                    value={m.quantity}
                    onChange={(e) => {
                      const next = [...plan.materials];
                      next[i] = { ...m, quantity: e.target.value };
                      onChange({ materials: next });
                    }}
                  />
                ) : (
                  m.quantity
                )}
              </td>
              <td className="p-3 text-right tabular-nums text-ink-200">{fmtUSD(m.unit_cost_usd)}</td>
              <td className="p-3 text-right font-medium tabular-nums text-ink-50">{fmtUSD(m.total_cost_usd)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BudgetView({
  plan,
}: {
  plan: ExperimentPlan;
  editing: boolean;
  onChange: (patch: Partial<ExperimentPlan>) => void;
}) {
  const max = Math.max(...plan.budget.lines.map((l) => l.cost_usd), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="label">Total budget</div>
          <div className="font-display text-4xl font-semibold tracking-tight text-gradient-accent">
            <AnimatedNumber value={plan.budget.total_usd} format={(n) => fmtUSD(Math.round(n))} />
          </div>
        </div>
        <div className="text-sm text-ink-300">+{plan.budget.contingency_pct}% contingency</div>
      </div>
      <div className="space-y-2">
        {plan.budget.lines.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.35 }}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <span className="font-medium">{l.category}</span>
                <span className="ml-2 text-ink-300">{l.description}</span>
              </div>
              <div className="font-mono tabular-nums">{fmtUSD(l.cost_usd)}</div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(l.cost_usd / max) * 100}%` }}
                transition={{ delay: 0.06 * i + 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(139,92,246,0.95), rgba(34,211,238,0.95))",
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TimelineView({ plan }: { plan: ExperimentPlan }) {
  const total = plan.timeline.total_weeks;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm text-ink-300">
        <CalendarRange className="h-4 w-4 text-cyan-300" />
        {total} weeks · {plan.timeline.phases.length} phases
      </div>
      <div className="space-y-2">
        {plan.timeline.phases.map((p, i) => {
          const left = ((p.start_week - 1) / total) * 100;
          const width = ((p.end_week - p.start_week + 1) / total) * 100;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-ink-400">
                    week {p.start_week}–{p.end_week} · {p.duration}
                  </span>
                </div>
                {p.depends_on.length > 0 && (
                  <div className="text-xs text-ink-400">→ depends: {p.depends_on.join(", ")}</div>
                )}
              </div>
              <div className="relative mt-2 h-2 w-full rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ left: `${left}%`, width: 0 }}
                  animate={{ left: `${left}%`, width: `${width}%` }}
                  transition={{ delay: 0.08 * i + 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute h-2 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(139,92,246,0.95), rgba(34,211,238,0.95), rgba(45,212,191,0.95))",
                    boxShadow: "0 0 18px rgba(139,92,246,0.45)",
                  }}
                />
              </div>
              {p.deliverables.length > 0 && (
                <div className="mt-2 text-xs text-ink-300">
                  Deliverables: {p.deliverables.join(" · ")}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ValidationView({ plan }: { plan: ExperimentPlan }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {plan.validation.map((v, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.35 }}
        >
          <Spotlight className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="font-display text-sm font-semibold text-ink-50">{v.name}</div>
            <div className="mt-1 text-xs text-ink-400">{v.measurement}</div>
            <div className="mt-2 text-sm">
              <span className="text-emerald-300">✓ Success:</span> {v.success_threshold}
            </div>
            <div className="text-sm">
              <span className="text-rose-300">× Failure:</span> {v.failure_mode}
            </div>
            {v.statistical_test && (
              <div className="mt-1 text-xs text-ink-300">Stats: {v.statistical_test}</div>
            )}
            {v.sample_size && <div className="text-xs text-ink-300">N: {v.sample_size}</div>}
          </Spotlight>
        </motion.div>
      ))}
    </div>
  );
}

function PersonnelView({ plan }: { plan: ExperimentPlan }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {plan.personnel.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.35 }}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-semibold">{p.role}</span>
            <span className="pill">{p.fte} FTE</span>
            <span className="pill">{p.weeks} weeks</span>
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-200">
            {p.responsibilities.map((r, j) => (
              <li key={j}>{r}</li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

function RisksView({ plan }: { plan: ExperimentPlan }) {
  const tone = (lvl: "low" | "medium" | "high") =>
    lvl === "high"
      ? "border-rose-400/40 bg-rose-400/10 text-rose-200"
      : lvl === "medium"
      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
  return (
    <div className="space-y-3">
      {plan.risks.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.35 }}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={cn("pill", tone(r.likelihood))}>L: {r.likelihood}</span>
            <span className={cn("pill", tone(r.impact))}>I: {r.impact}</span>
            <span className="font-medium">{r.risk}</span>
          </div>
          <div className="mt-2 text-sm text-ink-200">Mitigation: {r.mitigation}</div>
        </motion.div>
      ))}
    </div>
  );
}

function WhyView({ plan }: { plan: ExperimentPlan }) {
  return (
    <ul className="space-y-2">
      {plan.why_this_plan.map((w, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.35 }}
          className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm"
        >
          <span className="mt-0.5 text-violet-300">→</span> {w}
        </motion.li>
      ))}
    </ul>
  );
}

function FeedbackPanel({
  defaultSection,
  onSubmit,
  plan,
}: {
  defaultSection: FeedbackEntry["section"];
  onSubmit: (e: Omit<FeedbackEntry, "id" | "created_at" | "plan_id">) => Promise<void>;
  plan: ExperimentPlan;
}) {
  const [section, setSection] = useState<FeedbackEntry["section"]>(defaultSection);
  const [original, setOriginal] = useState("");
  const [correction, setCorrection] = useState("");
  const [rating, setRating] = useState(4);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="border-t border-white/10 bg-white/[0.02] p-6">
      <div className="mb-3 flex items-center gap-2">
        <Pencil className="h-4 w-4 text-violet-300" />
        <span className="label">Scientist review — your corrections train the next plan</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          className="input"
          value={section}
          onChange={(e) => setSection(e.target.value as FeedbackEntry["section"])}
        >
          {(["protocol", "materials", "budget", "timeline", "validation", "controls", "general"] as const).map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
        <input
          className="input sm:col-span-2"
          placeholder="What did the plan get wrong?"
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
        />
        <textarea
          className="input min-h-[80px] sm:col-span-3"
          placeholder="What would a senior scientist do instead? Be specific (concentrations, suppliers, sample sizes, etc.)"
          value={correction}
          onChange={(e) => setCorrection(e.target.value)}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={cn(
                "rounded p-1 transition",
                n <= rating ? "text-amber-300" : "text-ink-500 hover:text-ink-300"
              )}
              aria-label={`rate ${n}`}
            >
              <Star className="h-4 w-4 fill-current" />
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          disabled={busy || !correction.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              await onSubmit({
                section,
                original,
                correction,
                rating,
                hypothesis: plan.intent.hypothesis_restated,
                domain: plan.intent.domain,
              });
              setDone(true);
              setOriginal("");
              setCorrection("");
              setTimeout(() => setDone(false), 2400);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Submit feedback
        </motion.button>
        <AnimatePresence>
          {done && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-emerald-300"
            >
              Saved — feedback will guide future plans.
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
