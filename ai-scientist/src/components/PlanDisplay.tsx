'use client';

import { useState } from 'react';
import { ExperimentPlan } from '@/types';
import {
  FlaskConical, Package, DollarSign, Clock, CheckSquare,
  AlertTriangle, BookOpen, RefreshCw, Loader2, ChevronDown,
  ChevronRight, Download, Info
} from 'lucide-react';

interface Props {
  plan: ExperimentPlan | null;
  streamingContent: string;
  isStreaming: boolean;
  onRegenerate: () => void;
}

type TabKey = 'protocol' | 'materials' | 'timeline' | 'validation' | 'rationale';

export function PlanDisplay({ plan, streamingContent, isStreaming, onRegenerate }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('protocol');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));

  const toggleStep = (index: number) => {
    const next = new Set(expandedSteps);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedSteps(next);
  };

  if (isStreaming && !plan) {
    return (
      <div className="fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-zinc-100">Generating Experiment Plan</h3>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-indigo-400 pulse-dot" />
            <span className="text-sm text-zinc-400">AI is generating your experiment plan...</span>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-4 font-mono text-xs text-zinc-400 max-h-96 overflow-y-auto whitespace-pre-wrap">
            {streamingContent || 'Initializing plan generation...'}
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const tabs: { key: TabKey; label: string; icon: typeof FlaskConical }[] = [
    { key: 'protocol', label: 'Protocol', icon: FlaskConical },
    { key: 'materials', label: 'Materials & Budget', icon: Package },
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'validation', label: 'Validation', icon: CheckSquare },
    { key: 'rationale', label: 'Rationale', icon: Info },
  ];

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment-plan-${plan.title?.replace(/\s+/g, '-').toLowerCase() || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-zinc-100">Experiment Plan</h3>
          </div>
          {plan.title && (
            <p className="text-sm text-zinc-400 mt-1 ml-7">{plan.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total Budget" value={plan.total_budget || 'N/A'} icon={DollarSign} color="text-emerald-400" />
        <SummaryCard label="Duration" value={plan.total_duration || 'N/A'} icon={Clock} color="text-blue-400" />
        <SummaryCard label="Protocol Steps" value={`${plan.protocol?.length || 0} steps`} icon={FlaskConical} color="text-violet-400" />
        <SummaryCard label="Risk Factors" value={`${plan.risks?.length || 0} identified`} icon={AlertTriangle} color="text-amber-400" />
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex border-b border-zinc-800/50 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                ${activeTab === tab.key
                  ? 'text-indigo-400 border-indigo-400 bg-indigo-500/5'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-600'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'protocol' && (
            <ProtocolTab protocol={plan.protocol} expandedSteps={expandedSteps} toggleStep={toggleStep} />
          )}
          {activeTab === 'materials' && (
            <MaterialsTab materials={plan.materials} totalBudget={plan.total_budget} />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab timeline={plan.timeline} totalDuration={plan.total_duration} />
          )}
          {activeTab === 'validation' && (
            <ValidationTab validation={plan.validation} />
          )}
          {activeTab === 'rationale' && (
            <RationaleTab plan={plan} />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof DollarSign; color: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function ProtocolTab({ protocol, expandedSteps, toggleStep }: {
  protocol: ExperimentPlan['protocol'];
  expandedSteps: Set<number>;
  toggleStep: (i: number) => void;
}) {
  if (!protocol || protocol.length === 0) {
    return <p className="text-zinc-500 text-sm">No protocol steps generated.</p>;
  }

  return (
    <div className="space-y-3">
      {protocol.map((step, i) => {
        const isExpanded = expandedSteps.has(i);
        return (
          <div key={i} className="rounded-xl bg-zinc-900/50 border border-zinc-800/30 overflow-hidden">
            <button
              onClick={() => toggleStep(i)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/20 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-400 flex-shrink-0">
                {step.step_number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200">{step.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{step.duration}</p>
              </div>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-zinc-800/30">
                <p className="text-sm text-zinc-300 mt-3 whitespace-pre-wrap leading-relaxed">{step.description}</p>
                {step.equipment_needed && step.equipment_needed.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Equipment</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {step.equipment_needed.map((eq, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded bg-zinc-800/50 text-zinc-400">{eq}</span>
                      ))}
                    </div>
                  </div>
                )}
                {step.critical_notes && step.critical_notes.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Critical Notes</span>
                    <ul className="mt-1.5 space-y-1">
                      {step.critical_notes.map((note, j) => (
                        <li key={j} className="text-xs text-amber-300/70 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MaterialsTab({ materials, totalBudget }: { materials: ExperimentPlan['materials']; totalBudget: string }) {
  if (!materials || materials.length === 0) {
    return <p className="text-zinc-500 text-sm">No materials listed.</p>;
  }

  return (
    <div className="space-y-6">
      {materials.map((category, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-zinc-200">{category.category}</h4>
            <span className="text-sm font-semibold text-zinc-300">{category.subtotal}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="text-left py-2 pr-4">Item</th>
                  <th className="text-left py-2 pr-4">Catalog #</th>
                  <th className="text-left py-2 pr-4">Supplier</th>
                  <th className="text-left py-2 pr-4">Qty</th>
                  <th className="text-right py-2 pr-4">Unit Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {category.items.map((item, j) => (
                  <tr key={j} className="text-zinc-300 hover:bg-zinc-800/20">
                    <td className="py-2.5 pr-4 font-medium">{item.name}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-zinc-400">{item.catalog_number}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{item.supplier}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">{item.quantity}</td>
                    <td className="py-2.5 pr-4 text-right text-zinc-400">{item.unit_price}</td>
                    <td className="py-2.5 text-right font-medium">{item.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">Total Estimated Budget</span>
        <span className="text-xl font-bold text-indigo-400">{totalBudget}</span>
      </div>
    </div>
  );
}

function TimelineTab({ timeline, totalDuration }: { timeline: ExperimentPlan['timeline']; totalDuration: string }) {
  if (!timeline || timeline.length === 0) {
    return <p className="text-zinc-500 text-sm">No timeline generated.</p>;
  }

  const maxWeek = Math.max(...timeline.map(p => p.end_week || 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Total Duration: <strong className="text-zinc-200">{totalDuration}</strong></span>
      </div>

      {/* Gantt-style visualization */}
      <div className="space-y-3">
        {timeline.map((phase, i) => {
          const startPct = ((phase.start_week - 1) / maxWeek) * 100;
          const widthPct = ((phase.end_week - phase.start_week + 1) / maxWeek) * 100;
          const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500'];
          const color = colors[i % colors.length];

          return (
            <div key={i} className="rounded-xl bg-zinc-900/50 border border-zinc-800/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-zinc-200">{phase.phase}</h4>
                <span className="text-xs text-zinc-500">{phase.duration} (Weeks {phase.start_week}–{phase.end_week})</span>
              </div>

              {/* Gantt bar */}
              <div className="h-3 bg-zinc-800/50 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full ${color} rounded-full opacity-60`}
                  style={{ marginLeft: `${startPct}%`, width: `${widthPct}%` }}
                />
              </div>

              {phase.tasks && phase.tasks.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-zinc-500">Tasks:</span>
                  <ul className="mt-1 space-y-0.5">
                    {phase.tasks.map((task, j) => (
                      <li key={j} className="text-xs text-zinc-400 flex items-start gap-1.5">
                        <span className="text-zinc-600 mt-0.5">•</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {phase.milestones && phase.milestones.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {phase.milestones.map((m, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ValidationTab({ validation }: { validation: ExperimentPlan['validation'] }) {
  if (!validation) {
    return <p className="text-zinc-500 text-sm">No validation strategy generated.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <InfoCard label="Primary Endpoint" value={validation.primary_endpoint} />
        <InfoCard label="Statistical Method" value={validation.statistical_method} />
        <InfoCard label="Success Criteria" value={validation.success_criteria} className="border-emerald-500/20 bg-emerald-500/5" />
        <InfoCard label="Failure Criteria" value={validation.failure_criteria} className="border-red-500/20 bg-red-500/5" />
      </div>

      <InfoCard label="Sample Size Justification" value={validation.sample_size_justification} />

      {validation.secondary_endpoints && validation.secondary_endpoints.length > 0 && (
        <div>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Secondary Endpoints</span>
          <ul className="mt-2 space-y-1.5">
            {validation.secondary_endpoints.map((ep, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="text-zinc-600 mt-1">•</span>
                {ep}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.controls && validation.controls.length > 0 && (
        <div>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Controls</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {validation.controls.map((c, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RationaleTab({ plan }: { plan: ExperimentPlan }) {
  return (
    <div className="space-y-6">
      {plan.generation_rationale && (
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">Why This Plan Was Generated</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{plan.generation_rationale}</p>
        </div>
      )}

      {plan.assumptions && plan.assumptions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-200 mb-3">Assumptions</h4>
          <ul className="space-y-2">
            {plan.assumptions.map((a, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-800/50 flex items-center justify-center text-xs text-zinc-500 flex-shrink-0 mt-0.5">{i + 1}</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.risks && plan.risks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Risks & Mitigations
          </h4>
          <ul className="space-y-2">
            {plan.risks.map((r, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.references_used && plan.references_used.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-200 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            References & Sources
          </h4>
          <ul className="space-y-1.5">
            {plan.references_used.map((ref, i) => (
              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="text-zinc-600">[{i + 1}]</span>
                {ref}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/30 ${className}`}>
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <p className="text-sm text-zinc-300 mt-1.5">{value}</p>
    </div>
  );
}
