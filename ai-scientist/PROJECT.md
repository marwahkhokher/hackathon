# AI Scientist — From Hypothesis to Runnable Experiment Plan

> An AI-powered platform that transforms a natural language scientific hypothesis into a complete, operationally realistic experiment plan that a real lab could pick up and execute.

**Built for:** Hack-Nation × World Bank Youth Summit · Global AI Hackathon 2026  
**Challenge:** The AI Scientist by Fulcrum Science

---

## The Problem

Science is not just limited by ideas — it's limited by operations. Turning a scientific question into a runnable experiment takes weeks of manual work:
- Designing the protocol
- Estimating costs and sourcing materials
- Planning timelines and staffing

A senior scientist who's run a similar experiment before can scope this in hours. One who hasn't may take days — and the quality difference is real. A plan with the wrong chemical concentration or an unrealistic timeline can send a lab down the wrong path for weeks.

## The Solution

**AI Scientist** compresses this process from days to seconds. Enter a hypothesis, and get back a complete experiment plan with:

- **Step-by-step protocol** grounded in real scientific practices
- **Materials list** with specific items, real supplier catalog numbers, and quantities
- **Budget estimation** with realistic cost breakdown by category
- **Timeline** with phases, dependencies, and milestones
- **Validation strategy** with statistical methods and success/failure criteria
- **Literature quality check** to assess novelty before generating the plan

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌────────┐ │
│  │ Hypothesis│→│ Literature QC │→│Plan Display│→│Feedback │ │
│  │  Input    │  │   Display    │  │  (Tabbed)  │  │ Panel  │ │
│  └──────────┘  └──────────────┘  └───────────┘  └────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ API Calls
┌──────────────────────┴──────────────────────────────────────┐
│                    API Layer (Next.js Routes)                │
│  ┌────────────┐ ┌───────────┐ ┌──────┐ ┌────────────────┐  │
│  │/api/       │ │/api/      │ │/api/ │ │/api/           │  │
│  │hypothesis  │ │literature │ │plan  │ │feedback        │  │
│  │(Parse)     │ │(Search)   │ │(Gen) │ │(Learn)         │  │
│  └─────┬──────┘ └─────┬─────┘ └──┬───┘ └───────┬────────┘  │
│        │              │          │              │            │
│  ┌─────┴──────────────┴──────────┴──────────────┴────────┐  │
│  │              AI Pipeline (ai-pipeline.ts)              │  │
│  │  • Hypothesis Parser (GPT-4o)                         │  │
│  │  • Literature Search (Tavily API + LLM fallback)      │  │
│  │  • Plan Generator (GPT-4o, streaming)                 │  │
│  │  • Feedback Integrator (few-shot learning)            │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │            SQLite Database (better-sqlite3)            │  │
│  │  • experiments (plans, hypotheses, status)            │  │
│  │  • feedback (corrections, tagged by domain)           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Pipeline Flow

### 1. Input Layer
The user enters a natural language scientific hypothesis. The system accepts free-form text and converts it into a structured representation:

| Field | Description |
|-------|-------------|
| Domain | Scientific domain (Diagnostics, Cell Biology, etc.) |
| Independent Variable | What is being manipulated |
| Dependent Variable | What is being measured |
| Intervention | The specific experimental intervention |
| Expected Outcome | What result is expected (with thresholds) |
| Mechanism | Proposed mechanism of action |
| Control Condition | The control group/condition |
| Constraints | Key constraints or requirements |
| Measurement Method | How the outcome will be measured |

### 2. Literature Quality Check
Before generating the plan, the system performs a fast novelty check:

- **Tavily API** (if configured): Real-time search across PubMed, arXiv, Nature, protocols.io, bio-protocol.org
- **LLM Fallback**: Knowledge-based assessment when Tavily is not available

Output:
- **Novelty Status**: `Not Found` | `Similar Work Exists` | `Exact Match Found`
- **1–3 Relevant References** with titles, authors, year, source, and relevance explanation

### 3. Experiment Plan Generation (Core Value)
The main deliverable — a complete, operationally realistic experiment plan:

