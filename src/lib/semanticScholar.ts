import type { Reference } from "./schemas";

// ===========================================================
// Semantic Scholar Graph API
// Free + public; an API key raises rate limits.
// https://api.semanticscholar.org/graph/v1
// ===========================================================

const S2_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY ?? "";
const S2_BASE = "https://api.semanticscholar.org/graph/v1";

interface S2Paper {
  paperId: string;
  title?: string;
  abstract?: string;
  year?: number;
  venue?: string;
  authors?: { name?: string }[];
  externalIds?: { DOI?: string; ArXiv?: string };
  url?: string;
  openAccessPdf?: { url?: string };
  tldr?: { text?: string };
}

interface S2SearchResponse {
  data: S2Paper[];
  total: number;
}

export async function s2Search(query: string, limit = 5): Promise<Reference[]> {
  const url = new URL(`${S2_BASE}/paper/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set(
    "fields",
    "title,abstract,year,venue,authors,externalIds,url,openAccessPdf,tldr"
  );
  try {
    const r = await fetch(url.toString(), {
      headers: S2_KEY ? { "x-api-key": S2_KEY } : undefined,
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return [];
    const j = (await r.json()) as S2SearchResponse;
    return (j.data ?? []).map<Reference>((p) => ({
      title: p.title ?? "(untitled)",
      authors: (p.authors ?? []).map((a) => a.name ?? "").filter(Boolean),
      year: p.year,
      venue: p.venue,
      url: p.openAccessPdf?.url || p.url,
      doi: p.externalIds?.DOI,
      relevance: (p.tldr?.text || p.abstract || "").slice(0, 320),
      source: "semantic_scholar",
    }));
  } catch (e) {
    console.error("Semantic Scholar search failed:", e);
    return [];
  }
}
