import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { getAllFundingRates } from "../src/lib/services/exchanges/ethereal";

describe("Ethereal Funding Rates", () => {
    it("should fetch all funding rates", async () => {
        const result = await Effect.runPromise(getAllFundingRates());

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        const fundingRate = result[0];
        expect(fundingRate).toHaveProperty("symbol");
        expect(fundingRate).toHaveProperty("estimatedFundingRate");
        expect(fundingRate).toHaveProperty("lastSettlementRate");
        expect(fundingRate).toHaveProperty("nextFundingTime");
    });
});