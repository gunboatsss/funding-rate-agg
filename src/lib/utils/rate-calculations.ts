/**
 * Utility functions for funding rate calculations and formatting
 */

/**
 * Rate period options for display normalization
 * All rates are stored as hourly rates internally, then normalized for display
 */
export type RatePeriod = '1h' | '8h' | '1d' | '365d';

/**
 * Normalize hourly rate to selected display period
 * All exchange APIs normalize to hourly rates on ingestion, then we scale for display
 */
export function normalizeFromHourly(hourlyRate: number, period: RatePeriod): number {
	const multipliers: Record<RatePeriod, number> = {
		'1h': 1,           // Hourly rate (as-is)
		'8h': 8,           // 8-hour rate
		'1d': 24,          // Daily rate (24 hours)
		'365d': 24 * 365   // Annual rate (365 days)
	};
	return hourlyRate * multipliers[period];
}

/**
 * Format funding rate with period normalization
 */
export function formatRate(rate: number, period: RatePeriod = '1h'): string {
	const adjustedRate = normalizeFromHourly(rate, period);
	return adjustedRate >= 0
		? `+${adjustedRate.toFixed(4)}%`
		: `${adjustedRate.toFixed(4)}%`;
}

/**
 * Format rate from string input (for API responses)
 */
export function formatRateFromString(rate: string, period: RatePeriod = '1h'): string {
	const num = parseFloat(rate) || 0;
	return formatRate(num, period);
}

/**
 * Get color threshold based on selected period
 * Thresholds scale with the period multiplier
 */
export function getRateThreshold(period: RatePeriod): number {
	const baseThreshold = 0.01; // 0.01% hourly threshold
	return normalizeFromHourly(baseThreshold, period);
}

/**
 * Get color class for rate based on threshold
 */
export function getRateColor(rate: number, period: RatePeriod = '1h'): string {
	const threshold = getRateThreshold(period);
	if (rate > threshold) return 'text-green-400';
	if (rate < -threshold) return 'text-red-400';
	return 'text-gray-300';
}

/**
 * Get background color class for rate based on threshold
 */
export function getRateBg(rate: number, period: RatePeriod = '1h'): string {
	const threshold = getRateThreshold(period);
	if (rate > threshold) return 'bg-green-900/20';
	if (rate < -threshold) return 'bg-red-900/20';
	return 'bg-gray-800/50';
}

/**
 * Format comparison rates with period normalization
 */
export function formatComparisonRate(rate: number, period: RatePeriod = '1h'): string {
	const adjustedRate = normalizeFromHourly(rate, period);
	return `${adjustedRate >= 0 ? '+' : ''}${adjustedRate.toFixed(4)}%`;
}

/**
 * Get display label for rate period
 */
export function getPeriodLabel(period: RatePeriod): string {
	const labels: Record<RatePeriod, string> = {
		'1h': '1H',
		'8h': '8H',
		'1d': '1D',
		'365d': '365D'
	};
	return labels[period];
}