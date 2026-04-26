# The AI Scientist

> From a natural-language scientific hypothesis to a runnable, operationally realistic experiment plan — in seconds.

Built for the **Hack-Nation × World Bank Youth Summit · Global AI Hackathon 2026**, challenge **#04 — The AI Scientist** (Fulcrum Science).

---

## 1 · The pitch

A scientist types a hypothesis like:

> *"Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol."*

The system returns:

1. **Structured intent** — intervention, comparator, model system, outcome, threshold, constraints.
2. **Literature QC** — *not_found · similar_work_exists · exact_match_found* with 1–3 references from arXiv / bioRxiv / protocols.io / Semantic Scholar / journals.
3. **Experiment plan** that a CRO could pick up on Monday and start running by Friday: a step-by-step protocol, a materials list with **specific suppliers and catalog numbers**, an **itemized USD budget**, a **week-by-week timeline with dependencies**, and a **validation strategy with sample sizes and statistical tests**.

The scientist can then **edit the plan inline**, **submit structured feedback per section**, and **regenerate** — and prior corrections (tagged by domain + keywords) are injected as few-shot priors into the next plan. That is the learning loop the brief asks for.

---

## 2 · System architecture

```
┌──────────────────────────────────── Browser (Next.js / React) ────────────────────────────────────┐
│                                                                                                   │
│   HypothesisInput  ──►  Stepper  ──►  IntentPills  ──►  NoveltyCard  ──►  PlanView (editable)     │
│                                                                                ▲                  │
│                                                                                │ feedback         │
└────────────────────────────────────────────────────────────┬───────────────────┴──────────────────┘
                                                             │  fetch (SSE for /api/plan)
                                                             ▼
┌──────────────────────────── Next.js Route Handlers (Node runtime) ────────────────────────────────┐
│                                                                                                   │
│   /api/intent     ──► LLM (JSON mode)              extracts ScientificIntent                      │
│   /api/novelty    ──► Tavily + Semantic Scholar  ──► LLM rubric  ──► NoveltyResult                │
│   /api/plan       ──► supplier catalog + relevant feedback + seed example  ──► LLM (streaming)    │
│   /api/feedback   ──► persists structured corrections + edited plans                              │
│   /api/plans      ──► list / fetch stored plans                                                   │
│   /api/seed       ──► one-click demo seed (works without any API keys)                            │
│                                                                                                   │
└────────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                                 │
                                ┌────────────────┼─────────────────┬──────────────────┐
                                ▼                ▼                 ▼                  ▼
                        OpenAI-compatible    Tavily API   Semantic Scholar     JSON store
                          LLM gateway       (literature)   Graph API        (file → swap   
                       (gpt-4o-mini default,                                  for Vercel KV)
                        any compatible)
```

### Why this shape

- **Streaming SSE** on `/api/plan` so the user sees progress immediately while the strict-JSON plan is being drafted (the brief asks for <5–10s perceived latency).
- **Two-stage retrieval** for novelty: Semantic Scholar (peer-reviewed) **plus** Tavily (protocols.io / bioRxiv / journals) — merged + deduped — then an LLM rubric makes the final classification with explicit indices, so the references in the UI are the ones the model actually cited.
- **Schema-locked LLM output** with `zod`. Every plan is validated against `ExperimentPlanSchema` before it reaches the UI, which is what eliminates the *"vague step / no catalog number / fake budget"* failure modes.
- **Grounding catalog**. A curated supplier dataset (`src/data/suppliers.ts`) is filtered by intent keywords and pasted into the plan prompt. The model is instructed to **prefer these**, which is why the materials table renders real Sigma / Thermo / ATCC catalog numbers instead of hallucinations.
- **Feedback few-shot loop**. `relevantFeedback(domain, keywords)` retrieves the top corrections by domain + keyword overlap and passes them to the plan prompt with an explicit *"INCORPORATE these"* instruction. Hit **Regenerate from feedback** and the next plan visibly reflects them — no re-prompting required.