- **Protocol**: Step-by-step methodology with specific concentrations, volumes, temperatures, and incubation times
- **Materials**: Catalog numbers from real suppliers (Thermo Fisher, Sigma-Aldrich, Bio-Rad, Corning, etc.)
- **Budget**: Line-item cost breakdown with realistic pricing
- **Timeline**: Gantt-style phased breakdown with dependencies and milestones
- **Validation**: Statistical methods, sample size justification, success/failure criteria, controls

### 4. Feedback Loop (Learning System)
Scientists can correct any section of the generated plan. These corrections are:
- Stored in structured format, tagged by domain and correction type
- Automatically incorporated as few-shot examples when generating future plans for similar experiment types
- The system visibly improves over time — each correction makes the next plan better

---

## Dataset & Knowledge Base

The system uses a curated knowledge base rather than a single static dataset:

### Supplier Database
15+ real lab suppliers with catalog number patterns:
- **Thermo Fisher Scientific** — molecular biology, cell culture, antibodies
- **Sigma-Aldrich (Merck)** — chemicals, reagents, solvents
- **Bio-Rad** — electrophoresis, western blot, qPCR
- **Promega** — molecular biology, cell-based assays
- **Qiagen** — nucleic acid purification, PCR, NGS
- **New England Biolabs** — restriction enzymes, cloning
- **Abcam** — antibodies, proteins, assay kits
- **IDT** — primers, oligos, gene synthesis
- **ATCC** — cell lines, microorganisms
- **Addgene** — plasmids, viral vectors, CRISPR tools
- **Corning, Eppendorf, VWR, Takara Bio** — labware, consumables

### Protocol Repositories Referenced
- protocols.io, Bio-protocol, Nature Protocols, JoVE, OpenWetWare

### Sample Hypotheses (from Challenge Brief)
5 validated sample inputs spanning Diagnostics, Gut Health, Cell Biology, Climate/Biotech, and Neuroscience.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript | UI framework |
| Styling | Tailwind CSS v4, Lucide Icons | Design system |
| AI | OpenAI GPT-4o | Hypothesis parsing, plan generation |
| Search | Tavily API | Real-time literature search |
| Database | SQLite (better-sqlite3) | Experiments & feedback storage |
| Streaming | Server-Sent Events (SSE) | Real-time plan generation output |

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (required)
- Tavily API key (optional, for real-time literature search)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ai-scientist

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your API keys

# Start development server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4o |
| `TAVILY_API_KEY` | No | Tavily API key for literature search |

### Manual Steps Required

