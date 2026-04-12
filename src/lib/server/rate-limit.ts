import { NextRequest } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(options.key);

  if (!current || now >= current.resetAt) {
    buckets.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  current.count += 1;

  const allowed = current.count <= options.limit;
  const remaining = Math.max(0, options.limit - current.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

  return {
    allowed,
    remaining,
    retryAfterSeconds,
  };
}
