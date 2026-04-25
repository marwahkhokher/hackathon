import type { Reference } from "./schemas";

// ===========================================================
// Tavily — fast web/literature retrieval
// https://docs.tavily.com
// ===========================================================

const TAVILY_KEY = process.env.TAVILY_API_KEY ?? "";

export function tavilyConfigured(): boolean {
  return Boolean(TAVILY_KEY);
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

export async function tavilySearch(
  query: string,
  opts: {
    max_results?: number;
    topic?: "general" | "news";
    include_domains?: string[];
    search_depth?: "basic" | "advanced";
  } = {}
): Promise<TavilyResult[]> {
  if (!TAVILY_KEY) return [];
  const body = {
    api_key: TAVILY_KEY,
    query,
    max_results: opts.max_results ?? 6,
    topic: opts.topic ?? "general",
    search_depth: opts.search_depth ?? "basic",
    include_answer: false,
    include_raw_content: false,
    include_domains: opts.include_domains,
  };
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Tavily can be slow on advanced; bound it.
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Tavily ${r.status}: ${text.slice(0, 200)}`);
  }
  const j = (await r.json()) as TavilyResponse;
  return j.results ?? [];
}

/** Targeted literature search across protocol repositories + arXiv + journals. */
export async function tavilyLiteratureSearch(query: string): Promise<Reference[]> {
  if (!TAVILY_KEY) return [];
  try {
    const results = await tavilySearch(query, {
      max_results: 6,
      search_depth: "basic",
      include_domains: [
        "arxiv.org",
        "biorxiv.org",
        "medrxiv.org",
        "pubmed.ncbi.nlm.nih.gov",
        "nature.com",
        "science.org",
        "cell.com",
        "protocols.io",
        "bio-protocol.org",
        "jove.com",
        "openwetware.org",
        "semanticscholar.org",
      ],
    });
    return results.map<Reference>((r) => ({
      title: r.title,
      url: r.url,
      authors: [],
      year: r.published_date ? Number(r.published_date.slice(0, 4)) || undefined : undefined,
      relevance: r.content.slice(0, 280),
      similarity: r.score,
      source: "tavily",
    }));
  } catch (e) {
    console.error("Tavily literature search failed:", e);
    return [];
  }
}

/** Materials & supplier search — used to find catalog numbers. */
export async function tavilySupplierSearch(query: string): Promise<TavilyResult[]> {
  return tavilySearch(query, {
    max_results: 4,
    search_depth: "basic",
    include_domains: [
      "thermofisher.com",
      "sigmaaldrich.com",
      "promega.com",
      "qiagen.com",
      "idtdna.com",
      "neb.com",
      "bio-rad.com",
      "addgene.org",
      "atcc.org",
    ],
  });
}
