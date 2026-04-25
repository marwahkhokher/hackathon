import { StructuredHypothesis, LiteratureResult, ExperimentPlan } from '@/types';
import { getFeedbackByDomain } from './db';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

async function callLLM(messages: { role: string; content: string }[], temperature = 0.3): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature,
      max_tokens: 8000,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${errText}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function parseHypothesis(hypothesis: string): Promise<StructuredHypothesis> {
  const systemPrompt = `You are a senior research scientist who specializes in breaking down scientific hypotheses into structured components. You must return valid JSON only.`;

  const userPrompt = `Parse this scientific hypothesis into its structured components. Return ONLY valid JSON with these exact fields:

{
  "original_text": "the original hypothesis text",
  "domain": "the scientific domain (e.g., Diagnostics, Cell Biology, Neuroscience, Climate, Gut Health)",
  "independent_variable": "what is being manipulated",
  "dependent_variable": "what is being measured",
  "intervention": "the specific experimental intervention",
  "expected_outcome": "what result is expected with specific thresholds",
  "mechanism": "proposed mechanism of action",
  "control_condition": "what the control group/condition would be",
  "constraints": ["list of key constraints or requirements"],
  "measurement_method": "how the outcome will be measured"
}

Hypothesis: "${hypothesis}"`;

  const response = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function searchLiterature(hypothesis: StructuredHypothesis): Promise<LiteratureResult> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (tavilyApiKey) {
    return searchWithTavily(hypothesis, tavilyApiKey);
  }
  return searchWithLLM(hypothesis);
}

async function searchWithTavily(hypothesis: StructuredHypothesis, apiKey: string): Promise<LiteratureResult> {
  const searchQueries = [
    `${hypothesis.intervention} ${hypothesis.dependent_variable} experiment protocol`,
    `${hypothesis.domain} ${hypothesis.measurement_method} study results`,
  ];

  const allResults: { title: string; url: string; content: string }[] = [];

  for (const query of searchQueries) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'advanced',
          include_domains: ['pubmed.ncbi.nlm.nih.gov', 'scholar.google.com', 'arxiv.org', 'nature.com', 'science.org', 'protocols.io', 'bio-protocol.org'],
          max_results: 5,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          allResults.push(...data.results);
        }
      }
    } catch {
      // Continue with other queries
    }
  }

  const assessPrompt = `Based on these search results, assess the novelty of this hypothesis:

Hypothesis: "${hypothesis.original_text}"

Search results:
${allResults.map((r, i) => `${i + 1}. Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content?.substring(0, 300)}`).join('\n\n')}

Return ONLY valid JSON:
{
  "novelty_status": "Not Found" | "Similar Work Exists" | "Exact Match Found",
  "summary": "Brief explanation of novelty assessment",
  "references": [
    {
      "title": "paper/protocol title",
      "authors": "author names",
      "year": "publication year",
      "source": "journal/source name",
      "url": "link to paper",
      "relevance": "how this relates to the hypothesis"
    }
  ]
}

Include 1-3 most relevant references. If no results are relevant, set novelty_status to "Not Found" with empty references array.`;

  const response = await callLLM([
    { role: 'system', content: 'You are a scientific literature analyst. Return only valid JSON.' },
    { role: 'user', content: assessPrompt },
  ]);

  const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const result = JSON.parse(cleaned);
  return {
    ...result,
    search_queries_used: searchQueries,
  };
}

