import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate-Limiting über Upstash Redis. Ist Upstash nicht konfiguriert (lokale
 * Entwicklung), greift ein In-Memory-Fallback — der schützt nur einen einzelnen
 * Prozess und ist ausdrücklich nicht für Produktion gedacht.
 */
const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const redis = hasUpstash ? Redis.fromEnv() : null;

function createLimiter(tokens: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: false,
    prefix: "financedash",
  });
}

const limiters = {
  login: createLimiter(5, "5 m"),
  register: createLimiter(3, "15 m"),
  passwordReset: createLimiter(3, "15 m"),
  import: createLimiter(10, "10 m"),
  ai: createLimiter(30, "1 m"),
  export: createLimiter(3, "1 h"),
} as const;

export type LimiterKey = keyof typeof limiters;

const memoryWindows: Record<string, { count: number; resetAt: number }> = {};
const MEMORY_FALLBACK_CONFIG: Record<LimiterKey, { tokens: number; windowMs: number }> = {
  login: { tokens: 5, windowMs: 5 * 60_000 },
  register: { tokens: 3, windowMs: 15 * 60_000 },
  passwordReset: { tokens: 3, windowMs: 15 * 60_000 },
  import: { tokens: 10, windowMs: 10 * 60_000 },
  ai: { tokens: 30, windowMs: 60_000 },
  export: { tokens: 3, windowMs: 60 * 60_000 },
};

export type RateLimitResult = { success: boolean; retryAfterSeconds: number };

export async function checkRateLimit(
  key: LimiterKey,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = limiters[key];

  if (limiter) {
    const result = await limiter.limit(`${key}:${identifier}`);
    return {
      success: result.success,
      retryAfterSeconds: Math.max(
        0,
        Math.ceil((result.reset - Date.now()) / 1000),
      ),
    };
  }

  const config = MEMORY_FALLBACK_CONFIG[key];
  const bucketKey = `${key}:${identifier}`;
  const now = Date.now();
  const bucket = memoryWindows[bucketKey];

  if (!bucket || bucket.resetAt <= now) {
    memoryWindows[bucketKey] = { count: 1, resetAt: now + config.windowMs };
    return { success: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > config.tokens) {
    return {
      success: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { success: true, retryAfterSeconds: 0 };
}
