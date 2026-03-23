<script lang="ts">
	import type { DashboardData } from '$lib/types/frontend';
	import { normalizeFromHourly, formatRate, getRateColor, getRateBg, getPeriodLabel, type RatePeriod } from '$lib/utils/rate-calculations';

	interface Props {
		data: DashboardData;
	}

	let { data }: Props = $props();

	let sortKey = $state<'exchange' | 'symbol' | 'rate' | 'lastUpdate'>('symbol');
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let filterExchange = $state<string>('all');
	let filterBaseAsset = $state<string>('all');
	let selectedPeriod = $state<RatePeriod>('1h');

	// Get all unique base assets - using $derived for proper reactivity
	let uniqueBaseAssets = $derived(() => {
		if (!data?.byExchange || data?.byExchange?.length === 0) return [];
		
		const assets = new Set<string>();
		data.byExchange.forEach(exchange => {
			if (exchange.status === 'success' && exchange.rates) {
				exchange.rates.forEach(rate => {
					assets.add(rate.baseAsset);
				});
			}
		});
		return Array.from(assets).sort();
	});

	// Flatten all rates for table view - using $derived for proper reactivity
	let allRates = $derived(() => {
		if (!data?.byExchange || data?.byExchange?.length === 0) {
			return [];
		}
		
		const rates: Array<{
			exchange: string;
			symbol: string;
			baseAsset: string;
			rateNumeric: number;
			rateFormatted: string;
			isPositive: boolean;
			timeUntilNextFunding: number;
			lastUpdateFormatted: string;
			lastSettlementRate: string;
			nextFundingTime: number;
			_uniqueId: number;
		}> = [];
		
		let totalProcessed = 0;
		data.byExchange.forEach(exchange => {
			if (exchange.status === 'success' && exchange.rates) {
				exchange.rates.forEach(rate => {
					totalProcessed++;
					const rateNumeric = parseFloat(rate.estimatedFundingRate) || 0;
					const adjustedRateNumeric = normalizeFromHourly(rateNumeric, selectedPeriod);
					rates.push({
						exchange: exchange.exchange,
						symbol: rate.symbol,
						baseAsset: rate.baseAsset,
						rateNumeric: adjustedRateNumeric,
						rateFormatted: formatRate(rateNumeric, selectedPeriod),
						isPositive: rateNumeric > 0,
						timeUntilNextFunding: rate.nextFundingTime - Date.now(),
						lastUpdateFormatted: new Date(exchange.lastUpdate).toLocaleTimeString(),
						lastSettlementRate: rate.lastSettlementRate,
						nextFundingTime: rate.nextFundingTime,
						_uniqueId: totalProcessed
					});
				});
			}
		});
		
		return rates;
	});

	// Filter and sort rates - using $derived for proper reactivity
	let filteredRates = $derived(() => {
		let filtered = allRates();

		// Apply filters
		if (filterExchange !== 'all') {
			filtered = filtered.filter(rate => rate.exchange === filterExchange);
		}
		if (filterBaseAsset !== 'all') {
			filtered = filtered.filter(rate => rate.baseAsset === filterBaseAsset);
		}

		// Apply sorting
		filtered.sort((a, b) => {
			switch (sortKey) {
				case 'exchange': {
					const exchangeComparison = a.exchange.localeCompare(b.exchange);
					return sortDirection === 'asc' ? exchangeComparison : -exchangeComparison;
				}
				case 'symbol': {
					const symbolComparison = a.symbol.localeCompare(b.symbol);
					return sortDirection === 'asc' ? symbolComparison : -symbolComparison;
				}
				case 'rate':
					return sortDirection === 'asc' 
						? a.rateNumeric - b.rateNumeric 
						: b.rateNumeric - a.rateNumeric;
				case 'lastUpdate':
					return sortDirection === 'asc' 
						? a.nextFundingTime - b.nextFundingTime 
						: b.nextFundingTime - a.nextFundingTime;
				default:
					return 0;
			}
		});

		return filtered;
	});

	const handleSort = (key: typeof sortKey) => {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}
	};

	
</script>

