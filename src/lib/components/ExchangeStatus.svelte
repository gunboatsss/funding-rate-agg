<script lang="ts">
	import type { ExchangeStatus } from '$lib/types/frontend';

	interface Props {
		status: ExchangeStatus[];
	}

	let { status }: Props = $props();

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'success': return 'bg-green-500';
			case 'error': return 'bg-red-500';
			default: return 'bg-gray-500';
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'success': return 'Online';
			case 'error': return 'Error';
			default: return 'Unknown';
		}
	};

	const formatLastUpdate = (timestamp: number) => {
		const now = Date.now();
		const diff = now - timestamp;
		
		if (diff < 60000) return 'Just now';
		if (diff < 120000) return '1 min ago';
		if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
		return new Date(timestamp).toLocaleTimeString();
	};
</script>

<div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">Exchange Status</h3>
	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
		{#each status as exchange (exchange.exchange)}
			<div class="bg-gray-800 rounded-lg p-3 text-center">
				<div class="flex items-center justify-center mb-2">
					<div class="w-2 h-2 rounded-full {getStatusColor(exchange.status)}"></div>
				</div>
				<p class="text-sm font-medium text-gray-200">{exchange.exchange}</p>
				<p class="text-xs text-gray-400 mt-1">{getStatusText(exchange.status)}</p>
				<p class="text-xs text-gray-500 mt-1">{exchange.rateCount} rates</p>
				<p class="text-xs text-gray-500 mt-1">{formatLastUpdate(exchange.lastUpdate)}</p>
				{#if exchange.error}
					<p class="text-xs text-red-400 mt-1 truncate" title={exchange.error}>Error</p>
				{/if}
			</div>
		{/each}
	</div>
</div>