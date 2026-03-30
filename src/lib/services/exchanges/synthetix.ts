import { Effect, pipe } from "effect";
import { safeFetch } from "../http";
import { FundingRate, SynthetixMarket } from "../types";

const SYNTHETIX_API = "https://papi.synthetix.io/v1/info";

interface SynthetixApiResponse {
	response: unknown;
}

interface SynthetixFundingRateResponse {
	estimatedFundingRate: string;
	lastSettlementRate: string;
	lastSettlementTime: number;
	nextFundingTime: number;
	fundingInterval: number;
}

const getMarkets = (): Effect.Effect<SynthetixMarket[], Error> =>
    pipe(
        safeFetch(SYNTHETIX_API, {
            method: "POST",
            body: JSON.stringify({
                params: { action: "getMarkets" },
            }),
        }),
        Effect.map((data) => (data as SynthetixApiResponse).response as SynthetixMarket[]),
        Effect.catchAll(() => Effect.succeed([] as SynthetixMarket[]))
    );

const getFundingRate = (market: SynthetixMarket): Effect.Effect<FundingRate, Error> =>
    pipe(
        safeFetch(SYNTHETIX_API, {
            method: "POST",
            body: JSON.stringify({
                params: { action: "getFundingRate", symbol: market.symbol },
            }),
        }),
        Effect.map((data) => (data as SynthetixApiResponse).response as SynthetixFundingRateResponse),
        Effect.map((response) => ({
            symbol: market.symbol,
            baseAsset: market.baseAsset.replace(/^1000/, ""),
            estimatedFundingRate: (parseFloat(response.estimatedFundingRate) * 100).toString(),
            lastSettlementRate: (parseFloat(response.lastSettlementRate) * 100).toString(),
            lastSettlementTime: response.lastSettlementTime,
            nextFundingTime: response.nextFundingTime,
            fundingInterval: response.fundingInterval,
        })),
        Effect.catchAll(() =>
            Effect.succeed({
                symbol: market.symbol,
                baseAsset: market.baseAsset.replace(/^1000/, ""),
                estimatedFundingRate: "0",
                lastSettlementRate: "0",
                lastSettlementTime: Date.now() - 3600000,
                nextFundingTime: Date.now() + 3600000,
                fundingInterval: 3600000,
            } as FundingRate)
        )
    );

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        getMarkets(),
        Effect.flatMap((markets) =>
            Effect.all(
                markets.slice(0, 10).map((market) => getFundingRate(market)),
                { concurrency: 3 }
            )
        ),
        Effect.catchAll((error) => {
            console.warn("Synthetix API error, returning empty array:", error);
            return Effect.succeed([]);
        })
    );
