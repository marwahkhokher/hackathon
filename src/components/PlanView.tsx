"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import type { ExperimentPlan, FeedbackEntry, StoredPlan } from "@/lib/schemas";
import { cn, fmtUSD } from "@/lib/utils";

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
  { id: "why", label: "Why this plan", icon: Lightbulb },
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
    <div className="card overflow-hidden">
      {/* header */}
      <div className="flex flex-col gap-4 border-b border-ink-700 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="pill">v{stored.version}</span>
            <span className="pill">{plan.intent.domain.replace("_", " ")}</span>
            {stored.novelty?.status && (
              <span className="pill capitalize">{stored.novelty.status.replace(/_/g, " ")}</span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-ink-50 sm:text-2xl">{plan.title}</h2>
          <p className="mt-1 text-sm text-ink-200">{plan.summary}</p>
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
                Cancel
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
              <button
                className="btn-primary"
                onClick={onRegenerate}
                disabled={regenBusy}
              >
                {regenBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                Regenerate from feedback
              </button>
            </>
          )}
        </div>
      </div>

      {/* metric strip */}
      <div className="grid grid-cols-2 gap-px bg-ink-700 sm:grid-cols-4">
        <Metric label="Budget" value={fmtUSD(plan.budget.total_usd)} sub={`+${plan.budget.contingency_pct}% contingency`} />
        <Metric label="Timeline" value={`${plan.timeline.total_weeks} weeks`} sub={`${plan.timeline.phases.length} phases`} />
        <Metric label="Materials" value={`${plan.materials.length} line items`} sub={fmtUSD(totalMaterials)} />
        <Metric label="Validation" value={`${plan.validation.length} criteria`} sub={`${plan.controls.length} controls`} />
      </div>

      {/* tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-ink-700 px-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition",
                tab === t.id
                  ? "border-accent-500 text-ink-50"
                  : "border-transparent text-ink-300 hover:text-ink-100"
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* body */}
      <div className="p-6">
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
      </div>

      <FeedbackPanel
        defaultSection={tab === "why" || tab === "summary" ? "general" : (tab as FeedbackEntry["section"])}
        onSubmit={onSubmitFeedback}
        plan={plan}
      />
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-ink-900 px-5 py-4">
      <div className="label">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink-50">{value}</div>
      {sub && <div className="text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

function SummaryView({ plan }: { plan: ExperimentPlan }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-ink-700 p-4">
        <div className="label">Intent</div>
        <div className="mt-2 space-y-1 text-sm">
          <KV k="Intervention" v={plan.intent.intervention} />
          <KV k="Comparator" v={plan.intent.comparator} />
          <KV k="Model system" v={plan.intent.model_system} />
          <KV k="Outcome" v={`${plan.intent.outcome.name} — ${plan.intent.outcome.metric}`} />
          {plan.intent.outcome.threshold && <KV k="Threshold" v={plan.intent.outcome.threshold} />}
        </div>
      </div>
      <div className="rounded-xl border border-ink-700 p-4">
        <div className="label">Controls</div>
        <ul className="mt-2 space-y-1 text-sm">
          {plan.controls.map((c, i) => (
            <li key={i}>
              <span className="pill mr-2 capitalize">{c.type}</span>
              {c.description}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-ink-700 p-4 sm:col-span-2">
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
        <li key={step.id} className="rounded-xl border border-ink-700 bg-ink-900/40 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">{step.id}</span>
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
              <h4 className="text-sm font-medium text-ink-50">{step.title}</h4>
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
                <span key={j} className="pill border-accent-500/30 bg-accent-500/10 text-accent-200">
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
        </li>
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
    <div className="overflow-x-auto rounded-xl border border-ink-700">
      <table className="w-full text-sm">
        <thead className="bg-ink-800/50 text-xs uppercase text-ink-300">
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
            <tr key={i} className="border-t border-ink-700">
              <td className="p-3">
                <div className="font-medium text-ink-50">{m.name}</div>
                <div className="text-xs text-ink-400">{m.category}</div>
              </td>
              <td className="p-3">{m.supplier}</td>
              <td className="p-3 font-mono text-xs">
                {m.url ? (
                  <a className="text-accent-300 hover:underline" target="_blank" rel="noreferrer" href={m.url}>
                    {m.catalog_number}
                  </a>
                ) : (
                  m.catalog_number ?? "—"
                )}
              </td>
              <td className="p-3">
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
              <td className="p-3 text-right">{fmtUSD(m.unit_cost_usd)}</td>
              <td className="p-3 text-right font-medium">{fmtUSD(m.total_cost_usd)}</td>
            </tr>
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
          <div className="text-3xl font-semibold text-ink-50">{fmtUSD(plan.budget.total_usd)}</div>
        </div>
        <div className="text-sm text-ink-300">+{plan.budget.contingency_pct}% contingency</div>
      </div>
      <div className="space-y-2">
        {plan.budget.lines.map((l, i) => (
          <div key={i} className="rounded-xl border border-ink-700 p-3">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{l.category}</span>
                <span className="ml-2 text-ink-300">{l.description}</span>
              </div>
              <div className="font-mono">{fmtUSD(l.cost_usd)}</div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-accent-500"
                style={{ width: `${(l.cost_usd / max) * 100}%` }}
              />
            </div>
          </div>
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
        <CalendarRange className="h-4 w-4" />
        {total} weeks · {plan.timeline.phases.length} phases
      </div>
      <div className="space-y-2">
        {plan.timeline.phases.map((p, i) => {
          const left = ((p.start_week - 1) / total) * 100;
          const width = ((p.end_week - p.start_week + 1) / total) * 100;
          return (
            <div key={i} className="rounded-xl border border-ink-700 p-3">
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
              <div className="relative mt-2 h-2 w-full rounded-full bg-ink-800">
                <div
                  className="absolute h-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-300"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>
              {p.deliverables.length > 0 && (
                <div className="mt-2 text-xs text-ink-300">Deliverables: {p.deliverables.join(" · ")}</div>
              )}
            </div>
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
        <div key={i} className="rounded-xl border border-ink-700 p-4">
          <div className="text-sm font-medium text-ink-50">{v.name}</div>
          <div className="mt-1 text-xs text-ink-400">{v.measurement}</div>
          <div className="mt-2 text-sm">
            <span className="text-emerald-300">Success:</span> {v.success_threshold}
          </div>
          <div className="text-sm">
            <span className="text-rose-300">Failure:</span> {v.failure_mode}
          </div>
          {v.statistical_test && <div className="mt-1 text-xs text-ink-300">Stats: {v.statistical_test}</div>}
          {v.sample_size && <div className="text-xs text-ink-300">N: {v.sample_size}</div>}
        </div>
      ))}
    </div>
  );
}

function PersonnelView({ plan }: { plan: ExperimentPlan }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {plan.personnel.map((p, i) => (
        <div key={i} className="rounded-xl border border-ink-700 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{p.role}</span>
            <span className="pill">{p.fte} FTE</span>
            <span className="pill">{p.weeks} weeks</span>
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-200">
            {p.responsibilities.map((r, j) => (
              <li key={j}>{r}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RisksView({ plan }: { plan: ExperimentPlan }) {
  return (
    <div className="space-y-3">
      {plan.risks.map((r, i) => (
        <div key={i} className="rounded-xl border border-ink-700 p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="pill">L: {r.likelihood}</span>
            <span className="pill">I: {r.impact}</span>
            <span className="font-medium">{r.risk}</span>
          </div>
          <div className="mt-2 text-sm text-ink-200">Mitigation: {r.mitigation}</div>
        </div>
      ))}
    </div>
  );
}

function WhyView({ plan }: { plan: ExperimentPlan }) {
  return (
    <ul className="space-y-2">
      {plan.why_this_plan.map((w, i) => (
        <li key={i} className="rounded-xl border border-ink-700 p-3 text-sm">
          <span className="text-accent-300">→</span> {w}
        </li>
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
    <div className="border-t border-ink-700 bg-ink-900/40 p-6">
      <div className="mb-3 flex items-center gap-2">
        <Pencil className="h-4 w-4 text-accent-300" />
        <span className="label">Scientist review — your corrections train the next plan</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          className="input"
          value={section}
          onChange={(e) => setSection(e.target.value as FeedbackEntry["section"])}
        >
          {(["protocol", "materials", "budget", "timeline", "validation", "controls", "general"] as const).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
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
              className={cn("rounded p-1", n <= rating ? "text-amber-300" : "text-ink-500")}
              aria-label={`rate ${n}`}
            >
              <Star className="h-4 w-4 fill-current" />
            </button>
          ))}
        </div>
        <button
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
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Submit feedback
        </button>
        {done && <span className="text-xs text-emerald-300">Saved — feedback will guide future plans.</span>}
      </div>
    </div>
  );
}
