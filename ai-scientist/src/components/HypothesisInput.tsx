'use client';

import { useState } from 'react';
import { Send, Loader2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { SAMPLE_HYPOTHESES } from '@/data/suppliers';

interface HypothesisInputProps {
  onSubmit: (hypothesis: string) => void;
  isLoading: boolean;
  initialValue: string;
}

export function HypothesisInput({ onSubmit, isLoading, initialValue }: HypothesisInputProps) {
  const [text, setText] = useState(initialValue);
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 10 && !isLoading) {
      onSubmit(text.trim());
    }
  };

  return (
    <div className="fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100">
          What do you want to <span className="text-indigo-400">test</span>?
        </h2>
        <p className="mt-3 text-zinc-400 max-w-2xl mx-auto">
          Enter a scientific hypothesis and we&apos;ll generate a complete, operationally realistic experiment plan
          — with protocol, materials, budget, timeline, and validation strategy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="glass rounded-2xl p-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g., Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls..."
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 px-5 py-4 rounded-xl resize-none focus:outline-none min-h-[140px] text-sm leading-relaxed"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/50">
            <span className="text-xs text-zinc-500">
              {text.length > 0 ? `${text.length} characters` : 'Minimum 10 characters'}
            </span>
            <button
              type="submit"
              disabled={text.trim().length < 10 || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-all disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Plan
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="max-w-3xl mx-auto mt-6">
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors mx-auto"
        >
          <Lightbulb className="w-4 h-4" />
          Try an example hypothesis
          {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showExamples && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 fade-in-up">
            {SAMPLE_HYPOTHESES.map(sample => (
              <button
                key={sample.id}
                onClick={() => setText(sample.hypothesis)}
                className="text-left p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 hover:bg-zinc-800/30 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {sample.domain}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 group-hover:text-zinc-300 line-clamp-3 transition-colors">
                  {sample.plain_english}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
