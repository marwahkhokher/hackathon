# The AI Scientist

> From a natural-language scientific hypothesis to a runnable, operationally realistic experiment plan — in seconds.

Built for **Hack-Nation × World Bank Youth Summit · Global AI Hackathon 2026** (Challenge 04 — *The AI Scientist*, Fulcrum Science).

## Two implementations live in this repo

This repository has **two parallel implementations** of the AI Scientist that were merged together. Pick the one you want to run:

| Path | Description |
|---|---|
| **`/` (repo root)** | The primary, demo-ready implementation. Next.js 14 App Router, futuristic redesigned UI with aurora background, glass morphism, gradient text, magnetic submit, animated tab indicator, and counter animations. **This is the one we recommend running.** See [`PROJECT.md`](./PROJECT.md) for the full architecture, schema, demo script, and rationale. |
| **[`/ai-scientist`](./ai-scientist/)** | The alternate scaffold. Has its own `package.json`, README, and source tree. Useful as a reference. |

## Quick start (primary, at repo root)

```bash
npm install
cp .env.example .env.local      # add LLM_API_KEY and TAVILY_API_KEY
npm run dev                     # http://localhost:3000
```

No API keys yet? Click **Load demo plan** in the header to explore the UI with a fully-populated example.

## Pipeline

1. **Input** — natural-language hypothesis → structured `ScientificIntent`.
2. **Literature QC** — Tavily + Semantic Scholar → *not_found · similar_work_exists · exact_match_found* with 1–3 references.
3. **Plan** — schema-locked, streaming `ExperimentPlan` with protocol, materials (real catalog numbers), itemized USD budget, week-by-week timeline, validation, risks.
4. **Feedback loop** — per-section corrections persist and are injected as few-shot priors into the next regenerated plan.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · Zod · OpenAI-compatible LLM (works with OpenAI, OpenRouter, Together, Cursor proxy) · Tavily · Semantic Scholar Graph API · Lucide.