---

## 3 · Project layout

```
ai-scientist/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # main UI (pipeline orchestrator)
│   │   ├── layout.tsx                  # global shell + Inter font
│   │   ├── globals.css                 # Tailwind + design tokens
│   │   └── api/
│   │       ├── intent/route.ts         # NL hypothesis → ScientificIntent
│   │       ├── novelty/route.ts        # intent → references + verdict
│   │       ├── plan/route.ts           # SSE-streamed ExperimentPlan
│   │       ├── feedback/route.ts       # POST corrections, PUT edited plans
│   │       ├── plans/route.ts          # list / fetch stored plans
│   │       └── seed/route.ts           # one-click demo plan
│   ├── components/
│   │   ├── HypothesisInput.tsx         # input + 4 sample hypotheses
│   │   ├── Stepper.tsx                 # 4-step pipeline visualizer
│   │   ├── NoveltyCard.tsx             # status pill + reference cards
│   │   └── PlanView.tsx                # tabbed plan + inline edit + feedback
│   ├── lib/
│   │   ├── schemas.ts                  # zod schemas (single source of truth)
│   │   ├── prompts.ts                  # INTENT / NOVELTY / PLAN prompts
│   │   ├── llm.ts                      # OpenAI-compatible client + JSON parse
│   │   ├── tavily.ts                   # Tavily literature + supplier search
│   │   ├── semanticScholar.ts          # Semantic Scholar Graph API
│   │   ├── store.ts                    # plans + feedback persistence
│   │   └── utils.ts                    # cn(), fmtUSD()
│   └── data/
│       ├── suppliers.ts                # curated supplier catalog (grounding)
│       └── seedPlans.ts                # expert example plan (few-shot + demo)
├── package.json
├── tailwind.config.js  /  postcss.config.js
├── next.config.js  /  tsconfig.json
└── .env.example                        # ← copy to .env.local
```

---

## 4 · Data: where it comes from

The platform **does not** rely on a single static dataset. It composes three sources:

| Source | Role | Notes |
|---|---|---|
| **`src/data/suppliers.ts`** | Grounding catalog of real reagents / consumables / biologicals (Sigma D2650, Thermo 10566016, ATCC CCL-2, Jackson 000664, DSMZ 2662, Metrohm DropSens DRP-110, …) | Curated snapshot of public catalog entries. Filtered by intent keywords and pasted into the plan prompt so the LLM picks from real items. |
| **`src/data/seedPlans.ts`** | One full expert-curated plan (HeLa trehalose vs DMSO, 3-arm) | Used as (a) a few-shot prior for plan generation, (b) the *Load demo plan* button so the UI is interactive without API keys. |
| **Live retrieval** — **Tavily** + **Semantic Scholar** | Per-hypothesis literature for the QC step | Tavily is locked to `arxiv.org / biorxiv.org / medrxiv.org / pubmed / nature.com / science.org / cell.com / protocols.io / bio-protocol.org / jove.com / openwetware.org`. |

**Manual input for adding more datasets:** drop additional rows into `SUPPLIER_CATALOG` (or replace it with an import from a CSV / Vercel KV / Postgres). The schema is already defined in `SupplierEntry`. Plans will start citing them automatically because the prompt is keyword-filtered.

---

## 5 · Database schema

The storage layer is intentionally minimal — a single JSON file (`data/feedback.local.json`) behind four functions in `src/lib/store.ts`, so it can be swapped for **Vercel KV** or **Postgres** without changing any caller. Two tables (or two top-level keys in the JSON):

### `plans`

| field | type | purpose |
|---|---|---|
| `id` | string (nanoid) | primary key |
| `hypothesis` | text | original NL input |
| `intent` | jsonb (ScientificIntent) | structured intent |
| `novelty` | jsonb (NoveltyResult) | QC result + references |
| `plan` | jsonb (ExperimentPlan) | full plan |
| `version` | int | incremented on each edit |
| `created_at`, `updated_at` | timestamptz | |

