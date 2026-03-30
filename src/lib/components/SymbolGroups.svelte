<script lang="ts">
	import type { DashboardData, SymbolGroup, ExchangeData, RateDisplay } from '$lib/types/frontend';
	import type { FundingRate } from '$lib/services/types';
	import { formatRateFromString, getRateColor, formatComparisonRate, normalizeFromHourly, type RatePeriod } from '$lib/utils/rate-calculations';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		data: DashboardData;
	}

	let { data }: Props = $props();
	
	let expandedSymbols = new SvelteSet<string>();
	let selectedExchanges = new SvelteSet<string>();

	let sortBy = $state<'symbol' | 'spread' | 'medianRate'>('symbol');
	let sortOrder = $state<'asc' | 'desc'>('asc');
	let selectedPeriod = $state<RatePeriod>('1h');

	// Get unique exchanges from data
	let availableExchanges = $derived.by(() => {
		if (!data?.byExchange) return [];
		return data.byExchange
			.filter(ex => ex.status === 'success' && ex.rates.length > 0)
			.map(ex => ex.exchange)
			.sort();
	});

	const toggleExchange = (exchange: string) => {
		if (selectedExchanges.has(exchange)) {
			selectedExchanges.delete(exchange);
		} else {
			selectedExchanges.add(exchange);
		}
	};

	const clearExchangeFilter = () => {
		selectedExchanges.clear();
	};

	// Aggregate bySymbol data from ExchangeData - moved from parent component
	let symbolGroups: SymbolGroup[] = $derived.by(() => {
		if (!data?.byExchange) return [];
		
		return aggregateBySymbol(data.byExchange);
	});

const toggleSymbol = (symbol: string) => {
		if (expandedSymbols.has(symbol)) {
			expandedSymbols.delete(symbol);
		} else {
			expandedSymbols.add(symbol);
		}
	};

	const sortedData: SymbolGroup[] = $derived.by(() => {
		let filtered = [...symbolGroups];
		
		// Apply exchange filter
		if (selectedExchanges.size > 0) {
			filtered = filtered.filter(group => 
				group.exchanges.some(ex => selectedExchanges.has(ex.exchange))
			);
		}
		
		const sorted = filtered;
		
		sorted.sort((a, b) => {
			switch (sortBy) {
				case 'symbol': {
					const symbolComparison = a.symbol.localeCompare(b.symbol);
					return sortOrder === 'asc' ? symbolComparison : -symbolComparison;
				}
				case 'spread': {
					const aSpread = normalizeFromHourly(a.comparison?.spread || 0, selectedPeriod);
					const bSpread = normalizeFromHourly(b.comparison?.spread || 0, selectedPeriod);
					return sortOrder === 'asc' ? aSpread - bSpread : bSpread - aSpread;
				}
				case 'medianRate': {
					const aMedian = a.comparison?.median || 0;
					const bMedian = b.comparison?.median || 0;
					return sortOrder === 'asc' ? aMedian - bMedian : bMedian - aMedian;
				}
				default:
					return 0;
			}
		});
		console.log(sorted);
		return sorted;
	});

	const handleSort = (key: typeof sortBy) => {
		if (sortBy === key) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = key;
			sortOrder = 'asc';
		}
	};

	

	const getSpreadColor = (spread: number) => {
		if (spread > 0.05) return 'text-orange-400';
		if (spread > 0.02) return 'text-yellow-400';
		return 'text-gray-400';
	};

	const formatTime = (ms: number) => {
		if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
		return `${Math.floor(ms / 60000)}m`;
	};

	// Aggregation functions moved from parent component
	const aggregateBySymbol = (byExchange: ExchangeData[]): SymbolGroup[] => {
		const baseAssetMap: Record<string, Array<{exchange: string, rates: FundingRate[], lastUpdate: number}>> = {};
		
		byExchange.forEach(exchange => {
			if (exchange.status === 'success') {
				exchange.rates.forEach((rate: FundingRate) => {
					const baseAsset = rate.baseAsset;
					if (!baseAssetMap[baseAsset]) {
						baseAssetMap[baseAsset] = [];
					}
					// Check if this exchange is already added for this baseAsset
					const existingExchange = baseAssetMap[baseAsset].find((ex) => ex.exchange === exchange.exchange);
					if (existingExchange) {
						existingExchange.rates.push(rate);
					} else {
						baseAssetMap[baseAsset].push({
							exchange: exchange.exchange,
							rates: [rate],
							lastUpdate: exchange.lastUpdate
						});
					}
				});
			}
		});
		
		return Object.entries(baseAssetMap).map(([baseAsset, exchangeData]) => {
			const validExchanges: RateDisplay[] = [];
			
			exchangeData.forEach((ex) => {
				if (ex.rates && ex.rates.length > 0) {
					ex.rates.forEach((rate: FundingRate) => {
						const rateNumeric = parseFloat(rate.estimatedFundingRate) || 0;
						validExchanges.push({
							...rate,
							exchange: ex.exchange,
							rateNumeric,
							rateFormatted: formatRateFromString(rate.estimatedFundingRate, selectedPeriod),
							isPositive: rateNumeric > 0,
							timeUntilNextFunding: rate.nextFundingTime - Date.now(),
							lastUpdateFormatted: new Date(ex.lastUpdate || Date.now()).toLocaleTimeString()
						});
					});
				}
			});
			
			return {
				symbol: baseAsset, // Use baseAsset as the symbol since we group by baseAsset
				baseAsset,
				exchanges: validExchanges,
				comparison: calculateComparison(baseAsset, validExchanges)
			};
		});
	};

	

	const calculateComparison = (baseAsset: string, exchanges: RateDisplay[]) => {
		try {
			if (exchanges.length === 0) return null;

			const validRates = exchanges
				.map(ex => ({
					exchange: ex.exchange,
					rate: ex.rateNumeric || 0,
					lastUpdate: Date.now()
				}))
				.filter(item => !isNaN(item.rate));

			if (validRates.length === 0) return null;

			validRates.sort((a, b) => a.rate - b.rate);

			const mid = Math.floor(validRates.length / 2);
			const median = validRates.length % 2 !== 0
				? validRates[mid].rate
				: (validRates[mid - 1].rate + validRates[mid].rate) / 2;

			return {
				lowest: validRates[0],
				highest: validRates[validRates.length - 1],
				median,
				spread: validRates[validRates.length - 1].rate - validRates[0].rate,
				count: validRates.length
			};
		} catch (error) {
			console.warn('Error in calculateComparison:', error);
			return null;
		}
	};

	
