import { unstable_cache } from "next/cache";

/**
 * Cache wrapper that uses Next.js unstable_cache
 *
 * @param fn The function to cache (must be async)
 * @param keyParts Array of strings to generate the cache key
 * @param options Cache options (revalidate in seconds, tags)
 */
export function cacheFunction<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  options: { revalidate?: number; tags?: string[] } = {}
) {
  return unstable_cache(
    async (...args: Args) => {
      return await fn(...args);
    },
    keyParts,
    {
      revalidate: options.revalidate ?? 60 * 60, // Default 1 hour
      tags: options.tags,
    }
  );
}

// Common cache durations (in seconds)
export const CACHE_TTL = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
};
