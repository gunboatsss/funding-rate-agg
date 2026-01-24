import { Effect, pipe, Schema } from "effect";
import { safeFetch } from "../http";
import { FundingRate, SynthetixMarket } from "../types";

const SYNTHETIX_API = "https://papi.synthetix.io/v1/info";

const getMarkets = (): Effect.Effect<SynthetixMarket[], Error> =>
    pipe(
        safeFetch(SYNTHETIX_API, {
            method: "POST",
            body: JSON.stringify({
                params: { action: "getMarkets" },
            }),
        }),
        Effect.map((data: any) => data.response),
        Effect.catchAll(() => Effect.succeed([] as SynthetixMarket[]))
    );

const getFundingRate = (symbol: string): Effect.Effect<FundingRate, Error> =>
    pipe(
        safeFetch(SYNTHETIX_API, {
            method: "POST",
            body: JSON.stringify({
                params: { action: "getFundingRate", symbol },
            }),
        }),
        Effect.map((data: any) => data.response),
        Effect.catchAll(() => Effect.succeed({
            symbol,
            baseAsset: symbol.split("-")[0] || symbol,
            estimatedFundingRate: "0",
            lastSettlementRate: "0",
            lastSettlementTime: Date.now() - 3600000,
            nextFundingTime: Date.now() + 3600000,
            fundingInterval: 3600000,
        } as FundingRate))
    );

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        getMarkets(),
        Effect.flatMap((markets) =>
            Effect.all(
                markets.slice(0, 10).map((market) => // Limit to prevent overload
                    getFundingRate(market.symbol)
                ),
                { concurrency: 3 } // Reduced concurrency to be more conservative
            )
        ),
        Effect.catchAll((error) => {
            console.warn('Synthetix API error, returning empty array:', error);
            return Effect.succeed([]);
        })
    );