<div class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
	<!-- Filters -->
	<div class="p-4 border-b border-gray-800 bg-gray-800/30">
		<div class="flex flex-wrap gap-4 items-center">
			<div class="flex items-center space-x-2">
				<label for="exchange-filter" class="text-sm text-gray-400">Exchange:</label>
				<select 
					id="exchange-filter"
					bind:value={filterExchange}
					class="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
				>
					<option value="all">All Exchanges</option>
					{#each data.byExchange as exchange (exchange.exchange)}
						<option value={exchange.exchange}>{exchange.exchange}</option>
					{/each}
				</select>
			</div>
			
			<div class="flex items-center space-x-2">
				<label for="baseasset-filter" class="text-sm text-gray-400">Base Asset:</label>
				<select 
					id="baseasset-filter"
					bind:value={filterBaseAsset}
					class="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
				>
					<option value="all">All Base Assets</option>
					{#each uniqueBaseAssets() as baseAsset (baseAsset)}
						<option value={baseAsset}>{baseAsset}</option>
					{/each}
				</select>
			</div>

			<div class="flex items-center space-x-3">
				<div class="flex items-center space-x-2">
					<label for="period-select" class="text-sm text-gray-400">Period:</label>
					<select
						id="period-select"
						bind:value={selectedPeriod}
						class="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
					>
						<option value="1h">1H</option>
						<option value="8h">8H</option>
						<option value="1d">1D</option>
						<option value="365d">365D</option>
					</select>
				</div>
				
				<div class="text-sm text-gray-400">
					Showing {filteredRates().length} of {allRates().length} rates
				</div>
			</div>
		</div>
	</div>

	<!-- Table -->
	<div class="overflow-x-auto">
		<table class="w-full">
			<thead class="bg-gray-800/50 border-b border-gray-700">
				<tr>
					<th class="px-4 py-3 text-left">
						<button 
							class="flex items-center space-x-1 text-xs font-medium text-gray-300 hover:text-cyan-400 transition-colors"
							onclick={() => handleSort('exchange')}
						>
							<span>Exchange</span>
							{#if sortKey === 'exchange'}
								<span class="text-cyan-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3 text-left">
						<button 
							class="flex items-center space-x-1 text-xs font-medium text-gray-300 hover:text-cyan-400 transition-colors"
							onclick={() => handleSort('symbol')}
						>
							<span>Symbol</span>
							{#if sortKey === 'symbol'}
								<span class="text-cyan-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3 text-left">
						<button 
							class="flex items-center space-x-1 text-xs font-medium text-gray-300 hover:text-cyan-400 transition-colors"
							onclick={() => handleSort('rate')}
						>
							<span>Funding Rate ({getPeriodLabel(selectedPeriod)})</span>
							{#if sortKey === 'rate'}
								<span class="text-cyan-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</button>
					</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-300">Base Asset</th>
					<th class="px-4 py-3 text-left text-xs font-medium text-gray-300">Next Funding</th>
					<th class="px-4 py-3 text-left">
						<button 
							class="flex items-center space-x-1 text-xs font-medium text-gray-300 hover:text-cyan-400 transition-colors"
							onclick={() => handleSort('lastUpdate')}
						>
							<span>Last Update</span>
							{#if sortKey === 'lastUpdate'}
								<span class="text-cyan-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</button>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-800">
				{#each filteredRates() as rate (rate._uniqueId)}
					<tr class="hover:bg-gray-800/30 transition-colors">
						<td class="px-4 py-3">
							<div class="flex items-center space-x-2">
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
								<span class="text-sm font-medium text-gray-200">{rate.exchange}</span>
							</div>
						</td>
						<td class="px-4 py-3">
							<span class="text-sm font-mono text-cyan-400">{rate.symbol}</span>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center space-x-2">
							<span class="text-sm font-mono {getRateColor(rate.rateNumeric, selectedPeriod)}">
								{rate.rateFormatted}
							</span>
							<div class="w-12 h-6 rounded {getRateBg(rate.rateNumeric, selectedPeriod)} flex items-center justify-center">
									<div 
										class="w-1 h-4 rounded-full"
										class:bg-green-400={rate.rateNumeric > 0}
										class:bg-red-400={rate.rateNumeric < 0}
										class:bg-gray-400={rate.rateNumeric === 0}
									></div>
								</div>
							</div>
						</td>
						<td class="px-4 py-3">
							<span class="text-sm text-gray-300">{rate.baseAsset}</span>
						</td>
						<td class="px-4 py-3">
							<span class="text-sm text-gray-300">
								{rate.exchange === "Paradex" 
									? "N/A" 
									: rate.timeUntilNextFunding > 0 
										? `${Math.floor(rate.timeUntilNextFunding / (1000 * 60))}m`
										: "Soon"
								}
							</span>
						</td>
						<td class="px-4 py-3">
							<span class="text-sm text-gray-400">{rate.lastUpdateFormatted}</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if filteredRates().length === 0}
			<div class="text-center py-8">
				<p class="text-gray-400">No rates found matching the current filters.</p>
			</div>
		{/if}
	</div>
</div>
