import { Effect, pipe } from "effect";
import { FundingRate } from "./types";
import * as Nado from "./exchanges/nado";
import * as Derive from "./exchanges/derive";
import * as Paradex from "./exchanges/paradex";
import * as Ethereal from "./exchanges/ethereal";
import * as Lighter from "./exchanges/lighter";
import * as Synthetix from "./exchanges/synthetix";

export interface ExchangeData {
  exchange: string;
  rates: FundingRate[];
  lastUpdate: number;
  status: 'success' | 'error';
  error?: string;
}

export interface AggregatedData {
  byExchange: ExchangeData[];
  totalRates: number;
  lastUpdate: number;
}

// Get all funding rates from all exchanges
export const getAllExchangeData = (): Effect.Effect<ExchangeData[], never, never> =>
  Effect.all([
    pipe(
      Nado.getAllFundingRates(),
      Effect.map(rates => ({
        exchange: 'Nado',
        rates,
        lastUpdate: Date.now(),
        status: 'success' as const
      })),
      Effect.catchAll(error => Effect.succeed({
        exchange: 'Nado',
        rates: [],
        lastUpdate: Date.now(),
        status: 'error' as const,
        error: error.message
      }))
    ),
    pipe(
      Derive.getAllFundingRates(),
      Effect.map(rates => ({
        exchange: 'Derive',
        rates,
        lastUpdate: Date.now(),
        status: 'success' as const
      })),
      Effect.catchAll(error => Effect.succeed({
        exchange: 'Derive',
        rates: [],
        lastUpdate: Date.now(),
        status: 'error' as const,
        error: error.message
      }))
    ),
    pipe(
      Paradex.getAllFundingRates(),
      Effect.map(rates => ({
        exchange: 'Paradex',
        rates,
        lastUpdate: Date.now(),
        status: 'success' as const
      })),
      Effect.catchAll(error => Effect.succeed({
        exchange: 'Paradex',
        rates: [],
        lastUpdate: Date.now(),
        status: 'error' as const,
        error: error.message
      }))
    ),
    pipe(
      Ethereal.getAllFundingRates(),
      Effect.map(rates => ({
        exchange: 'Ethereal',
        rates,
        lastUpdate: Date.now(),
        status: 'success' as const
      })),
      Effect.catchAll(error => Effect.succeed({
        exchange: 'Ethereal',
        rates: [],
        lastUpdate: Date.now(),
        status: 'error' as const,
        error: error.message
      }))
    ),
    pipe(
      Lighter.getAllFundingRates(),
      Effect.map(rates => ({
        exchange: 'Lighter',
        rates,
        lastUpdate: Date.now(),
        status: 'success' as const
      })),
      Effect.catchAll(error => Effect.succeed({
        exchange: 'Lighter',
        rates: [],
        lastUpdate: Date.now(),
        status: 'error' as const,
        error: error.message
      }))
    ),
    pipe(
      Synthetix.getAllFundingRates(),
      Effect.map(rates => ({
        exchange: 'Synthetix',
        rates,
        lastUpdate: Date.now(),
        status: 'success' as const
      })),
      Effect.catchAll(error => Effect.succeed({
        exchange: 'Synthetix',
        rates: [],
        lastUpdate: Date.now(),
        status: 'error' as const,
        error: error.message
      }))
    )
  ], { concurrency: 6 });



// Get aggregated data
export const getAggregatedData = (): Effect.Effect<AggregatedData, never, never> =>
  pipe(
    getAllExchangeData(),
    Effect.map(exchangeData => {
      const totalRates = exchangeData.reduce((sum, ex) => sum + ex.rates.length, 0);
      const lastUpdate = Math.max(...exchangeData.map(ex => ex.lastUpdate));
      
      return {
        byExchange: exchangeData,
        totalRates,
        lastUpdate
      };
    })
  );

// Get unique symbols across all exchanges
export const getUniqueSymbols = (exchangeData: ExchangeData[]): string[] => {
  const symbolSet = new Set<string>();
  
  exchangeData.forEach(exchange => {
    if (exchange.status === 'success') {
      exchange.rates.forEach(rate => {
        symbolSet.add(rate.symbol);
      });
    }
  });
  
  return Array.from(symbolSet).sort();
};

// Get best/worst rates for a symbol
export const getRateComparison = (symbolData: ExchangeData[]) => {
  const validRates = symbolData
    .filter(ex => ex.status === 'success' && ex.rates.length > 0)
    .map(ex => ({
      exchange: ex.exchange,
      rate: parseFloat(ex.rates[0].estimatedFundingRate) || 0,
      lastUpdate: ex.lastUpdate
    }))
    .filter(item => !isNaN(item.rate));
  
  if (validRates.length === 0) return null;
  
  validRates.sort((a, b) => a.rate - b.rate);
  
  return {
    lowest: validRates[0],
    highest: validRates[validRates.length - 1],
    average: validRates.reduce((sum, item) => sum + item.rate, 0) / validRates.length,
    count: validRates.length,
    spread: validRates[validRates.length - 1].rate - validRates[0].rate
  };
};