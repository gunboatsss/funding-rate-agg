<script lang="ts">
	import type { SymbolGroup } from '$lib/types/frontend';

	interface Props {
		data: SymbolGroup[];
	}

	let { data }: Props = $props();

	let expandedSymbols = $state<Set<string>>(new Set());
	let sortBy = $state<'symbol' | 'spread' | 'avgRate'>('symbol');
	let sortOrder = $state<'asc' | 'desc'>('asc');

	const toggleSymbol = (symbol: string) => {
		if (expandedSymbols.has(symbol)) {
			expandedSymbols.delete(symbol);
		} else {
			expandedSymbols.add(symbol);
		}
		expandedSymbols = new Set(expandedSymbols); // Trigger reactivity
	};

	const sortedData = $derived(() => {
		const sorted = [...data];
		
		sorted.sort((a, b) => {
			let aVal: string | number, bVal: string | number;
			
			switch (sortBy) {
				case 'symbol':
					aVal = a.symbol;
					bVal = b.symbol;
					break;
				case 'spread':
					aVal = a.comparison?.spread || 0;
					bVal = b.comparison?.spread || 0;
					break;
				case 'avgRate':
					aVal = a.comparison?.average || 0;
					bVal = b.comparison?.average || 0;
					break;
			}

			if (typeof aVal === 'string') {
				return sortOrder === 'asc' 
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			} else {
				return sortOrder === 'asc' 
					? aVal - bVal
					: bVal - aVal;
			}
		});

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

	const getRateColor = (rate: number) => {
		if (rate > 0.01) return 'text-green-400';
		if (rate < -0.01) return 'text-red-400';
		return 'text-gray-300';
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
</script>

<div class="space-y-4">
	<!-- Sort Controls -->
	<div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-medium text-gray-400">Symbol Groups ({data.length})</h3>
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
					class:bg-gray-700={sortBy === 'avgRate'}
					class:text-cyan-400={sortBy === 'avgRate'}
					class:text-gray-400={sortBy !== 'avgRate'}
					onclick={() => handleSort('avgRate')}
				>
					Avg Rate
					{#if sortBy === 'avgRate'}
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
						<div class="flex items-center space-x-4 text-sm">
							<div class="flex items-center space-x-1">
								<span class="text-gray-400">Spread:</span>
								<span class="font-mono {getSpreadColor(symbolGroup.comparison.spread)}">
									{symbolGroup.comparison.spread.toFixed(4)}%
								</span>
							</div>
							<div class="flex items-center space-x-1">
								<span class="text-gray-400">Avg:</span>
								<span class="font-mono {getRateColor(symbolGroup.comparison.average)}">
									{(symbolGroup.comparison.average >= 0 ? '+' : '')}{symbolGroup.comparison.average.toFixed(4)}%
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
								{symbolGroup.comparison.lowest.rate >= 0 ? '+' : ''}{symbolGroup.comparison.lowest.rate.toFixed(3)}%
							</span>
						</div>
						<div class="flex items-center space-x-1">
							<span class="text-gray-500">High:</span>
							<span class="text-red-400">{symbolGroup.comparison.highest.exchange}</span>
							<span class="font-mono text-red-400">
								{symbolGroup.comparison.highest.rate >= 0 ? '+' : ''}{symbolGroup.comparison.highest.rate.toFixed(3)}%
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
									<th class="px-4 py-2 text-left text-xs font-medium text-gray-400">Last Settlement</th>
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
											<span class="text-sm font-mono {getRateColor(exchange.rateNumeric)}">
												{exchange.rateFormatted}
											</span>
										</td>
										<td class="px-4 py-2">
											<span class="text-sm text-gray-300">{exchange.lastSettlementRate}</span>
										</td>
										<td class="px-4 py-2">
											<span class="text-sm text-gray-300">
												{exchange.timeUntilNextFunding > 0 
													? formatTime(exchange.timeUntilNextFunding)
													: 'Soon'
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

	{#if data.length === 0}
		<div class="text-center py-8">
			<p class="text-gray-400">No symbol data available.</p>
		</div>
	{/if}
</div>