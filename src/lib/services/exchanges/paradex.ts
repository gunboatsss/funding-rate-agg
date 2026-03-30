import { Effect, pipe } from "effect";
import { safeFetch } from "../http";
import { FundingRate } from "../types";
import { cachedExchangeCall } from "../cache";
import { normalizeBaseAsset } from "$lib/utils/token-normalization";

const PARADEX_API = "https://api.prod.paradex.trade/v1";

interface ParadexMarket {
	symbol: string;
	base_currency: string;
	funding_period_hours: number;
}

interface ParadexMarketSummary {
	symbol: string;
	funding_rate: string;
	created_at: number;
}

interface ParadexApiResponse {
	results: ParadexMarket[];
}

interface ParadexSummaryApiResponse {
	results: ParadexMarketSummary[];
}

const getMarkets = (): Effect.Effect<ParadexMarket[], Error> =>
	pipe(
		safeFetch(`${PARADEX_API}/markets`),
		Effect.map((response) => (response as ParadexApiResponse).results || []),
		Effect.catchAll((error) => {
			console.warn("Paradex markets API error:", error);
			return Effect.succeed([]);
		})
	);

const getMarketsSummary = (): Effect.Effect<ParadexMarketSummary[], Error> =>
	pipe(
		safeFetch(`${PARADEX_API}/markets/summary?market=ALL`),
		Effect.map((response) => (response as ParadexSummaryApiResponse).results || []),
		Effect.catchAll((error) => {
			console.warn("Paradex markets summary API error:", error);
			return Effect.succeed([]);
		})
	);

const getAllFundingRatesUncached = (): Effect.Effect<FundingRate[], Error> =>
	pipe(
		Effect.all([getMarkets(), getMarketsSummary()], { concurrency: 2 }),
		Effect.map(([markets, summaries]) => {
			// Create a map of symbol -> funding_period_hours
			const periodMap = new Map<string, number>();
			markets.forEach((market) => {
				periodMap.set(market.symbol, market.funding_period_hours || 8); // Default to 8h if not specified
			});

			// Merge summary data with period data and normalize to hourly
			return summaries.map((summary) => {
				const periodHours = periodMap.get(summary.symbol) || 8;
				const rawRate = parseFloat(summary.funding_rate) || 0;
				// Normalize to hourly rate: divide by period hours, multiply by 100 for percentage
				const hourlyRate = (rawRate / periodHours) * 100;

				return {
					symbol: summary.symbol,
					baseAsset: normalizeBaseAsset(summary.symbol),
					estimatedFundingRate: hourlyRate.toString(),
					lastSettlementRate: hourlyRate.toString(),
					lastSettlementTime: summary.created_at,
					nextFundingTime: summary.created_at + periodHours * 3600000,
					fundingInterval: periodHours * 3600000,
				};
			});
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
		getAllFundingRatesUncached(),
		[]
	);