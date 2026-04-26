'use client';

import { StructuredHypothesis } from '@/types';
import { Beaker, ArrowRight, Target, Settings, Gauge, FlaskConical } from 'lucide-react';

interface Props {
  hypothesis: StructuredHypothesis;
}

export function StructuredHypothesisDisplay({ hypothesis }: Props) {
  const fields = [
    { icon: Settings, label: 'Independent Variable', value: hypothesis.independent_variable, color: 'text-blue-400' },
    { icon: Target, label: 'Dependent Variable', value: hypothesis.dependent_variable, color: 'text-emerald-400' },
    { icon: FlaskConical, label: 'Intervention', value: hypothesis.intervention, color: 'text-violet-400' },
    { icon: ArrowRight, label: 'Expected Outcome', value: hypothesis.expected_outcome, color: 'text-amber-400' },
    { icon: Beaker, label: 'Mechanism', value: hypothesis.mechanism, color: 'text-rose-400' },
    { icon: Gauge, label: 'Measurement', value: hypothesis.measurement_method, color: 'text-cyan-400' },
  ];

  return (
    <div className="fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">Structured Hypothesis</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {hypothesis.domain}
        </span>
      </div>

      <div className="glass rounded-2xl p-6">
        <p className="text-sm text-zinc-400 italic mb-6 pb-4 border-b border-zinc-800/50">
          &ldquo;{hypothesis.original_text}&rdquo;
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => (
            <div key={field.label} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/30">
              <div className="flex items-center gap-2 mb-1.5">
                <field.icon className={`w-3.5 h-3.5 ${field.color}`} />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{field.label}</span>
              </div>
              <p className="text-sm text-zinc-300">{field.value}</p>
            </div>
          ))}
        </div>

        {hypothesis.constraints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Constraints</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {hypothesis.constraints.map((c, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-zinc-800/50">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Control Condition</span>
          <p className="text-sm text-zinc-400 mt-1">{hypothesis.control_condition}</p>
        </div>
      </div>
    </div>
  );
}
