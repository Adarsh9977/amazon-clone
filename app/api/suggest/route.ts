import { NextResponse, type NextRequest } from "next/server";
import { suggest } from "@/lib/search";

// Best-effort in-memory token bucket: 10 req/s per IP (spec §7). Per serverless instance only.
const buckets = new Map<string, { tokens: number; at: number }>();
const RATE = 10;

function allow(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: RATE, at: now };
  b.tokens = Math.min(RATE, b.tokens + ((now - b.at) / 1000) * RATE);
  b.at = now;
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(ip)) return NextResponse.json({ items: [] }, { status: 429 });
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ items: [] });
  const items = await suggest(q);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, max-age=60" } });
}
