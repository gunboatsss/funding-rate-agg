# AGENTS.md

## Project Overview

Funding Rate Aggregator - A Svelte 5 + SvelteKit dashboard for aggregating and comparing funding rates from multiple cryptocurrency derivatives exchanges (Nado, Derive, Paradex, Ethereal, Lighter, Synthetix).

## Build Commands

```bash
# Development
bun run dev              # Start dev server on http://localhost:5173
npm run dev              # Alternative using npm

# Production
bun run build            # Build for production
bun run preview          # Preview production build locally

# Type checking
bun run check            # Run svelte-check once
bun run check:watch      # Run svelte-check in watch mode

# Linting
bun run lint             # Run ESLint on entire project
```

## Test Commands

```bash
# Run all e2e tests
bun run test             # Alias for test:e2e
bun run test:e2e         # Run all Playwright tests

# Run single test file
bun test e2e/nado.test.ts                    # Run specific test with Bun
npx playwright test e2e/nado.test.ts         # Run specific test with Playwright

# Run tests matching pattern
npx playwright test --grep "funding rates"   # Run tests matching pattern
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - Always define types explicitly
- Use `import type` for type-only imports
- Prefer `interface` over `type` for object shapes
- Use literal unions for finite sets: `type Status = 'success' | 'error'`
- Always handle errors explicitly using Effect.catchAll

### Imports

```typescript
// Group imports: external libs → effect → internal modules
import { Effect, pipe, Schema } from "effect";
import { FundingRate } from "../types";
import { cachedExchangeCall } from "../cache";

// Type imports
import type { DashboardData } from '$lib/types/frontend';
```

### Naming Conventions

- **Functions**: camelCase (`getAllFundingRates`, `calculateAnnualRate`)
- **Components**: PascalCase (`RatesTable.svelte`, `ExchangeStatus.svelte`)
- **Types/Interfaces**: PascalCase (`FundingRate`, `ExchangeData`)
- **Constants**: camelCase (`exchangeCacheConfig`, `NADO_API`)
- **Files**: kebab-case for utilities (`rate-calculations.ts`), PascalCase for components
- **Effect pipelines**: Use `pipe()` with proper indentation

### Formatting

- Use tabs for indentation
- Double quotes for strings
- Trailing commas in objects and arrays
- Max line length: ~100 characters
- Always use semicolons

### Svelte 5 Conventions

```svelte
<script lang="ts">
	// Use runes for reactivity
	let sortKey = $state<'exchange' | 'symbol'>('symbol');
	let filteredRates = $derived(() => { ... });
	
	// Props with interface
	interface Props {
		data: DashboardData;
	}
	let { data }: Props = $props();
</script>
```

### Effect Library Patterns

```typescript
// Always wrap API calls in Effect.tryPromise
const fetchData = (): Effect.Effect<Data, Error> =>
    pipe(
        Effect.tryPromise({
            try: () => fetch('/api').then(r => r.json()),
            catch: (error) => new Error(`Fetch failed: ${error}`)
        }),
        Effect.flatMap((data) => Schema.decodeUnknown(Schema)(data)),
        Effect.catchAll(() => Effect.succeed(defaultValue))
    );

// Use concurrency for parallel operations
Effect.all([task1, task2], { concurrency: 2 });

// Always handle errors at the edge
Effect.catchAll(error => Effect.succeed(fallback));
```

### Error Handling

- Use Effect for all async operations
- Provide meaningful error messages with context
- Always have fallback values using `Effect.catchAll`
- Log warnings for non-fatal errors: `console.warn('Context:', error)`

### Schema Validation (Effect.Schema)

```typescript
export const FundingRate = Schema.Struct({
    symbol: Schema.String,
    estimatedFundingRate: Schema.String,
    // Use Schema.Union for nullable fields
    maxOpenInterest: Schema.Union(Schema.String, Schema.Null),
});

export type FundingRate = Schema.Schema.Type<typeof FundingRate>;
```

### Funding Rate Normalization

All exchange APIs return funding rates in different intervals. We normalize all rates to **hourly** on ingestion:

**Exchange Intervals:**
- **Nado**: 24-hour rate → divide by 24
- **Derive**: 1-hour rate → no change
- **Paradex**: Variable (from `funding_period_hours`) → divide by period hours
- **Ethereal**: 1-hour rate → no change  
- **Lighter**: 1-hour rate → no change
- **Synthetix**: 1-hour rate → no change

**Display Normalization:**
```typescript
// All rates stored as hourly internally
type RatePeriod = '1h' | '8h' | '1d' | '365d';

// Normalize hourly rate to display period
export function normalizeFromHourly(hourlyRate: number, period: RatePeriod): number {
    const multipliers = { '1h': 1, '8h': 8, '1d': 24, '365d': 8760 };
    return hourlyRate * multipliers[period];
}
```

Frontend displays rates normalized to user-selected period (1H/8H/1D/365D).

### Caching

- Use `cachedExchangeCall()` for all exchange API calls
- Default TTL: 30 seconds for funding rates, 2 minutes for markets
- Cache keys: `${exchangeName}-${dataType}-${identifier}`

### Styling (Tailwind CSS)

- Dark theme colors: `gray-950` (bg), `gray-900` (cards), `cyan-400` (accent)
- Positive rates: `green-400`, Negative rates: `red-400`
- Use arbitrary values sparingly: `bg-gray-800/50`

### File Structure

```
src/
├── lib/
│   ├── components/        # Svelte components (.svelte)
│   ├── services/          # Business logic
│   │   ├── exchanges/     # Exchange API integrations
│   │   ├── types.ts       # Core types with schemas
│   │   ├── aggregator.ts  # Data aggregation
│   │   └── cache.ts       # Caching utilities
│   ├── types/             # Additional type definitions
│   └── utils/             # Utility functions
├── routes/                # SvelteKit routes
│   ├── api/               # API endpoints (+server.ts)
│   └── +page.svelte       # Main dashboard
└── app.d.ts               # Global type declarations
```

### Testing

- Use Bun's test runner: `import { describe, it, expect } from "bun:test"`
- Tests located in `/e2e/` directory
- Test exchange integrations individually
- Use `Effect.runPromise()` to execute effects in tests

### Environment

- Package manager: Bun (preferred) or npm
- Node version: Latest LTS
- TypeScript: Strict mode with bundler module resolution
