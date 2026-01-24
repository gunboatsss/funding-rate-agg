import { Effect, Schedule, pipe } from "effect";
import { Schema } from "effect";

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export const safeFetch = (url: string, options: SafeFetchOptions = {}) => {
  const { timeout = 10000, retries = 3, ...fetchOptions } = options;
  
  return pipe(
    Effect.tryPromise({
      try: () => fetch(url, {
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          ...fetchOptions.headers 
        },
        ...fetchOptions
      }),
      catch: (error) => new Error(`Network error for ${url}: ${error instanceof Error ? error.message : String(error)}`)
    }),
    Effect.flatMap(response =>
      response.ok
        ? Effect.tryPromise(() => response.json())
        : Effect.fail(new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`))
    ),
    Effect.retry(Schedule.exponential(1000).pipe(Schedule.compose(Schedule.recurs(retries)))),
    Effect.timeout(timeout)
  );
};

export const safeFetchWithSchema = <A>(url: string, schema: Schema.Schema<A, any>, options: SafeFetchOptions = {}) =>
  pipe(
    safeFetch(url, options),
    Effect.flatMap(data => Schema.decode(schema)(data)),
    Effect.mapError((error) => new Error(`Schema validation failed for ${url}: ${error.message}`))
  );

export const createExchangeService = <T, R>(config: {
  name: string;
  api: string;
  schema: Schema.Schema<T, any>;
  transform: (data: T) => R[];
  fetchOptions?: SafeFetchOptions;
  concurrency?: number;
}) => ({
  getAllFundingRates: () =>
    pipe(
      safeFetchWithSchema(config.api, config.schema, config.fetchOptions),
      Effect.map(data => config.transform(data)),
      Effect.catchAll(error => {
        console.warn(`${config.name} API error:`, error);
        return Effect.succeed([] as R[]);
      })
    )
});

export const withFallback = <A, E>(effect: Effect.Effect<A, E>, fallback: A) =>
  pipe(
    effect,
    Effect.catchAll(error => {
      console.warn('Error in operation, using fallback:', error);
      return Effect.succeed(fallback);
    })
  );

export const withRateLimit = <A, E>(effect: Effect.Effect<A, E>, delay: number = 100) =>
  pipe(
    Effect.sleep(delay),
    Effect.flatMap(() => effect)
  );