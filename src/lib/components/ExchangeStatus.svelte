<script lang="ts">
	import type { ExchangeStatus } from "$lib/types/frontend";

	interface Props {
		status: ExchangeStatus[];
	}

	let { status }: Props = $props();

	const STALE_THRESHOLD = 60000;

	const getStatusColor = (exchangeStatus: string, lastUpdate: number) => {
		const isStale = Date.now() - lastUpdate > STALE_THRESHOLD;
		if (exchangeStatus === "error") return "bg-red-500";
		if (isStale) return "bg-yellow-500";
		return "bg-green-500";
	};

	const getStatusText = (exchangeStatus: string) => {
		switch (exchangeStatus) {
			case "success":
				return "Online";
			case "error":
				return "Offline";
			default:
				return "Unknown";
		}
	};

	const formatLastUpdate = (timestamp: number) => {
		const now = Date.now();
		const diff = now - timestamp;

		if (diff < 60000) return "Just now";
		if (diff < 120000) return "1 min ago";
		if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
		return new Date(timestamp).toLocaleTimeString();
	};

	const isStale = (timestamp: number) => {
		return Date.now() - timestamp > STALE_THRESHOLD;
	};

	const truncateError = (error: string | undefined, maxLength = 30) => {
		if (!error) return "";
		return error.length > maxLength ? error.slice(0, maxLength) + "..." : error;
	};
</script>

<div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
	<h3 class="text-sm font-medium text-gray-400 mb-3">Exchange Status</h3>
	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
		{#each status as exchange (exchange.exchange)}
			{@const stale = isStale(exchange.lastUpdate)}
			<div
				class="bg-gray-800 rounded-lg p-3 text-center border"
				class:border-red-800={exchange.status === "error"}
				class:border-yellow-800={stale && exchange.status === "success"}
				class:border-gray-700={!stale && exchange.status === "success"}
			>
				<div class="flex items-center justify-center mb-2">
					<div
						class="w-2 h-2 rounded-full {getStatusColor(
							exchange.status,
							exchange.lastUpdate
						)}"
						class:animate-pulse={exchange.status === "error"}
					></div>
				</div>
				<p class="text-sm font-medium text-gray-200">{exchange.exchange}</p>
				<p class="text-xs mt-1" class:text-green-400={exchange.status === "success" && !stale} class:text-yellow-400={stale} class:text-red-400={exchange.status === "error"}>
					{getStatusText(exchange.status)}
				</p>
				<p class="text-xs text-gray-500 mt-1">
					{exchange.rateCount} rates
				</p>
				<p class="text-xs text-gray-500 mt-1" class:text-yellow-500={stale}>
					{formatLastUpdate(exchange.lastUpdate)}
				</p>
				{#if exchange.error}
					<p
						class="text-xs text-red-400 mt-1 truncate cursor-help"
						title={exchange.error}
					>
						{truncateError(exchange.error)}
					</p>
				{:else if stale}
					<p class="text-xs text-yellow-500 mt-1">Stale</p>
				{/if}
			</div>
		{/each}
	</div>
</div>
