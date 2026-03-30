import { describe, it, expect } from "bun:test";
import { Effect, Ref } from "effect";
import {
  createCircuitBreaker,
  getCircuitState,
  resetCircuitBreaker,
} from "../src/lib/services/circuit-breaker";

describe("Circuit Breaker", () => {
  describe("createCircuitBreaker", () => {
    it("should create a circuit breaker with initial closed state", async () => {
      const cb = await Effect.runPromise(createCircuitBreaker());
      const state = await Effect.runPromise(getCircuitState(cb));

      expect(state.state).toBe("closed");
      expect(state.failures).toBe(0);
      expect(state.successes).toBe(0);
    });
  });

  describe("resetCircuitBreaker", () => {
    it("should reset circuit breaker to initial state", async () => {
      const cb = await Effect.runPromise(createCircuitBreaker());

      await Effect.runPromise(
        Effect.gen(function* () {
          const state = yield* getCircuitState(cb);
          yield* Ref.set(cb, {
            ...state,
            state: "open" as const,
            failures: 10,
            successes: 5,
          });
        })
      );

      await Effect.runPromise(resetCircuitBreaker(cb));
      const state = await Effect.runPromise(getCircuitState(cb));

      expect(state.state).toBe("closed");
      expect(state.failures).toBe(0);
      expect(state.successes).toBe(0);
    });
  });

  describe("Circuit State Transitions", () => {
    it("should track failures correctly", async () => {
      const cb = await Effect.runPromise(
        createCircuitBreaker({ failureThreshold: 3, successThreshold: 2, timeout: 60000 })
      );

      const initialState = await Effect.runPromise(getCircuitState(cb));
      expect(initialState.failures).toBe(0);

      await Effect.runPromise(
        Effect.gen(function* () {
          const state = yield* getCircuitState(cb);
          yield* Ref.set(cb, {
            ...state,
            failures: 2,
          });
        })
      );

      const updatedState = await Effect.runPromise(getCircuitState(cb));
      expect(updatedState.failures).toBe(2);
    });
  });
});
