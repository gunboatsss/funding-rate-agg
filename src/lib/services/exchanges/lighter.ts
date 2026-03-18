import { Effect, pipe } from "effect";
import { safeFetch } from "../http";
import { FundingRate } from "../types";

const LIGHTER_API = "https://mainnet.zklighter.elliot.ai";

const getFundingRates = (): Effect.Effect<any[], Error> =>
    pipe(
        safeFetch(`${LIGHTER_API}/api/v1/funding-rates`),
        Effect.map((response: any) => [...response.funding_rates]),
        Effect.catchAll(() => Effect.succeed([]))
    );

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        getFundingRates(),
        Effect.map((response: any) => {
            // Filter to only include Lighter exchange rates from the aggregator API
            const lighterRates = response.funding_rates?.filter((rate: any) => rate.exchange === "lighter") || [];
                        
            return lighterRates.map((rate: any) => ({
                symbol: rate.symbol,
                baseAsset: rate.symbol.split("-")[0] || rate.symbol,
                estimatedFundingRate: (rate.rate * 100).toString(),
                lastSettlementRate: (rate.rate * 100).toString(),
                lastSettlementTime: Date.now() - 3600000,
                nextFundingTime: Date.now() + 3600000,
                fundingInterval: 3600000,
            }));
        }),
        Effect.catchAll((error) => {
            console.warn('Lighter API error, returning empty array:', error);
            return Effect.succeed([]);
        })
    );