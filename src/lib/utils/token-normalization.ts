/**
 * Centralized token/baseAsset normalization utilities
 * Different exchanges use different formats for token symbols
 */

export interface NormalizeOptions {
  removePrefix?: string;
  removeNumberPrefix?: boolean;
}

/**
 * Normalize a symbol/baseAsset from exchange API to consistent format
 * 
 * Handles:
 * - Split by "-" and take first part (e.g., "ETH-USD" -> "ETH")
 * - Remove "k" prefix (Paradex/Nado style)
 * - Remove "1000" prefix (Synthetix/Lightning style for small caps)
 */
export function normalizeBaseAsset(symbol: string, options: NormalizeOptions = {}): string {
  const { removeNumberPrefix = true } = options;

  if (!symbol) {
    return symbol;
  }

  let normalized = symbol;

  // Split by "-" and take first part (for "ETH-USD" style symbols)
  if (normalized.includes("-")) {
    normalized = normalized.split("-")[0];
  }

  // Remove "k" prefix (Paradex style: "kETH" -> "ETH")
  normalized = normalized.replace(/^k/, "");

  // Remove "1000" prefix (Synthetix/Lighter style: "1000FLOKI" -> "FLOKI")
  if (removeNumberPrefix) {
    normalized = normalized.replace(/^1000/, "");
  }

  return normalized;
}

/**
 * Normalize from various exchange-specific symbol formats
 */
export function normalizeSymbol(
  symbol: string,
  exchange: "nado" | "derive" | "paradex" | "ethereal" | "lighter" | "synthetix"
): string {
  switch (exchange) {
    case "nado":
    case "paradex":
      return normalizeBaseAsset(symbol, { removeNumberPrefix: true });

    case "lighter":
    case "synthetix":
      return normalizeBaseAsset(symbol, { removeNumberPrefix: true });

    case "derive":
      // Derive uses base_currency directly, still clean up any prefixes
      return normalizeBaseAsset(symbol, { removeNumberPrefix: true });

    case "ethereal":
      // Ethereal uses baseTokenName directly
      return normalizeBaseAsset(symbol, { removeNumberPrefix: false });

    default:
      return normalizeBaseAsset(symbol);
  }
}

/**
 * Check if a symbol is likely a small-cap token (has 1000 prefix)
 */
export function isSmallCapToken(symbol: string): boolean {
  return /^1000[A-Z]/.test(symbol);
}