1. **Add your OpenAI API key** to `.env.local` — this is required for the system to function
2. **Add your Tavily API key** (optional) — enhances literature search with real-time web results
3. **Run `npm run dev`** to start the development server
4. **Visit `http://localhost:3000`** to use the application

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hypothesis` | POST | Parse natural language hypothesis into structured form |
| `/api/literature` | POST | Search literature for novelty assessment |
| `/api/plan` | POST | Generate complete experiment plan (supports streaming) |
| `/api/feedback` | POST | Submit scientist corrections |
| `/api/feedback` | GET | Retrieve feedback for an experiment |
| `/api/experiments` | GET | List or retrieve experiment records |

---

## Database Schema

### `experiments` table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | UUID |
| hypothesis | TEXT | Original hypothesis text |
| structured_hypothesis | TEXT (JSON) | Parsed hypothesis |
| literature_result | TEXT (JSON) | Literature check results |
| plan | TEXT (JSON) | Generated experiment plan |
| domain | TEXT | Scientific domain |
| status | TEXT | pending / generating / complete |
| created_at | TEXT | Timestamp |
| updated_at | TEXT | Timestamp |

### `feedback` table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | UUID |
| experiment_id | TEXT (FK) | Links to experiments |
| section | TEXT | protocol / materials / budget / timeline / validation / overall |
| original_content | TEXT | What was wrong |
| corrected_content | TEXT | What it should be |
| correction_type | TEXT | factual_error / missing_detail / cost_adjustment / etc. |
| scientist_note | TEXT | Context for the correction |
| domain | TEXT | For domain-specific learning |
| created_at | TEXT | Timestamp |

---

## Demo Script

### The Story
*"Imagine you're a researcher at a university. You have a hypothesis about improving cryopreservation — but you've never designed a cryobiology experiment before. Normally, you'd spend days reading papers, sourcing materials, and building a protocol. With AI Scientist, you go from question to executable plan in 30 seconds."*

### Step-by-Step Demo

1. **Enter a Hypothesis**
   > "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol."

2. **Watch Structured Parsing**
   - System extracts: domain, variables, intervention, measurement method, expected outcome

3. **Literature Quality Check**
   - Shows novelty status (e.g., "Similar Work Exists")
   - Displays 2-3 relevant references

4. **Plan Generation (Streaming)**
   - Watch the plan generate in real-time
   - Navigate through Protocol (with expandable steps), Materials (with catalog numbers and pricing), Timeline (Gantt visualization), and Validation strategy

5. **Expert Feedback**
   - A "scientist" corrects a reagent: "DMSO concentration should be 5%, not 10%"
   - Submit feedback

6. **Regenerate**
   - Click "Regenerate" — the new plan incorporates the correction
   - Show the improvement side-by-side

### Wow Moment
*"This plan has real catalog numbers from Sigma-Aldrich and Thermo Fisher. It has a £3,200 budget with line items. It has a 6-week timeline with milestones. A lab could order these materials on Monday and start running this experiment by Friday."*

---

## Key Differentiators

### 1. Operational Realism
Plans include real supplier catalog numbers, realistic pricing, specific concentrations and volumes — not generic hand-waving.

### 2. Streaming UX
Plan generation streams in real-time via Server-Sent Events, providing a responsive experience even for complex plans.

### 3. Learning System
Every scientist correction becomes a training signal. The system improves with use — corrections from past reviews are automatically incorporated as few-shot examples in future plan generation.

### 4. Complete Pipeline
Not just plan generation — the full journey from hypothesis parsing to novelty detection to plan generation to feedback collection.

### 5. Export & Interoperability
Plans are structured as JSON and can be exported for integration with lab management systems, LIMS, or procurement workflows.

---

## Suggested Improvements for Winning

1. **Multi-modal Input**: Accept images of lab notebooks, PDFs of grant proposals
2. **Cost Comparison**: Show pricing from multiple suppliers
3. **Regulatory Awareness**: Flag when experiments need IRB/IACUC approval
4. **Collaboration**: Share plans with team members, real-time co-editing
5. **Version History**: Track how plans evolve through feedback cycles
6. **Integration**: Connect with protocols.io to publish generated protocols
7. **Fine-tuning**: Use accumulated feedback to fine-tune a domain-specific model

---

## Project Structure

```
ai-scientist/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── hypothesis/route.ts    # Hypothesis parsing endpoint
│   │   │   ├── literature/route.ts    # Literature search endpoint
│   │   │   ├── plan/route.ts          # Plan generation (streaming)
│   │   │   ├── feedback/route.ts      # Feedback CRUD
│   │   │   └── experiments/route.ts   # Experiment records
│   │   ├── layout.tsx                 # App layout with dark theme
│   │   ├── page.tsx                   # Main application page
│   │   └── globals.css                # Global styles and animations
│   ├── components/
│   │   ├── Header.tsx                 # Navigation header
│   │   ├── PipelineProgress.tsx       # Stage indicator
│   │   ├── HypothesisInput.tsx        # Input form with examples
│   │   ├── StructuredHypothesisDisplay.tsx  # Parsed hypothesis
│   │   ├── LiteratureDisplay.tsx      # Novelty check results
│   │   ├── PlanDisplay.tsx            # Full plan with tabs
│   │   └── FeedbackPanel.tsx          # Scientist feedback form
│   ├── lib/
│   │   ├── ai-pipeline.ts            # Core AI pipeline
│   │   └── db.ts                      # SQLite database layer
│   ├── data/
│   │   └── suppliers.ts              # Supplier & protocol databases
│   └── types/
│       └── index.ts                   # TypeScript type definitions
├── .env.example                       # Environment variable template
├── next.config.ts                     # Next.js configuration
├── package.json                       # Dependencies
├── PROJECT.md                         # This file
└── README.md                          # Quick start guide
```

---

## License

Built for the Hack-Nation × World Bank Youth Summit Global AI Hackathon 2026.

Contact: arun@fulcrum.science / jonas@fulcrum.science
