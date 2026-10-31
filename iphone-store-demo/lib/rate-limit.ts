import { NextRequest, NextResponse } from "next/server";

// Simple in-memory sliding-window rate limiter.
//
// Notes:
// - State lives inside the current Node.js process. Under `next dev`
//   (or a single `next start` instance) that is exactly what tests need.
// - On serverless/multi-instance deployments each instance keeps its own
//   bucket, so this is intentionally a "good enough" limiter for learning,
//   not a production-grade distributed limiter.
// - Set RATE_LIMIT_MAX=0 to disable the limiter (useful for broad E2E runs).

type BucketEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Map<string, BucketEntry>>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function pruneStore(store: Map<string, BucketEntry>, now: number) {
  if (store.size < 1000) return;
  for (const [ip, entry] of store) {
    if (entry.resetAt <= now) store.delete(ip);
  }
}

/**
 * Returns a 429 NextResponse when the caller exceeded the limit,
 * or null when the request is allowed.
 */
export function checkRateLimit(
  request: NextRequest,
  bucketName: string,
): NextResponse | null {
  const max = Number(process.env.RATE_LIMIT_MAX ?? 10);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);

  if (!Number.isFinite(max) || !Number.isFinite(windowMs) || max <= 0 || windowMs <= 0) {
    return null;
  }

  const now = Date.now();
  const ip = getClientIp(request);

  let store = buckets.get(bucketName);
  if (!store) {
    store = new Map<string, BucketEntry>();
    buckets.set(bucketName, store);
  }

  pruneStore(store, now);

  const entry = store.get(ip);
  if (!entry || entry.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;

  if (entry.count > max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}
