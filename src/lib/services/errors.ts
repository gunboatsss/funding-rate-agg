import { Data } from "effect";

export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly exchange: string;
  readonly endpoint: string;
  readonly message: string;
  readonly originalError?: Error;
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly exchange: string;
  readonly endpoint: string;
  readonly message: string;
}> {}

export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly exchange: string;
  readonly endpoint: string;
  readonly statusCode: number;
  readonly retryAfter?: number;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly exchange: string;
  readonly endpoint: string;
  readonly message: string;
  readonly cause?: Error;
}> {}

export class ApiError extends Data.TaggedError("ApiError")<{
  readonly exchange: string;
  readonly endpoint: string;
  readonly statusCode: number;
  readonly message: string;
  readonly isRetryable: boolean;
}> {}

export type ExchangeError =
  | NetworkError
  | TimeoutError
  | RateLimitError
  | ValidationError
  | ApiError;

export const isRetryableError = (error: ExchangeError): boolean => {
  switch (error._tag) {
    case "NetworkError":
    case "TimeoutError":
    case "RateLimitError":
      return true;
    case "ApiError":
      return error.isRetryable;
    case "ValidationError":
      return false;
  }
};

export interface ExchangeErrorLog {
  timestamp: number;
  error: ExchangeError;
  duration?: number;
}

const errorLog: ExchangeErrorLog[] = [];
const MAX_LOG_SIZE = 1000;

export const logExchangeError = (error: ExchangeError, duration?: number): void => {
  errorLog.push({ timestamp: Date.now(), error, duration });

  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.shift();
  }

  const logLevel = isRetryableError(error) ? "warn" : "error";
  
  let message: string | undefined;
  switch (error._tag) {
    case "NetworkError":
    case "TimeoutError":
    case "ValidationError":
      message = error.message;
      break;
    case "ApiError":
    case "RateLimitError":
      message = `${error.statusCode}`;
      break;
  }
  
  console[logLevel](JSON.stringify({
    type: "exchange_error",
    _tag: error._tag,
    exchange: error.exchange,
    endpoint: error.endpoint,
    message,
    duration,
  }));
};

export const getRecentErrors = (
  exchange?: string,
  limit = 10
): ExchangeErrorLog[] => {
  const filtered = exchange
    ? errorLog.filter((e) => e.error.exchange === exchange)
    : errorLog;
  return filtered.slice(-limit);
};

export const getErrorCount = (
  exchange: string,
  windowMs: number = 300000
): number => {
  const now = Date.now();
  const windowStart = now - windowMs;
  return errorLog.filter(
    (e) => e.error.exchange === exchange && e.timestamp > windowStart
  ).length;
};
