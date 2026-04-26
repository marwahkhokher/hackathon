"use client";

import { CheckCircle2, AlertTriangle, Search, ExternalLink, Quote } from "lucide-react";
import { motion } from "framer-motion";
import type { NoveltyResult } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Spotlight } from "./Spotlight";

const META: Record<
  NoveltyResult["status"],
  { label: string; tone: string; dot: string; icon: React.ComponentType<{ className?: string }> }
> = {
  not_found: {
    label: "No prior matching protocol",
    tone: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
  similar_work_exists: {
    label: "Similar work exists",
    tone: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
    icon: AlertTriangle,
  },
  exact_match_found: {
    label: "Exact match found",
    tone: "border-rose-400/40 bg-rose-400/10 text-rose-300",
    dot: "bg-rose-400",
    icon: AlertTriangle,
  },
};

export function NoveltyCard({ novelty }: { novelty: NoveltyResult }) {
  const meta = META[novelty.status];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card spotlight p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-cyan-300" />
        <span className="label">Literature QC</span>
      </div>

      <motion.div
        layout
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm",
          meta.tone
        )}
      >
        <span className="relative inline-flex h-2 w-2">
          <span className={cn("absolute inline-flex h-full w-full animate-ping-soft rounded-full", meta.dot)} />
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
        </span>
        <Icon className="h-4 w-4" /> {meta.label}
      </motion.div>

      <p className="mt-3 text-sm leading-relaxed text-ink-100">{novelty.rationale}</p>

      {novelty.references.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-1">
          {novelty.references.map((r, i) => (
            <motion.a
              key={i}
              href={r.url || "#"}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 * i, duration: 0.4 }}
              className="group"
            >
              <Spotlight className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="pill text-[10px]">[{i + 1}]</span>
                      {r.source && (
                        <span className="pill text-[10px] capitalize">{r.source.replace("_", " ")}</span>
                      )}
                      {r.year && <span className="pill text-[10px]">{r.year}</span>}
                    </div>
                    <div className="mt-1.5 truncate text-sm font-medium text-ink-50 group-hover:text-white">
                      {r.title}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-ink-300">
                      {(r.authors ?? []).slice(0, 3).join(", ")}
                      {r.authors && r.authors.length > 3 && " et al."}
                      {r.venue ? ` · ${r.venue}` : ""}
                    </div>
                    {r.relevance && (
                      <div className="mt-2 flex gap-2 text-xs leading-relaxed text-ink-300">
                        <Quote className="h-3 w-3 shrink-0 text-violet-300" />
                        <span>{r.relevance}</span>
                      </div>
                    )}
                  </div>
                  <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-300" />
                </div>
              </Spotlight>
            </motion.a>
          ))}
        </div>
      )}

      <div className="mt-4 text-[11px] text-ink-400">
        <span className="text-ink-500">Query · </span>
        <code className="font-mono text-ink-300">{novelty.query_used}</code>
      </div>
    </motion.div>
  );
}
