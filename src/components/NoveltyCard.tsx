"use client";

import { CheckCircle2, AlertTriangle, Search, ExternalLink } from "lucide-react";
import type { NoveltyResult } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const META: Record<
  NoveltyResult["status"],
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  not_found: {
    label: "No prior matching protocol",
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
  },
  similar_work_exists: {
    label: "Similar work exists",
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    icon: AlertTriangle,
  },
  exact_match_found: {
    label: "Exact match found",
    tone: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    icon: AlertTriangle,
  },
};

export function NoveltyCard({ novelty }: { novelty: NoveltyResult }) {
  const meta = META[novelty.status];
  const Icon = meta.icon;
  return (
    <div className="card p-6">
      <div className="mb-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-accent-300" />
        <span className="label">Literature QC</span>
      </div>
      <div className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm", meta.tone)}>
        <Icon className="h-4 w-4" /> {meta.label}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-100">{novelty.rationale}</p>
      {novelty.references.length > 0 && (
        <div className="mt-4 space-y-3">
          {novelty.references.map((r, i) => (
            <a
              key={i}
              href={r.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-ink-700 bg-ink-900/60 p-3 hover:border-accent-500/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-ink-50">{r.title}</div>
                  <div className="mt-0.5 text-xs text-ink-300">
                    {(r.authors ?? []).slice(0, 3).join(", ")}
                    {r.authors && r.authors.length > 3 && " et al."} {r.year ? ` · ${r.year}` : ""}
                    {r.venue ? ` · ${r.venue}` : ""}
                    {r.source ? ` · ${r.source.replace("_", " ")}` : ""}
                  </div>
                  {r.relevance && (
                    <p className="mt-2 text-xs leading-relaxed text-ink-300">{r.relevance}</p>
                  )}
                </div>
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-ink-400" />
              </div>
            </a>
          ))}
        </div>
      )}
      <div className="mt-3 text-[11px] text-ink-400">
        Query used: <code className="font-mono">{novelty.query_used}</code>
      </div>
    </div>
  );
}
