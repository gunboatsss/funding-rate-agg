import { Effect, Cache, Duration, Ref } from "effect";
import { isRetryableError } from "./errors";
import type { ExchangeError } from "./errors";

export interface CacheOptions {
  capacity?: number;
  ttl?: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export type CircuitState = "closed" | "open" | "half_open";

interface CircuitBreakerData {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

const defaultCircuitConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
};

const circuitBreakers = new Map<string, Ref.Ref<CircuitBreakerData>>();

export const getCircuitBreakerState = (
  exchangeName: string
): Effect.Effect<CircuitBreakerData | null> => {
  const cb = circuitBreakers.get(exchangeName);
  if (!cb) {
    return Effect.succeed(null);
  }
  return Effect.gen(function* () {
    return yield* Ref.get(cb);
  });
};

export const resetCircuitBreaker = (exchangeName: string): Effect.Effect<void> => {
  const cb = circuitBreakers.get(exchangeName);
  if (!cb) {
    return Effect.succeed(undefined);
  }
  return Effect.gen(function* () {
    yield* Ref.set(cb, {
      state: "closed" as CircuitState,
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    });
  });
};

const isCircuitOpen = (state: CircuitBreakerData): boolean => {
  if (state.state === "open") {
    return Date.now() < state.nextAttemptTime;
  }
  return false;
};

export const createCache = <A, E>(
  lookup: (key: string) => Effect.Effect<A, E>,
  options: CacheOptions = {}
): Effect.Effect<Cache.Cache<string, A, E>, never, never> => {
  const { capacity = 100, ttl = 60000 } = options;

  return Cache.make({
    capacity,
    timeToLive: Duration.millis(ttl),
    lookup,
  });
};

export const exchangeCacheConfig = {
  fundingRates: { ttl: 30000, capacity: 200 },
  markets: { ttl: 120000, capacity: 50 },
  instruments: { ttl: 60000, capacity: 100 },
};

export const createExchangeCache = <A, E>(
  exchangeName: string,
  dataType: keyof typeof exchangeCacheConfig,
  lookupFn: (key: string) => Effect.Effect<A, E>
): Effect.Effect<Cache.Cache<string, A, E>, never, never> => {
  const config = exchangeCacheConfig[dataType];
  return createCache(lookupFn, config);
};

const getOrCreateCircuitBreaker = (exchangeName: string): Ref.Ref<CircuitBreakerData> => {
  let cb = circuitBreakers.get(exchangeName);
  if (!cb) {
    cb = Ref.unsafeMake({
      state: "closed" as CircuitState,
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    });
    circuitBreakers.set(exchangeName, cb);
  }
  return cb;
};

export const cachedExchangeCall = <A, E>(
  exchangeName: string,
  dataType: keyof typeof exchangeCacheConfig,
  key: string,
  effect: Effect.Effect<A, E>,
  fallback: A
): Effect.Effect<A, never> => {
  const circuitBreaker = getOrCreateCircuitBreaker(exchangeName);

  return Effect.gen(function* () {
    const state = yield* Ref.get(circuitBreaker);

    if (isCircuitOpen(state)) {
      return fallback;
    }

    const cache = yield* createExchangeCache<A, E>(exchangeName, dataType, () => effect);
    const result = yield* cache.get(key);

    const successState = yield* Ref.get(circuitBreaker);
    const newSuccesses = successState.successes + 1;
    const newState: CircuitState = newSuccesses >= defaultCircuitConfig.successThreshold ? "closed" : "half_open";
    yield* Ref.set(circuitBreaker, {
      ...successState,
      successes: newSuccesses,
      state: successState.state === "half_open" ? newState : "closed",
      failures: 0,
    });

    return result;
  }  ).pipe(
    Effect.catchAll((error: unknown) =>
      Effect.gen(function* () {
        if (isRetryableError(error as ExchangeError)) {
          const s = yield* Ref.get(circuitBreaker);
          const newFailures = s.failures + 1;
          const shouldOpen = newFailures >= defaultCircuitConfig.failureThreshold;
          const nextAttemptTime = shouldOpen ? Date.now() + defaultCircuitConfig.timeout : s.nextAttemptTime;
          const newState: CircuitState = shouldOpen ? "open" : s.state === "half_open" ? "open" : s.state;

          yield* Ref.set(circuitBreaker, {
            ...s,
            failures: newFailures,
            state: newState,
            lastFailureTime: Date.now(),
            nextAttemptTime,
            successes: 0,
          });
        }

        return fallback;
      })
    )
  );
};

export type FundingRateCache = Cache.Cache<string, readonly Record<string, unknown>[], never>;
export type ExchangeCache = Cache.Cache<string, unknown, never>;

export const getCacheStats = <K, A, E>(
  cache: Cache.Cache<K, A, E>
): Effect.Effect<{ hits: number; misses: number; size: number }, never, never> => {
  return cache.cacheStats.pipe(
    Effect.map((stats) => ({
      hits: stats.hits,
      misses: stats.misses,
      size: stats.size,
    }))
  );
};