async function searchWithLLM(hypothesis: StructuredHypothesis): Promise<LiteratureResult> {
  const prompt = `You are a scientific literature expert. Assess the novelty of this hypothesis based on your knowledge of published research.

Hypothesis: "${hypothesis.original_text}"
Domain: ${hypothesis.domain}
Intervention: ${hypothesis.intervention}
Measurement: ${hypothesis.measurement_method}

Return ONLY valid JSON:
{
  "novelty_status": "Not Found" | "Similar Work Exists" | "Exact Match Found",
  "summary": "Brief explanation of your novelty assessment based on known literature",
  "references": [
    {
      "title": "paper/protocol title",
      "authors": "author names if known",
      "year": "approximate year",
      "source": "journal name",
      "url": "DOI or link if known, otherwise empty string",
      "relevance": "how this relates to the hypothesis"
    }
  ]
}

Be honest about your knowledge. Include 1-3 most relevant references you know about. Prefer real, verifiable references.`;

  const response = await callLLM([
    { role: 'system', content: 'You are a scientific literature analyst. Return only valid JSON.' },
    { role: 'user', content: prompt },
  ]);

  const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const result = JSON.parse(cleaned);
  return {
    ...result,
    search_queries_used: [`LLM knowledge-based search for: ${hypothesis.original_text.substring(0, 100)}`],
  };
}

function buildFeedbackContext(domain: string): string {
  try {
    const feedback = getFeedbackByDomain(domain, 5) as Array<{
      section: string;
      original_content: string;
      corrected_content: string;
      scientist_note: string;
      correction_type: string;
    }>;
    if (feedback.length === 0) return '';

    return `\n\nIMPORTANT: Previous scientist feedback for ${domain} experiments (incorporate these corrections):
${feedback.map((f, i) => `
Correction ${i + 1} (${f.section} - ${f.correction_type}):
- Original: ${f.original_content.substring(0, 200)}
- Corrected to: ${f.corrected_content.substring(0, 200)}
- Scientist note: ${f.scientist_note}
`).join('\n')}

Apply these corrections and insights when generating the plan. Do not repeat the same mistakes.`;
  } catch {
    return '';
  }
}

export async function generateExperimentPlan(
  hypothesis: StructuredHypothesis,
  literatureResult: LiteratureResult
): Promise<ReadableStream> {
  const feedbackContext = buildFeedbackContext(hypothesis.domain);

  const systemPrompt = `You are a senior principal investigator with 20+ years of experience designing and running experiments across biomedical sciences, chemistry, climate science, and diagnostics. You generate experiment plans so detailed and realistic that a lab could execute them directly.

Your plans must include:
1. REAL catalog numbers and suppliers (Thermo Fisher, Sigma-Aldrich, Bio-Rad, Promega, Qiagen, NEB, Corning, etc.)
2. REALISTIC pricing based on current market rates
3. SPECIFIC concentrations, volumes, temperatures, and incubation times
4. PROPER controls and statistical methods
5. Practical timeline with realistic durations

Known supplier catalogs:
- Thermo Fisher: Cat# prefixes like A, 10, 11, 12, 15, 16, 31, 44, 62, 78, 88, 90
- Sigma-Aldrich: Cat# prefixes like S, P, T, D, F, M, A, L
- Bio-Rad: Cat# prefixes like 161, 170, 500, 620, 1706
- Corning: Cat# prefixes like 354, 430, 431, 356
- Promega: Cat# prefixes like E, G, M, N, V`;

  const userPrompt = `Generate a COMPLETE, DETAILED experiment plan for this hypothesis.

STRUCTURED HYPOTHESIS:
- Domain: ${hypothesis.domain}
- Original: ${hypothesis.original_text}
- Independent Variable: ${hypothesis.independent_variable}
- Dependent Variable: ${hypothesis.dependent_variable}
- Intervention: ${hypothesis.intervention}
- Expected Outcome: ${hypothesis.expected_outcome}
- Mechanism: ${hypothesis.mechanism}
- Control: ${hypothesis.control_condition}
- Measurement: ${hypothesis.measurement_method}
- Constraints: ${hypothesis.constraints.join(', ')}

LITERATURE CONTEXT:
- Novelty: ${literatureResult.novelty_status}
- Summary: ${literatureResult.summary}
- Related work: ${literatureResult.references.map(r => `${r.title} (${r.year})`).join('; ')}
${feedbackContext}

Return ONLY valid JSON with this EXACT structure:

{
  "title": "Descriptive experiment title",
  "protocol": [
    {
      "step_number": 1,
      "title": "Step title",
      "description": "Detailed description with specific concentrations, volumes, temperatures, times",
      "duration": "e.g., 2 hours",
      "critical_notes": ["Important warnings or tips"],
      "equipment_needed": ["Specific equipment"]
    }
  ],
  "materials": [
    {
      "category": "Category name (e.g., Reagents, Consumables, Equipment)",
      "items": [
        {
          "name": "Item name",
          "catalog_number": "Real catalog number",
          "supplier": "Real supplier name",
          "quantity": "Amount needed",
          "unit_price": "$XX.XX",
          "total_price": "$XX.XX",
          "category": "reagent|consumable|equipment|biological|other"
        }
      ],
      "subtotal": "$X,XXX.XX"
    }
  ],
  "total_budget": "$X,XXX.XX",
  "timeline": [
    {
      "phase": "Phase name",
      "duration": "X weeks",
      "start_week": 1,
      "end_week": 3,
      "tasks": ["Specific tasks"],
      "dependencies": ["What must be completed first"],
      "milestones": ["Key deliverables"]
    }
  ],
  "total_duration": "X weeks",
  "validation": {
    "primary_endpoint": "Main measurement",
    "secondary_endpoints": ["Additional measurements"],
    "statistical_method": "Specific test (e.g., two-tailed t-test, ANOVA)",
    "sample_size_justification": "Power analysis or practical justification",
    "success_criteria": "Specific threshold for success",
    "failure_criteria": "When to conclude the hypothesis is not supported",
    "controls": ["Specific control conditions"]
  },
  "assumptions": ["Key assumptions made"],
  "risks": ["Potential risks and mitigations"],
  "references_used": ["Protocols or papers this plan is based on"],
  "generation_rationale": "2-3 sentences explaining why this specific approach was chosen over alternatives"
}

Be EXTREMELY specific. No vague steps. Include real catalog numbers, realistic prices, specific concentrations and volumes.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8000,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${errText}`);
  }

  return res.body as ReadableStream;
}

