/**
 * Utility functions for funding rate calculations and formatting
 */

/**
 * Convert daily rate to annual rate (simple annualization)
 */
export function calculateAnnualRate(dailyRate: number): number {
	return dailyRate * 365;
}

/**
 * Format funding rate with optional annualization
 */
export function formatRate(rate: number, showAnnual: boolean = false): string {
	const adjustedRate = showAnnual ? calculateAnnualRate(rate) : rate;
	const suffix = showAnnual ? ' (Annual)' : '';
	return adjustedRate >= 0 
		? `+${adjustedRate.toFixed(4)}%${suffix}` 
		: `${adjustedRate.toFixed(4)}%${suffix}`;
}

/**
 * Format rate from string input (for API responses)
 */
export function formatRateFromString(rate: string, showAnnual: boolean = false): string {
	const num = parseFloat(rate) || 0;
	return formatRate(num, showAnnual);
}

/**
 * Get color threshold based on whether showing annual rates
 */
export function getRateThreshold(showAnnual: boolean): number {
	return showAnnual ? 3.65 : 0.01; // 0.01% daily × 365 = 3.65% annual
}

/**
 * Get color class for rate based on threshold
 */
export function getRateColor(rate: number, showAnnual: boolean = false): string {
	const threshold = getRateThreshold(showAnnual);
	if (rate > threshold) return 'text-green-400';
	if (rate < -threshold) return 'text-red-400';
	return 'text-gray-300';
}

/**
 * Get background color class for rate based on threshold
 */
export function getRateBg(rate: number, showAnnual: boolean = false): string {
	const threshold = getRateThreshold(showAnnual);
	if (rate > threshold) return 'bg-green-900/20';
	if (rate < -threshold) return 'bg-red-900/20';
	return 'bg-gray-800/50';
}

/**
 * Format comparison rates with annual option
 */
export function formatComparisonRate(rate: number, showAnnual: boolean = false): string {
	const adjustedRate = showAnnual ? calculateAnnualRate(rate) : rate;
	const suffix = showAnnual ? ' (Annual)' : '';
	return `${adjustedRate >= 0 ? '+' : ''}${adjustedRate.toFixed(4)}%${suffix}`;
}