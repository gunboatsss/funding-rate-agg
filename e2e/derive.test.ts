import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { getAllFundingRates } from "../src/lib/services/exchanges/derive";

describe("Derive Funding Rates", () => {
	it("should fetch all funding rates", async () => {
		const result = await Effect.runPromise(getAllFundingRates());

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);

		const fundingRate = result[0];
		expect(fundingRate).toHaveProperty("symbol");
		expect(fundingRate).toHaveProperty("estimatedFundingRate");
		expect(fundingRate).toHaveProperty("lastSettlementRate");
		expect(fundingRate).toHaveProperty("nextFundingTime");
		console.log(result[0].symbol, parseFloat(result[0].estimatedFundingRate) * 24 *365 * 100);
	});

	it("should fetch all perp markets across all currencies", async () => {
		const result = await Effect.runPromise(getAllFundingRates());

		// Should fetch more than just the 3 hardcoded currencies (BTC, ETH, SOL)
		expect(result.length).toBeGreaterThan(3);

		const symbols = result.map((r) => r.symbol);
		expect(symbols.some((s) => s.includes("BTC"))).toBe(true);
		expect(symbols.some((s) => s.includes("ETH"))).toBe(true);
		expect(symbols.some((s) => s.includes("SOL"))).toBe(true);
	});
});