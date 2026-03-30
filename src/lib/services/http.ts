import { Effect, Schedule, pipe, Duration } from "effect";
import { Schema } from "effect";
import {
  NetworkError,
  TimeoutError,
  RateLimitError,
  ValidationError,
  ApiError,
  logExchangeError,
} from "./errors";
import type { ExchangeError } from "./errors";

export interface SafeFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const extractExchange = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    if (hostname.includes("nado")) return "Nado";
    if (hostname.includes("derive") || hostname.includes("lyra")) return "Derive";
    if (hostname.includes("paradex")) return "Paradex";
    if (hostname.includes("ethereal")) return "Ethereal";
    if (hostname.includes("lighter") || hostname.includes("zklighter")) return "Lighter";
    if (hostname.includes("synthetix")) return "Synthetix";
    return "Unknown";
  } catch {
    return "Unknown";
  }
};

const extractEndpoint = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    return pathParts[pathParts.length - 1] || urlObj.pathname;
  } catch {
    return url;
  }
};

export const safeFetch = (
  url: string,
  options: SafeFetchOptions = {}
): Effect.Effect<unknown, ExchangeError> => {
  const { timeout = 10000, retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  const exchange = extractExchange(url);
  const endpoint = extractEndpoint(url);
  const startTime = Date.now();

  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...fetchOptions.headers,
          },
          ...fetchOptions,
        }),
      catch: (error) =>
        new NetworkError({
          exchange,
          endpoint,
          message: error instanceof Error ? error.message : String(error),
          originalError: error instanceof Error ? error : undefined,
        }),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const error = new RateLimitError({
        exchange,
        endpoint,
        statusCode: 429,
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
      });
      logExchangeError(error, Date.now() - startTime);
      return yield* Effect.fail(error);
    }

    if (!response.ok) {
      const error = new ApiError({
        exchange,
        endpoint,
        statusCode: response.status,
        message: response.statusText,
        isRetryable: response.status >= 500,
      });
      logExchangeError(error, Date.now() - startTime);
      return yield* Effect.fail(error);
    }

    return yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (error) =>
        new NetworkError({
          exchange,
          endpoint,
          message: error instanceof Error ? error.message : String(error),
          originalError: error instanceof Error ? error : undefined,
        }),
    });
  }).pipe(
    Effect.retry(
      Schedule.exponential(retryDelay).pipe(
        Schedule.compose(Schedule.recurs(retries))
      )
    ),
    Effect.timeout(Duration.millis(timeout)),
    Effect.mapError((error): ExchangeError => {
      if (error instanceof TimeoutError || error instanceof RateLimitError || error instanceof ApiError || error instanceof NetworkError) {
        return error;
      }
      if (error instanceof Error && error.name === "TimeoutException") {
        const timeoutError = new TimeoutError({
          exchange,
          endpoint,
          message: error.message,
        });
        logExchangeError(timeoutError, Date.now() - startTime);
        return timeoutError;
      }
      const networkError = new NetworkError({
        exchange,
        endpoint,
        message: error instanceof Error ? error.message : String(error),
        originalError: error instanceof Error ? error : undefined,
      });
      logExchangeError(networkError, Date.now() - startTime);
      return networkError;
    })
  );
};

export const safeFetchWithSchema = <A>(
  url: string,
  schema: Schema.Schema<A, unknown>,
  options: SafeFetchOptions = {}
): Effect.Effect<A, ExchangeError> => {
  const exchange = extractExchange(url);
  const endpoint = extractEndpoint(url);

  return pipe(
    safeFetch(url, options),
    Effect.flatMap((data) =>
      pipe(
        Schema.decodeUnknown(schema)(data),
        Effect.mapError((error) => {
          const validationError = new ValidationError({
            exchange,
            endpoint,
            message: error.message,
            cause: error instanceof Error ? error : undefined,
          });
          logExchangeError(validationError);
          return validationError;
        })
      )
    )
  );
};

export const createExchangeService = <T, R>(config: {
  name: string;
  api: string;
  schema: Schema.Schema<T, unknown>;
  transform: (data: T) => R[];
  fetchOptions?: SafeFetchOptions;
}) => ({
  getAllFundingRates: () =>
    pipe(
      safeFetchWithSchema(config.api, config.schema, config.fetchOptions),
      Effect.map((data) => config.transform(data)),
      Effect.tapError((error) => Effect.sync(() => logExchangeError(error))),
      Effect.catchTag("ValidationError", () => Effect.succeed([] as R[])),
      Effect.catchTag("NetworkError", () => Effect.succeed([] as R[])),
      Effect.catchTag("TimeoutError", () => Effect.succeed([] as R[])),
      Effect.catchTag("RateLimitError", () => Effect.succeed([] as R[])),
      Effect.catchTag("ApiError", () => Effect.succeed([] as R[]))
    ),
});

export const withFallback = <A>(
  effect: Effect.Effect<A, ExchangeError>,
  fallback: A
): Effect.Effect<A, ExchangeError> =>
  pipe(
    effect,
    Effect.tapError((error) => Effect.sync(() => logExchangeError(error))),
    Effect.catchAll(() => Effect.succeed(fallback))
  );

export const withRateLimit = <A, E>(
  effect: Effect.Effect<A, E>,
  delay: number = 100
): Effect.Effect<A, E> =>
  pipe(
    Effect.sleep(delay),
    Effect.flatMap(() => effect)
  );