### `feedback`

| field | type | purpose |
|---|---|---|
| `id` | string | primary key |
| `plan_id` | fk → plans.id | source plan |
| `hypothesis` | text | denormalized for quick retrieval |
| `domain` | enum | indexed for retrieval |
| `section` | enum (`protocol \| materials \| budget \| timeline \| validation \| controls \| general`) | targeted correction |
| `original` | text | what was wrong |
| `correction` | text | what a senior scientist would do |
| `rating` | int 1–5 | overall plan rating |
| `scientist` | text? | optional reviewer ID |
| `created_at` | timestamptz | |

`relevantFeedback(domain, keywords)` scores by `domain == ?` (+3) plus keyword hits in the corrected text, returning the top 4 to be injected as few-shot priors. Swap this for pgvector / Vercel KV vector index for production.

---

## 6 · API surface

All routes return JSON; `/api/plan` additionally supports SSE streaming.

| route | method | request | response |
|---|---|---|---|
| `/api/intent` | POST | `{ hypothesis }` | `{ intent: ScientificIntent }` |
| `/api/novelty` | POST | `{ intent }` | `{ novelty: NoveltyResult }` |
| `/api/plan` | POST | `{ hypothesis, intent, novelty, stream?: true }` | SSE: `chunk` · `plan` · `done` · `error` events |
| `/api/feedback` | POST | `{ plan_id, section, original, correction, rating, hypothesis, domain }` *or* `{ plan_id, edited_plan }` | `{ ok }` |
| `/api/feedback` | GET | — | `{ feedback: FeedbackEntry[] }` |
| `/api/plans` | GET | `?id=` (optional) | `{ plan }` or `{ plans }` |
| `/api/seed` | POST | — | `{ plan }` (one-click demo) |

The full Zod schemas (`ScientificIntentSchema`, `NoveltyResultSchema`, `ExperimentPlanSchema`, `FeedbackEntrySchema`) live in `src/lib/schemas.ts` and are the single source of truth.

---

## 7 · Frontend UX

- **Hero + 4-step pipeline visualizer** (Input → Intent → Literature QC → Plan).
- **Hypothesis input** with 4 sample hypotheses (Diagnostics / Gut Health / Cell Biology / Climate) one click away.
- **Tabbed plan viewer** with Summary, Protocol, Materials, Budget, Timeline, Validation, Personnel, Risks, *Why this plan*.
- **Inline edit** mode on protocol steps and materials quantities — saved with a version bump.
- **Per-section feedback panel** at the bottom of the plan with rating + structured correction text, persisted to the store.
- **Regenerate from feedback** button replays the LLM with the new corrections folded in.
- Dark-first, Vercel/Linear-style design. Inter font. Subtle grid hero. Pills, soft shadows, accent glow.

---

## 8 · Key code snippets

### Schema-locked plan generation (the heart of the quality bar)

```127:170:src/lib/prompts.ts
export const PLAN_SYSTEM = `You are an operations-grade research scientist designing executable experiment plans for a real wet lab. The plan must be specific enough that a CRO could order materials on Monday and start running by Friday.

Hard rules:
1. NEVER write vague steps ("perform analysis", "measure outcome"). Every step must be concrete: reagents, concentrations, durations, instruments, plate formats.
2. EVERY material must have a real supplier and a plausible catalog number from {Sigma-Aldrich, Thermo Fisher, NEB, Promega, Qiagen, IDT, Bio-Rad, ATCC, Addgene, DSMZ, Jackson Laboratory, Abcam, Cytiva, Eppendorf, Metrohm DropSens, BASi}. Prefer the supplier catalog provided in context.
3. Budget MUST be itemized in USD. Sum of "lines" (including contingency) MUST equal "total_usd". Include personnel cost (loaded $2,500/wk for a research associate, $4,200/wk for a Ph.D.).
...
```

### SSE streaming + Zod validation

```91:138:src/app/api/plan/route.ts
const completion = await llm.chat.completions.create({
  model: MODEL,
  temperature: 0.25,
  response_format: { type: "json_object" },
  stream: true,
  messages: [
    { role: "system", content: PLAN_SYSTEM },
    { role: "user", content: userPrompt },
  ],
});

