/**
 * Pagination helper utilities for API routes
 */

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginationConfig {
  defaultLimit?: number;
  maxLimit?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Parse and validate pagination parameters from URL search params
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  config: PaginationConfig = {},
): PaginationParams {
  const { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = config;

  const limitStr = searchParams.get("limit") || String(defaultLimit);
  const offsetStr = searchParams.get("offset") || "0";

  const limit = Math.min(
    Math.max(1, parseInt(limitStr, 10) || defaultLimit),
    maxLimit,
  );
  const offset = Math.max(0, parseInt(offsetStr, 10) || 0);

  return { limit, offset };
}

/**
 * Get skip/take parameters for Prisma queries
 */
export function getPrismaPageParams(
  searchParams: URLSearchParams,
  config: PaginationConfig = {},
) {
  const { limit, offset } = getPaginationParams(searchParams, config);
  return {
    skip: offset,
    take: limit,
  };
}
