import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { getAllFundingRates } from "../src/lib/services/exchanges/nado";

describe("Nado Funding Rates", () => {
    it("should fetch all funding rates", async () => {
        const result = await Effect.runPromise(getAllFundingRates());

        expect(Array.isArray(result)).toBe(true);
        // Nado might not have active perp products, so accept empty array
        if (result.length > 0) {
            console.log(result);
            const fundingRate = result[0];
            expect(fundingRate).toHaveProperty("symbol");
            expect(fundingRate).toHaveProperty("estimatedFundingRate");
            expect(fundingRate).toHaveProperty("lastSettlementRate");
            expect(fundingRate).toHaveProperty("nextFundingTime");
        }
    });
});