let buf = "";
for await (const chunk of completion) {
  const delta = chunk.choices?.[0]?.delta?.content ?? "";
  if (delta) {
    buf += delta;
    send("chunk", { delta, total_len: buf.length });
  }
}

send("status", { stage: "validating" });
const parsed = safeJsonParse<unknown>(buf);
const validated = ExperimentPlanSchema.safeParse(parsed);
```

### Feedback retrieval used as few-shot priors

```50:74:src/lib/store.ts
export async function relevantFeedback(
  domain: string,
  keywords: string[],
  max = 4
): Promise<FeedbackEntry[]> {
  const s = await readStore();
  const lowKeys = keywords.map((k) => k.toLowerCase());
  const scored = s.feedback.map((f) => {
    let score = 0;
    if (f.domain === domain) score += 3;
    const blob = (f.hypothesis + " " + f.original + " " + f.correction).toLowerCase();
    for (const k of lowKeys) if (blob.includes(k)) score += 1;
    return { f, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.f);
}
```

---

## 9 · Demo script (90 seconds)

> *Below is the script we use for the live judge demo. Bullets in italics are notes for the operator.*

1. **Open the app.** Click **Load demo plan** in the header. *Shows the UI is interactive even without keys; gives judges an immediate visual anchor.*
2. **Tell the story.** *"Compressing the gap between hypothesis and runnable plan is one of the highest-leverage things we can do for science. Here's what that looks like in practice."*
3. **Clear, paste a real hypothesis** — click the **Cell Biology** sample or paste:
   > *"Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol."*
4. **Click Generate plan.** Walk through the live pipeline: *Structuring intent* → *Literature QC* → streaming plan tokens (note the char counter ticking).
5. **Show the literature QC card** — reads *similar_work_exists*, links to two real papers (Crowe 1992, Eroglu 2000 in the demo seed; live retrieval otherwise).
6. **Land on the plan.** Hit the metric strip (budget · timeline · materials · validation), click through **Protocol**, scroll **Materials** to show **real Sigma / Thermo / ATCC catalog numbers**, click **Budget** to show the itemized lines and contingency.
7. **Open the Scientist review panel.** Pick *materials*, type:
   > *"Use Roche cOmplete protease inhibitor instead of generic — better recovery in our hands. Add MycoAlert to QC, even at p+1 we've had hits. n should be 4 vials/arm not 3 for 80% power at 15 pp."*
   Rate 4★. Submit.
8. **Click Regenerate from feedback.** Watch the next plan stream in. Show that *Why this plan* mentions the change, the materials table now includes MycoAlert, and the validation block updates the sample size.
9. **Close with the platform line:** *"Every review trains the next plan. This is the difference between a tool and a platform — and it's why we'd ship this."*

---

## 10 · Strategic use of provided credits

Per the brief, our credits are **Cursor / Lovable / Tavily / Vercel**. Here's how we use each:

| Credit | What we use it for | Why |
|---|---|---|
| **Cursor** | Engineering velocity — full app authored end-to-end inside Cursor; LLM gateway via Cursor's OpenAI-compatible proxy is supported by setting `LLM_BASE_URL` to the Cursor endpoint. | Highest-leverage spend. Every minute saved on boilerplate is a minute spent on the prompt + dataset + UX, which is what wins this category. |
| **Tavily** | The **literature QC** retrieval (locked to protocols.io / bioRxiv / Nature / etc.) and supplier verification helper. | Tavily is fast (sub-second) and lets us scope domains, which keeps the QC tight and judge-friendly. |
| **Lovable** | Optional landing page + marketing site (`/about`, hero copy, screenshots). The **product** is in this repo; Lovable is for the storytelling layer if we want a polished public URL by demo day. | Don't burn product time on a marketing page — generate it. |
| **Vercel** | One-click prod deploy of this Next.js app. Streaming SSE works on Vercel's Node runtime out of the box. Also: **Vercel KV** to swap in for the JSON store with a 5-line change in `src/lib/store.ts` so the feedback loop survives between deploys. | Production hosting + persistence with zero infra. |

---

## 11 · Setup

```bash
git clone <repo>
cd ai-scientist
npm install
cp .env.example .env.local
# fill in:
#   LLM_API_KEY      — any OpenAI-compatible key (OpenAI / OpenRouter / Together / Cursor proxy)
#   LLM_BASE_URL     — defaults to https://api.openai.com/v1
#   LLM_MODEL        — defaults to gpt-4o-mini (any compatible chat model with response_format=json works)
#   TAVILY_API_KEY   — from https://tavily.com (free tier is enough for the demo)
npm run dev
# open http://localhost:3000
```

To deploy to Vercel:

```bash
npx vercel --prod
# in the Vercel dashboard, set the same env vars as .env.local
# (all routes are Node-runtime; no extra config needed for SSE)
```

---

## 12 · Where you (the human) need to step in

These are the **manual interventions** you should plan for. Everything else is automated by the agent.

1. **API keys.** Drop `LLM_API_KEY` and `TAVILY_API_KEY` into `.env.local` (or Vercel env vars, or Cursor Cloud Agent secrets at *Settings → Secrets*). Without keys, the *Load demo plan* button still works for UI walkthroughs.
2. **Pick the LLM model.** `gpt-4o-mini` is the default for cost + speed. For demo day, switch `LLM_MODEL` to `gpt-4o` or `gpt-4.1` for higher-quality plans on novel hypotheses. Cursor's proxy / OpenRouter / Together work as drop-in replacements via `LLM_BASE_URL`.
3. **Curate more suppliers** if you're targeting a specific domain. Add rows to `SUPPLIER_CATALOG` in `src/data/suppliers.ts` — keywords are how the prompt picks them up.
4. **Swap the store for production.** Replace the four functions in `src/lib/store.ts` with Vercel KV / Supabase / Postgres calls. Schema is already locked.
5. **(Optional) Deploy on Vercel** before demo day so judges get a public URL. `npx vercel --prod` after setting env vars.
6. **(Optional) Lovable landing page.** Generate `/about` or a separate marketing site; link it from the hero.
7. **Demo rehearsal.** Run through the 90-second script once end-to-end with real keys to make sure your LLM gateway is configured before going live.

---

## 13 · What we'd ship next (post-hackathon)

- **pgvector retrieval over feedback.** Replace keyword-overlap scoring in `relevantFeedback` with embedding similarity. Same interface, better recall.
- **Reagent verification pass.** A second cheap LLM call that re-checks each catalog number against `tavilySupplierSearch` and flags anything that doesn't match a live product page.
- **IRB / IACUC pre-flight checklist** auto-generated from `ethics_flags`.
- **Plan diffing.** Show the visual diff between plan v1 and v2 after a regenerate, so reviewers see exactly which feedback got applied.
- **Lightweight fine-tune.** Once feedback volume passes ~200 entries, distill them into a LoRA on top of an open-weight model for a domain-specialized planner — the "platform" thesis.
- **Procurement export.** One-click PDF + CSV that drops straight into a CRO's procurement system.

---

## 14 · Credits

- Challenge: **Fulcrum Science × MIT Club of Northern California × MIT Club of Germany**.
- Sample hypotheses & sources: protocols.io, Bio-protocol, Nature Protocols, JOVE, OpenWetWare, Sigma-Aldrich, Thermo Fisher, ATCC, DSMZ, Jackson Laboratory.
