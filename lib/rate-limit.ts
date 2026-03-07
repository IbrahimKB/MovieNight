type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("true-client-ip") ||
    "unknown"
  );
}

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const bucket = buckets.get(params.key);

  if (!bucket || now > bucket.resetAt) {
    const next: Bucket = {
      count: 1,
      resetAt: now + params.windowMs,
    };
    buckets.set(params.key, next);
    return { allowed: true, remaining: params.limit - 1, resetAt: next.resetAt };
  }

  if (bucket.count >= params.limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  buckets.set(params.key, bucket);
  return {
    allowed: true,
    remaining: Math.max(0, params.limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

