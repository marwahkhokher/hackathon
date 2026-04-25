import { NextResponse } from "next/server";
import { getPlan, listPlans } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const p = await getPlan(id);
    if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ plan: p });
  }
  return NextResponse.json({ plans: await listPlans() });
}
