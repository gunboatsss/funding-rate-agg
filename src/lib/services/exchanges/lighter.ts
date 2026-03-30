import { Effect, pipe } from "effect";
import { safeFetch } from "../http";
import { FundingRate } from "../types";
import { normalizeBaseAsset } from "$lib/utils/token-normalization";

const LIGHTER_API = "https://mainnet.zklighter.elliot.ai";

interface LighterFundingRateResponse {
  symbol: string;
  rate: number;
  exchange: string;
}

interface LighterApiResponse {
  funding_rates: LighterFundingRateResponse[];
}

const getFundingRates = (): Effect.Effect<LighterApiResponse, Error> =>
    pipe(
        safeFetch(`${LIGHTER_API}/api/v1/funding-rates`),
        Effect.map((response) => response as LighterApiResponse),
        Effect.catchAll(() => Effect.succeed({ funding_rates: [] } as LighterApiResponse))
    );

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        getFundingRates(),
        Effect.map((response) => {
            const lighterRates = response.funding_rates?.filter((rate) => rate.exchange === "lighter") || [];

            return lighterRates.map((rate) => ({
                symbol: rate.symbol,
                baseAsset: normalizeBaseAsset(rate.symbol),
                estimatedFundingRate: (rate.rate * 100).toString(),
                lastSettlementRate: (rate.rate * 100).toString(),
                lastSettlementTime: Date.now() - 3600000,
                nextFundingTime: Date.now() + 3600000,
                fundingInterval: 3600000,
            }));
        }),
        Effect.catchAll((error) => {
            console.warn("Lighter API error, returning empty array:", error);
            return Effect.succeed([]);
        })
    );
