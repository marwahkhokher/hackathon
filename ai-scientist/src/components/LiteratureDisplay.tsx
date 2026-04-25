'use client';

import { LiteratureResult } from '@/types';
import { BookOpen, ExternalLink, AlertCircle, CheckCircle2, Search } from 'lucide-react';

interface Props {
  result: LiteratureResult;
}

const statusConfig = {
  'Not Found': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Novel — No existing match found' },
  'Similar Work Exists': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertCircle, label: 'Similar work exists in literature' },
  'Exact Match Found': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle, label: 'Exact or near-exact match found' },
};

export function LiteratureDisplay({ result }: Props) {
  const config = statusConfig[result.novelty_status];
  const StatusIcon = config.icon;

  return (
    <div className="fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-zinc-400" />
        <h3 className="text-lg font-semibold text-zinc-100">Literature Quality Check</h3>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className={`flex items-start gap-3 p-4 rounded-xl ${config.bg} border ${config.border} mb-6`}>
          <StatusIcon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
          <div>
            <p className={`font-medium ${config.color}`}>{config.label}</p>
            <p className="text-sm text-zinc-400 mt-1">{result.summary}</p>
          </div>
        </div>

        {result.references.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Relevant References</h4>
            <div className="space-y-3">
              {result.references.map((ref, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/30 hover:border-zinc-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{ref.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {ref.authors} {ref.year && `· ${ref.year}`} {ref.source && `· ${ref.source}`}
                      </p>
                      <p className="text-xs text-zinc-400 mt-2">{ref.relevance}</p>
                    </div>
                    {ref.url && (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-500 hover:text-indigo-400 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.search_queries_used.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Search className="w-3 h-3 text-zinc-500" />
              <span className="text-xs text-zinc-500">Search queries used</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.search_queries_used.map((q, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-zinc-800/50 text-zinc-500 font-mono">
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
