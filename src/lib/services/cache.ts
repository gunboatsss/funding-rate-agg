import { Effect, Cache, Duration } from "effect";

export interface CacheOptions {
  capacity?: number;
  ttl?: number; // Time to live in milliseconds
}

// Create a properly configured cache with actual lookup function
export const createCache = <A, E>(
  lookup: (key: string) => Effect.Effect<A, E>,
  options: CacheOptions = {}
): Effect.Effect<Cache.Cache<string, A, E>, never, never> => {
  const { capacity = 100, ttl = 60000 } = options; // Default 60 seconds TTL
  
  return Cache.make({
    capacity,
    timeToLive: Duration.millis(ttl),
    lookup,
  });
};

// Proper caching utility that uses Effect's built-in cache
export const withCache = <A, E>(
  cache: Cache.Cache<string, A, E>,
  key: string
): Effect.Effect<A, E> => {
  // Simply use the cache's get method which handles hit/miss automatically
  return cache.get(key);
};

// Alternative version that creates a cache on-demand
export const withCacheEffect = <A, E>(
  effect: Effect.Effect<A, E>,
  key: string,
  options: CacheOptions = {}
): Effect.Effect<A, E> => {
  return Effect.suspend(() => {
    return createCache((_k: string) => effect, options).pipe( // eslint-disable-line @typescript-eslint/no-unused-vars
      Effect.flatMap((cache) => cache.get(key))
    );
  });
};

// Convenience function for caching function results
export const cachedFunction = <A, E>(
  fn: (key: string) => Effect.Effect<A, E>,
  _options?: CacheOptions // eslint-disable-line @typescript-eslint/no-unused-vars
): Effect.Effect<(key: string) => Effect.Effect<A, E>, never, never> => {
  return Effect.cachedFunction(fn);
};

// Convenience function for caching single effect results
// Note: Effect.cached returns an Effect that returns another Effect, so we need to handle that
export const cached = <A, E>(
  effect: Effect.Effect<A, E>
): Effect.Effect<Effect.Effect<A, E>, never, never> => {
  return Effect.cached(effect);
};

export const exchangeCacheConfig = {
  // Different TTL values for different types of data
  fundingRates: { ttl: 30000, capacity: 200 }, // 30 seconds, higher capacity for funding rates
  markets: { ttl: 120000, capacity: 50 }, // 2 minutes - market data changes less frequently
  instruments: { ttl: 60000, capacity: 100 }, // 1 minute - instrument data changes moderately
};

// Exchange-specific cache utilities
export const createExchangeCache = <A, E>(
  exchangeName: string,
  dataType: keyof typeof exchangeCacheConfig,
  lookupFn: (key: string) => Effect.Effect<A, E>
): Effect.Effect<Cache.Cache<string, A, E>, never, never> => {
  const config = exchangeCacheConfig[dataType];
  return createCache(lookupFn, config);
};

// Get or create a cached exchange function
export const cachedExchangeCall = <A, E>(
  exchangeName: string,
  dataType: keyof typeof exchangeCacheConfig,
  key: string,
  effect: Effect.Effect<A, E>
): Effect.Effect<A, E> => {
  return Effect.gen(function* () {
    const cache = yield* createExchangeCache<A, E>(exchangeName, dataType, () => effect);
    return yield* cache.get(key);
  });
};

// Type alias for better readability
export type FundingRateCache = Cache.Cache<string, readonly Record<string, unknown>[], never>;
export type ExchangeCache = Cache.Cache<string, unknown, never>;

// Cache statistics helper
export const getCacheStats = <K, A, E>(
  cache: Cache.Cache<K, A, E>
): Effect.Effect<{ hits: number; misses: number; size: number; }, never, never> => {
  return cache.cacheStats.pipe(
    Effect.map(stats => ({
      hits: stats.hits,
      misses: stats.misses,
      size: stats.size,
    }))
  );
};