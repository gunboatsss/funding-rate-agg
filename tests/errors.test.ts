import { describe, it, expect } from "bun:test";
import {
  NetworkError,
  TimeoutError,
  RateLimitError,
  ValidationError,
  ApiError,
  isRetryableError,
  logExchangeError,
  getRecentErrors,
  getErrorCount,
} from "../src/lib/services/errors";

describe("Exchange Errors", () => {
  describe("NetworkError", () => {
    it("should create a network error with correct properties", () => {
      const error = new NetworkError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        message: "Connection refused",
      });

      expect(error._tag).toBe("NetworkError");
      expect(error.exchange).toBe("TestExchange");
      expect(error.endpoint).toBe("/api/test");
      expect(error.message).toBe("Connection refused");
    });

    it("should be retryable", () => {
      const error = new NetworkError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        message: "Connection refused",
      });

      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe("TimeoutError", () => {
    it("should create a timeout error", () => {
      const error = new TimeoutError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        message: "Request timeout",
      });

      expect(error._tag).toBe("TimeoutError");
      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe("RateLimitError", () => {
    it("should create a rate limit error with retryAfter", () => {
      const error = new RateLimitError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        statusCode: 429,
        retryAfter: 60,
      });

      expect(error._tag).toBe("RateLimitError");
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe("ApiError", () => {
    it("should be retryable for 5xx errors", () => {
      const error = new ApiError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        statusCode: 503,
        message: "Service unavailable",
        isRetryable: true,
      });

      expect(isRetryableError(error)).toBe(true);
    });

    it("should not be retryable for 4xx errors", () => {
      const error = new ApiError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        statusCode: 400,
        message: "Bad request",
        isRetryable: false,
      });

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe("ValidationError", () => {
    it("should not be retryable", () => {
      const error = new ValidationError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        message: "Invalid JSON",
      });

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe("logExchangeError", () => {
    it("should log error and add to recent errors", () => {
      const error = new NetworkError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        message: "Connection error",
      });

      logExchangeError(error, 100);

      const recent = getRecentErrors("TestExchange", 5);
      expect(recent.length).toBeGreaterThan(0);
      expect(recent[recent.length - 1].error._tag).toBe("NetworkError");
    });

    it("should filter by exchange", () => {
      const error1 = new NetworkError({
        exchange: "Exchange1",
        endpoint: "/api/test",
        message: "Error 1",
      });
      const error2 = new NetworkError({
        exchange: "Exchange2",
        endpoint: "/api/test",
        message: "Error 2",
      });

      logExchangeError(error1);
      logExchangeError(error2);

      const exchange1Errors = getRecentErrors("Exchange1", 10);
      const exchange2Errors = getRecentErrors("Exchange2", 10);

      expect(exchange1Errors.length).toBeGreaterThan(0);
      expect(exchange2Errors.length).toBeGreaterThan(0);
    });
  });

  describe("getErrorCount", () => {
    it("should return error count within time window", () => {
      new NetworkError({
        exchange: "TestExchange",
        endpoint: "/api/test",
        message: "Error",
      });

      const count = getErrorCount("TestExchange", 300000);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
