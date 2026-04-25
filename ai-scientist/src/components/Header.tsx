'use client';

import { FlaskConical, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

export function Header({ onReset }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">AI Scientist</h1>
            <p className="text-xs text-zinc-500 -mt-0.5">Hypothesis → Experiment Plan</p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Experiment
        </button>
      </div>
    </header>
  );
}