</script>

<div class="space-y-4">
	<!-- Sort Controls -->
	<div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<h3 class="text-sm font-medium text-gray-400">
					Symbol Groups ({sortedData.length}
					{#if selectedExchanges.size > 0}
						<span class="text-cyan-400">/ {symbolGroups.length}</span>
					{/if})
				</h3>
				
				<!-- Exchange Filter -->
				<div class="flex items-center space-x-2">
					<label for="exchange-filter-symbols" class="text-sm text-gray-400">Exchange:</label>
					<div class="relative inline-block">
						<select
							id="exchange-filter-symbols"
							onchange={(e) => {
								const value = (e.target as HTMLSelectElement).value;
								if (value === 'clear') {
									clearExchangeFilter();
								} else if (value !== '') {
									toggleExchange(value);
									(e.target as HTMLSelectElement).value = '';
								}
							}}
							class="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
						>
							<option value="">
								{selectedExchanges.size === 0 ? 'All' : `${selectedExchanges.size} selected`}
							</option>
							{#if selectedExchanges.size > 0}
								<option value="clear">Clear filter</option>
							{/if}
							{#each availableExchanges as exchange (exchange)}
								<option value={exchange}>{exchange}</option>
							{/each}
						</select>
					</div>
					{#if selectedExchanges.size > 0}
						<div class="flex flex-wrap gap-1">
							{#each Array.from(selectedExchanges) as exchange (exchange)}
								<button
									class="px-2 py-0.5 text-xs bg-cyan-900 text-cyan-400 rounded hover:bg-cyan-800 transition-colors"
									onclick={() => toggleExchange(exchange)}
								>
									{exchange} ×
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<div class="flex items-center space-x-2">
					<label for="period-select-symbols" class="text-sm text-gray-400">Period:</label>
					<select
						id="period-select-symbols"
						bind:value={selectedPeriod}
						class="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
					>
						<option value="1h">1H</option>
						<option value="8h">8H</option>
						<option value="1d">1D</option>
						<option value="365d">365D</option>
					</select>
				</div>
			</div>
			<div class="flex space-x-2">
				<button
					class="px-3 py-1 text-xs rounded-md transition-colors"
					class:bg-gray-700={sortBy === 'symbol'}
					class:text-cyan-400={sortBy === 'symbol'}
					class:text-gray-400={sortBy !== 'symbol'}
					onclick={() => handleSort('symbol')}
				>
					Symbol
					{#if sortBy === 'symbol'}
						<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</button>
				<button
					class="px-3 py-1 text-xs rounded-md transition-colors"
					class:bg-gray-700={sortBy === 'spread'}
					class:text-cyan-400={sortBy === 'spread'}
					class:text-gray-400={sortBy !== 'spread'}
					onclick={() => handleSort('spread')}
				>
					Spread
					{#if sortBy === 'spread'}
						<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</button>
				<button
					class="px-3 py-1 text-xs rounded-md transition-colors"
					class:bg-gray-700={sortBy === 'medianRate'}
					class:text-cyan-400={sortBy === 'medianRate'}
					class:text-gray-400={sortBy !== 'medianRate'}
					onclick={() => handleSort('medianRate')}
				>
					Median Rate
					{#if sortBy === 'medianRate'}
						<span class="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Symbol Groups -->
	{#each sortedData as symbolGroup (symbolGroup.symbol)}
		<div class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
			<!-- Symbol Header -->
			<button
				class="w-full p-4 bg-gray-800/30 hover:bg-gray-800/50 transition-colors flex items-center justify-between"
				onclick={() => toggleSymbol(symbolGroup.symbol)}
			>
				<div class="flex items-center space-x-4">
					<div class="flex items-center space-x-2">
						<svg 
							class="w-4 h-4 text-gray-400 transition-transform"
							class:rotate-90={expandedSymbols.has(symbolGroup.symbol)}
							fill="none" 
							stroke="currentColor" 
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
						<span class="text-lg font-bold text-cyan-400">{symbolGroup.symbol}</span>
						<span class="text-sm text-gray-400">({symbolGroup.baseAsset})</span>
					</div>
					
					{#if symbolGroup.comparison}
						{@const adjustedSpread = normalizeFromHourly(symbolGroup.comparison.spread, selectedPeriod)}
						<div class="flex items-center space-x-4 text-sm">
							<div class="flex items-center space-x-1">
								<span class="text-gray-400">Spread:</span>
								<span class="font-mono {getSpreadColor(adjustedSpread)}">
									{adjustedSpread.toFixed(4)}%
								</span>
							</div>
							<div class="flex items-center space-x-1">
								<span class="text-gray-400">Median:</span>
							<span class="font-mono {getRateColor(symbolGroup.comparison.median, selectedPeriod)}">
								{formatComparisonRate(symbolGroup.comparison.median, selectedPeriod)}
								</span>
							</div>
							<div class="flex items-center space-x-1">
								<span class="text-gray-400">Exchanges:</span>
								<span class="text-gray-300">{symbolGroup.comparison.count}</span>
							</div>
						</div>
					{/if}
				</div>

				{#if symbolGroup.comparison}
					<div class="flex items-center space-x-3 text-xs">
						<div class="flex items-center space-x-1">
							<span class="text-gray-500">Low:</span>
							<span class="text-green-400">{symbolGroup.comparison.lowest.exchange}</span>
							<span class="font-mono text-green-400">
								{formatComparisonRate(symbolGroup.comparison.lowest.rate, selectedPeriod)}
							</span>
						</div>
						<div class="flex items-center space-x-1">
							<span class="text-gray-500">High:</span>
							<span class="text-red-400">{symbolGroup.comparison.highest.exchange}</span>
							<span class="font-mono text-red-400">
								{formatComparisonRate(symbolGroup.comparison.highest.rate, selectedPeriod)}
							</span>
						</div>
					</div>
				{/if}
			</button>

			<!-- Exchange Details (Expanded) -->
			{#if expandedSymbols.has(symbolGroup.symbol)}
				<div class="border-t border-gray-800">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-gray-800/50">
								<tr>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-400">Exchange</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-400">Rate</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-400">Next Funding</th>
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-400">Updated</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-800/50">
								{#each symbolGroup.exchanges as exchange (exchange.exchange)}
									<tr class="hover:bg-gray-800/30">
										<td class="px-4 py-2">
											<div class="flex items-center space-x-2">
												<div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
												<span class="text-sm text-gray-200">{exchange.exchange}</span>
											</div>
										</td>
										<td class="px-4 py-2">
<span class="text-sm font-mono {getRateColor(exchange.rateNumeric, selectedPeriod)}">
											{exchange.rateFormatted}
										</span>
										</td>
										<td class="px-4 py-2">
											<span class="text-sm text-gray-300">
												{exchange.exchange === "Paradex" 
													? "N/A" 
													: exchange.timeUntilNextFunding > 0 
														? formatTime(exchange.timeUntilNextFunding)
														: "Soon"
												}
											</span>
										</td>
										<td class="px-4 py-2">
											<span class="text-sm text-gray-400">{exchange.lastUpdateFormatted}</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/each}

	{#if symbolGroups.length === 0}
		<div class="text-center py-8">
			<p class="text-gray-400">No symbol data available.</p>
		</div>
	{/if}
</div>