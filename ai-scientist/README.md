# AI Scientist

> Transform scientific hypotheses into complete, executable experiment plans in seconds.

An AI-powered platform that takes a natural language scientific hypothesis and generates a complete experiment plan with protocol, materials (real catalog numbers), budget, timeline, and validation strategy — so realistic a lab could execute it directly.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local (required)
# Optionally add TAVILY_API_KEY for real-time literature search
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a hypothesis.

## What It Does

1. **Parses** your hypothesis into structured scientific components
2. **Checks** existing literature for novelty (via Tavily or LLM)
3. **Generates** a complete experiment plan with streaming output
4. **Learns** from scientist feedback to improve future plans

## Key Features

- Real supplier catalog numbers (Thermo Fisher, Sigma-Aldrich, Bio-Rad, etc.)
- Realistic budget estimates with line-item breakdown
- Gantt-style timeline visualization
- Statistical validation strategy with sample size justification
- Scientist feedback loop for continuous improvement
- JSON export for integration with lab systems

## Requirements

- Node.js 18+
- OpenAI API key (required)
- Tavily API key (optional)

See [PROJECT.md](./PROJECT.md) for full architecture documentation, database schema, API reference, and demo script.
