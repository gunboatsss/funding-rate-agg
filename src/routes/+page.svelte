<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import RatesTable from '$lib/components/RatesTable.svelte';
	import ExchangeStatus from '$lib/components/ExchangeStatus.svelte';
	import SymbolGroups from '$lib/components/SymbolGroups.svelte';
	import type { DashboardData } from '$lib/types/frontend';

	let dashboardData: DashboardData | null = $state(null);
	let exchangeStatuses: any[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedView = $state<'table' | 'symbols'>('table');
	let lastUpdate = $state<number>(Date.now());
	let refreshInterval: number | null = null;

	const fetchData = async () => {
		try {
			const [ratesResponse, statusResponse] = await Promise.all([
				fetch('/api/rates'),
				fetch('/api/status')
			]);

			if (!ratesResponse.ok || !statusResponse.ok) {
				throw new Error('Failed to fetch data');
			}

			const ratesData = await ratesResponse.json();
			const statusData = await statusResponse.json();

			exchangeStatuses = statusData.status;

			// Transform data for frontend
			const transformed: DashboardData = {
				byExchange: ratesData.byExchange, // Use rates API data for the table
				bySymbol: transformSymbolGroups(ratesData.bySymbol, statusData.status),
				totalRates: ratesData.totalRates,
				lastUpdate: ratesData.lastUpdate,
				uniqueSymbols: Object.keys(ratesData.bySymbol).sort()
			};
			dashboardData = transformed;
			lastUpdate = ratesData.lastUpdate;
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('Error fetching dashboard data:', err);
		} finally {
			loading = false;
		}
	};

	const transformSymbolGroups = (bySymbol: Record<string, any[]>, byExchange: any[]) => {
		return Object.entries(bySymbol).map(([baseAsset, exchangeData]) => {
			const validExchanges: any[] = [];
			
			exchangeData.forEach(ex => {
				if (ex.status === 'success' && ex.rates && ex.rates.length > 0) {
					ex.rates.forEach((rate: any) => {
						const rateNumeric = parseFloat(rate.estimatedFundingRate) || 0;
						validExchanges.push({
							...rate,
							exchange: ex.exchange,
							rateNumeric,
							rateFormatted: formatRate(rate.estimatedFundingRate),
							isPositive: rateNumeric > 0,
							timeUntilNextFunding: rate.nextFundingTime - Date.now(),
							lastUpdateFormatted: new Date(ex.lastUpdate || Date.now()).toLocaleTimeString()
						});
					});
				}
			});
			
			return {
				symbol: baseAsset, // Use baseAsset as the symbol since API groups by baseAsset
				baseAsset,
				exchanges: validExchanges,
				comparison: calculateComparison(baseAsset, validExchanges)
			};
		});
	};

	const formatRate = (rate: string): string => {
		const num = parseFloat(rate) || 0;
		return `${num >= 0 ? '+' : ''}${num.toFixed(4)}%`;
	};

	const calculateComparison = (baseAsset: string, exchanges: Array<any>) => {
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

			return {
				lowest: validRates[0],
				highest: validRates[validRates.length - 1],
				average: validRates.reduce((sum, item) => sum + item.rate, 0) / validRates.length,
				spread: validRates[validRates.length - 1].rate - validRates[0].rate,
				count: validRates.length
			};
		} catch (error) {
			console.warn('Error in calculateComparison:', error);
			return null;
		}
	};

	onMount(() => {
		fetchData();
		// Auto-refresh every 30 seconds
		refreshInterval = setInterval(fetchData, 30000) as unknown as number;
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});
</script>

<div class="min-h-screen bg-gray-950 text-gray-100">
	<!-- Header -->
	<header class="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center space-x-4">
					<h1 class="text-xl font-bold text-cyan-400">Funding Rate Aggregator</h1>
					<div class="flex items-center space-x-2 text-sm text-gray-400">
						<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
						<span>Live</span>
					</div>
				</div>
				
				<div class="flex items-center space-x-6">
					<!-- View Toggle -->
					<div class="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
						<button
							class="px-3 py-1.5 text-sm rounded-md transition-colors"
							class:bg-gray-700={selectedView === 'table'}
							class:text-cyan-400={selectedView === 'table'}
							class:text-gray-400={selectedView !== 'table'}
							onclick={() => selectedView = 'table'}
						>
							Rates Table
						</button>
						<button
							class="px-3 py-1.5 text-sm rounded-md transition-colors"
							class:bg-gray-700={selectedView === 'symbols'}
							class:text-cyan-400={selectedView === 'symbols'}
							class:text-gray-400={selectedView !== 'symbols'}
							onclick={() => selectedView = 'symbols'}
						>
							By Symbol
						</button>
					</div>

					<!-- Last Update -->
					<div class="text-sm text-gray-400">
						Last: {new Date(lastUpdate).toLocaleTimeString()}
					</div>

					<!-- Refresh Button -->
					<button
						class="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
						onclick={fetchData}
						disabled={loading}
						title="Refresh data"
					>
						<svg class="w-4 h-4" class:animate-spin={loading} fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if loading}
			<div class="flex items-center justify-center h-64">
				<div class="text-center">
					<div class="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p class="text-gray-400">Loading funding rates...</p>
				</div>
			</div>
		{:else if error}
			<div class="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
				<p class="font-medium mb-2">Error loading data</p>
				<p class="text-sm">{error}</p>
				<button 
					class="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md text-sm transition-colors"
					onclick={fetchData}
				>
					Retry
				</button>
			</div>
		{:else if dashboardData}
			<!-- Exchange Status Bar -->
			<div class="mb-6">
				<ExchangeStatus status={exchangeStatuses} />
			</div>

			<!-- Stats Overview -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
					<p class="text-gray-400 text-sm mb-1">Total Rates</p>
					<p class="text-2xl font-bold text-cyan-400">{dashboardData.totalRates.toLocaleString()}</p>
				</div>
				<div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
					<p class="text-gray-400 text-sm mb-1">Active Exchanges</p>
					<p class="text-2xl font-bold text-green-400">
						{dashboardData.byExchange.filter(ex => ex.status === 'success').length}/6
					</p>
				</div>
				<div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
					<p class="text-gray-400 text-sm mb-1">Symbols</p>
					<p class="text-2xl font-bold text-purple-400">{dashboardData.uniqueSymbols.length}</p>
				</div>
				<div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
					<p class="text-gray-400 text-sm mb-1">Last Update</p>
					<p class="text-lg font-mono text-yellow-400">{new Date(dashboardData.lastUpdate).toLocaleTimeString()}</p>
				</div>
			</div>

			<!-- Main View -->
			{#if selectedView === 'table'}
				<RatesTable data={dashboardData} />
			{:else}
				<SymbolGroups data={dashboardData.bySymbol} />
			{/if}
		{/if}
	</main>
</div>
