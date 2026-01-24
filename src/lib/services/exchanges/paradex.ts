import { Effect, pipe } from "effect";
import { safeFetch } from "../http";
import { FundingRate } from "../types";
import { cachedExchangeCall } from "../cache";

const PARADEX_API = "https://api.prod.paradex.trade/v1";

const getMarketsSummary = (): Effect.Effect<any[], Error> =>
    pipe(
        safeFetch(`${PARADEX_API}/markets/summary?market=ALL`),
        Effect.map((response: any) => [...response.results]),
        Effect.catchAll((error) => {
            console.warn('Paradex markets API error:', error);
            return Effect.succeed([]);
        })
    );

const getFundingData = (market: string): Effect.Effect<{ created_at: number; funding_rate: string; funding_period_hours?: number } | null, Error> =>
    pipe(
        safeFetch(`${PARADEX_API}/funding/data?market=${market}&page_size=1`),
        Effect.map((data: any) => {
            console.log(`Paradex: fetched funding data for ${market}`);
            return data.results?.[0] || null;
        }),
        Effect.catchAll(() => {
            console.log(`Paradex: funding data fetch failed for ${market}, using null`);
            return Effect.succeed(null);
        })
    );

const getAllFundingRatesUncached = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        getMarketsSummary(),
        Effect.map((markets) => {
            // Use summary data only for speed - skip individual funding calls
            return markets.map((market) => ({
                symbol: market.symbol,
                baseAsset: market.symbol.split("-")[0] || market.symbol,
                estimatedFundingRate: market.funding_rate || "0",
                lastSettlementRate: market.funding_rate || "0",
                lastSettlementTime: Date.now() - 3600000,
                nextFundingTime: Date.now() + 3600000,
                fundingInterval: 3600000,
            }));
        }),
        Effect.catchAll((error) => {
            console.warn('Paradex API error, returning empty array:', error);
            return Effect.succeed([]);
        })
    );

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
    cachedExchangeCall(
        "paradex",
        "fundingRates",
        "all",
        getAllFundingRatesUncached()
    );