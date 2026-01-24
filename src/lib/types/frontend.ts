import { FundingRate } from "../services/types";

// Frontend-specific types extending the base types
export interface ExchangeStatus {
  exchange: string;
  status: 'success' | 'error';
  lastUpdate: number;
  rateCount: number;
  error?: string;
}

export interface RateDisplay extends FundingRate {
  exchange: string;
  rateNumeric: number;
  rateFormatted: string;
  isPositive: boolean;
  timeUntilNextFunding: number;
  lastUpdateFormatted: string;
}

export interface SymbolGroup {
  symbol: string;
  baseAsset: string;
  exchanges: RateDisplay[];
  comparison: {
    lowest: { exchange: string; rate: number };
    highest: { exchange: string; rate: number };
    average: number;
    spread: number;
    count: number;
  } | null;
}

export interface ExchangeData {
  exchange: string;
  status: 'success' | 'error';
  rates: FundingRate[];
  lastUpdate: number;
  error?: string;
}

export interface DashboardData {
  byExchange: ExchangeData[];
  bySymbol: SymbolGroup[];
  totalRates: number;
  lastUpdate: number;
  uniqueSymbols: string[];
}

export interface SortOption {
  key: keyof RateDisplay;
  label: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  exchanges: string[];
  symbols: string[];
  rateRange: { min: number; max: number };
  showOnlyPositive: boolean;
  showOnlyNegative: boolean;
}