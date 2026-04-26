import fs from "node:fs/promises";
import path from "node:path";
import type { FeedbackEntry, StoredPlan } from "./schemas";

// ===========================================================
// Local JSON-backed store. Swap for Vercel KV / Postgres in
// production by re-implementing the four exported functions.
// ===========================================================

const STORE_PATH =
  process.env.FEEDBACK_STORE_PATH ?? path.join(process.cwd(), "data", "feedback.local.json");

interface StoreShape {
  plans: StoredPlan[];
  feedback: FeedbackEntry[];
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const j = JSON.parse(raw) as StoreShape;
    return { plans: j.plans ?? [], feedback: j.feedback ?? [] };
  } catch {
    return { plans: [], feedback: [] };
  }
}

async function writeStore(s: StoreShape): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(s, null, 2), "utf8");
}

export async function savePlan(plan: StoredPlan): Promise<void> {
  const s = await readStore();
  const idx = s.plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) s.plans[idx] = { ...plan, updated_at: new Date().toISOString() };
  else s.plans.push(plan);
  await writeStore(s);
}

export async function getPlan(id: string): Promise<StoredPlan | undefined> {
  const s = await readStore();
  return s.plans.find((p) => p.id === id);
}

export async function listPlans(): Promise<StoredPlan[]> {
  const s = await readStore();
  return [...s.plans].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function addFeedback(f: FeedbackEntry): Promise<void> {
  const s = await readStore();
  s.feedback.push(f);
  await writeStore(s);
}

export async function listFeedback(): Promise<FeedbackEntry[]> {
  const s = await readStore();
  return s.feedback;
}

/** Retrieve up to N feedback entries relevant to a domain/keywords. */
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
