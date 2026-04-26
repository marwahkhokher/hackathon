'use client';

import { PipelineStage } from '@/types';
import { FileText, Search, FlaskConical, CheckCircle2, Loader2 } from 'lucide-react';

interface PipelineProgressProps {
  stage: PipelineStage;
}

const stages: { key: PipelineStage; label: string; icon: typeof FileText }[] = [
  { key: 'input', label: 'Hypothesis', icon: FileText },
  { key: 'literature', label: 'Literature QC', icon: Search },
  { key: 'generating', label: 'Plan Generation', icon: FlaskConical },
  { key: 'complete', label: 'Complete', icon: CheckCircle2 },
];

const stageOrder: Record<PipelineStage, number> = {
  input: 0,
  parsing: 0,
  literature: 1,
  generating: 2,
  complete: 3,
};

export function PipelineProgress({ stage }: PipelineProgressProps) {
  const currentIndex = stageOrder[stage];

  return (
    <div className="flex items-center justify-center gap-0 mt-4">
      {stages.map((s, i) => {
        const isActive = i === currentIndex;
        const isComplete = i < currentIndex;
        const isPending = i > currentIndex;
        const Icon = s.icon;

        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                  ${isComplete ? 'bg-indigo-500/20 border-2 border-indigo-500 text-indigo-400' : ''}
                  ${isActive ? 'bg-indigo-500/10 border-2 border-indigo-400 text-indigo-300 shadow-lg shadow-indigo-500/20' : ''}
                  ${isPending ? 'bg-zinc-800/50 border-2 border-zinc-700 text-zinc-500' : ''}
                `}
              >
                {isActive && stage !== 'complete' && stage !== 'input' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isComplete ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors
                  ${isActive ? 'text-indigo-300' : isComplete ? 'text-indigo-400/70' : 'text-zinc-500'}`}
              >
                {s.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 mb-6 transition-colors duration-500
                  ${i < currentIndex ? 'bg-indigo-500/50' : 'bg-zinc-700/50'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
