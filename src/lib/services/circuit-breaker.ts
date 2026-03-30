import { Effect, Ref } from "effect";
import { isRetryableError } from "./errors";
import type { ExchangeError } from "./errors";

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
};

export const createCircuitBreaker = (
  _config?: CircuitBreakerConfig // eslint-disable-line @typescript-eslint/no-unused-vars
): Effect.Effect<Ref.Ref<CircuitBreakerState>, never, never> =>
  Ref.make<CircuitBreakerState>({
    state: "closed",
    failures: 0,
    successes: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
  });

const isCircuitOpen = (
  state: CircuitBreakerState
): boolean => {
  if (state.state === "open") {
    const now = Date.now();
    if (now >= state.nextAttemptTime) {
      return false;
    }
    return true;
  }
  return false;
};

export const withCircuitBreaker = <A, E extends ExchangeError>(
  effect: Effect.Effect<A, E>,
  circuitBreaker: Ref.Ref<CircuitBreakerState>,
  config: CircuitBreakerConfig = defaultConfig
): Effect.Effect<A, E> =>
  Effect.gen(function* () {
    const state = yield* Ref.get(circuitBreaker);

    if (isCircuitOpen(state)) {
      return yield* Effect.fail(
        new Error(`Circuit breaker is open for ${state.nextAttemptTime - Date.now()}ms`) as E
      );
    }

    const result = yield* effect.pipe(
      Effect.mapError((error) => error as E)
    );

    const currentState = yield* Ref.get(circuitBreaker);
    
    if (currentState.state === "half_open") {
      const newSuccesses = currentState.successes + 1;
      const newState: CircuitState = newSuccesses >= config.successThreshold ? "closed" : "half_open";
      
      yield* Ref.set(circuitBreaker, {
        ...currentState,
        successes: newSuccesses,
        state: newState,
        failures: 0,
      });
    } else {
      yield* Ref.set(circuitBreaker, {
        ...currentState,
        state: "closed" as CircuitState,
        failures: 0,
        successes: currentState.successes + 1,
      });
    }

    return result;
  }).pipe(
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        const isRetryable = error instanceof Error 
          ? isRetryableError(error as ExchangeError)
          : true;

        if (isRetryable) {
          const s = yield* Ref.get(circuitBreaker);
          const newFailures = s.failures + 1;
          const shouldOpen = newFailures >= config.failureThreshold;
          const nextAttemptTime = shouldOpen ? Date.now() + config.timeout : s.nextAttemptTime;
          const newState: CircuitState = shouldOpen ? "open" : s.state === "half_open" ? "open" : s.state;

          yield* Ref.set(circuitBreaker, {
            ...s,
            failures: newFailures,
            state: newState as CircuitState,
            lastFailureTime: Date.now(),
            nextAttemptTime,
            successes: 0,
          });
        }

        return yield* Effect.fail(error as E);
      })
    )
  );

export const getCircuitState = (
  circuitBreaker: Ref.Ref<CircuitBreakerState>
): Effect.Effect<CircuitBreakerState, never, never> =>
  Ref.get(circuitBreaker);

export const resetCircuitBreaker = (
  circuitBreaker: Ref.Ref<CircuitBreakerState>
): Effect.Effect<void, never, never> =>
  Ref.set(circuitBreaker, {
    state: "closed" as CircuitState,
    failures: 0,
    successes: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
  });

export const createCircuitBreakerForExchange = (
  _exchangeName: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Effect.Effect<Ref.Ref<CircuitBreakerState>, never, never> =>
  createCircuitBreaker();