export async function generatePlanNonStreaming(
  hypothesis: StructuredHypothesis,
  literatureResult: LiteratureResult
): Promise<ExperimentPlan> {
  const feedbackContext = buildFeedbackContext(hypothesis.domain);

  const systemPrompt = `You are a senior principal investigator with 20+ years of experience designing and running experiments. Generate extremely detailed, realistic experiment plans with real supplier catalog numbers and pricing.`;

  const userPrompt = `Generate a COMPLETE experiment plan for:

HYPOTHESIS: ${hypothesis.original_text}
DOMAIN: ${hypothesis.domain}
INTERVENTION: ${hypothesis.intervention}
MEASUREMENT: ${hypothesis.measurement_method}
EXPECTED OUTCOME: ${hypothesis.expected_outcome}
CONTROL: ${hypothesis.control_condition}

LITERATURE: ${literatureResult.novelty_status} - ${literatureResult.summary}
${feedbackContext}

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "protocol": [{"step_number": 1, "title": "string", "description": "string with specific details", "duration": "string", "critical_notes": ["string"], "equipment_needed": ["string"]}],
  "materials": [{"category": "string", "items": [{"name": "string", "catalog_number": "string", "supplier": "string", "quantity": "string", "unit_price": "string", "total_price": "string", "category": "reagent|consumable|equipment|biological|other"}], "subtotal": "string"}],
  "total_budget": "string",
  "timeline": [{"phase": "string", "duration": "string", "start_week": 1, "end_week": 2, "tasks": ["string"], "dependencies": ["string"], "milestones": ["string"]}],
  "total_duration": "string",
  "validation": {"primary_endpoint": "string", "secondary_endpoints": ["string"], "statistical_method": "string", "sample_size_justification": "string", "success_criteria": "string", "failure_criteria": "string", "controls": ["string"]},
  "assumptions": ["string"],
  "risks": ["string"],
  "references_used": ["string"],
  "generation_rationale": "string"
}

Use REAL catalog numbers, realistic pricing, specific concentrations/volumes/temperatures.`;

  const response = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 0.3);

  const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const plan = JSON.parse(cleaned);
  return {
    ...plan,
    hypothesis,
    literature_check: literatureResult,
  };
}
