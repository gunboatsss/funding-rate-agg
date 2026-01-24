# Funding Rate Aggregator Frontend

A modern trading terminal-style dashboard for aggregating and comparing funding rates from multiple cryptocurrency derivatives exchanges.

## Features

### 🔄 Real-time Data
- Auto-refreshes every 30 seconds
- Live status indicators for all exchanges
- Manual refresh capability
- Connection status monitoring

### 📊 Multiple View Modes
- **Rates Table**: Sortable, filterable table with all rates
- **Symbol Groups**: Group by symbol with detailed comparison views

### 🎯 Advanced Filtering & Sorting
- Filter by exchange or symbol
- Sort by rate, symbol, exchange, or last update
- Real-time filtering with instant results

### 📈 Rate Comparison
- Best/worst rates for each symbol
- Spread analysis
- Average rate calculations
- Exchange-specific comparisons

### 🎨 Trading Terminal Design
- Dark theme optimized for extended viewing
- Color-coded rates (green for positive, red for negative)
- Professional trading interface aesthetics
- Responsive design for all devices

### 📡 Exchange Integrations
- **Nado**: 19 perpetual products
- **Derive**: BTC, ETH, SOL perpetuals
- **Paradex**: Multiple derivatives
- **Ethereal**: Perpetual futures
- **Lighter**: Perpetual trading
- **Synthetix**: Synthetic assets

## Data Structure

### Rate Information
- Symbol and base asset
- Current funding rate
- Last settlement rate
- Next funding time
- Funding interval
- Exchange-specific metadata

### Status Monitoring
- Exchange API status
- Last update timestamps
- Rate count per exchange
- Error handling and fallbacks

## Technical Implementation

### Frontend Stack
- **Svelte 5**: Latest Svelte version with runes
- **SvelteKit**: Full-stack framework
- **Tailwind CSS**: Utility-first styling
- **Effect**: Functional programming for data handling

### State Management
- `$state`: Reactive state for UI
- `$derived`: Computed values
- Auto-refresh intervals
- Error boundary handling

### API Architecture
- `/api/rates`: Aggregated funding rates
- `/api/status`: Exchange status information
- Graceful error handling
- Performance optimized caching

## Usage

1. **Start Development Server**
   ```bash
   bunx vite dev
   # or
   npm run dev
   ```

2. **View Dashboard**
   Navigate to `http://localhost:5173`

3. **Switch Views**
   - Use view toggle for Table/Symbol views
   - Apply filters using dropdowns
   - Sort by clicking column headers

4. **Monitor Status**
   - Exchange status indicators in header bar
   - Color-coded rate indicators
   - Last update timestamps

## File Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── RatesTable.svelte      # Main rates table
│   │   ├── ExchangeStatus.svelte  # Status indicators
│   │   └── SymbolGroups.svelte    # Symbol grouping view
│   ├── services/
│   │   ├── aggregator.ts          # Data aggregation
│   │   └── exchanges/             # Exchange integrations
│   └── types/
│       ├── frontend.ts            # Frontend types
│       └── types.ts              # Core types
├── routes/
│   ├── api/
│   │   ├── rates/+server.ts       # Rates API
│   │   └── status/+server.ts      # Status API
│   └── +page.svelte              # Main dashboard
```

## Performance Features

- **Caching**: 30-second cache for funding rates
- **Concurrency**: Parallel API calls to all exchanges
- **Error Resilience**: Graceful degradation when exchanges fail
- **Optimized Rendering**: Efficient Svelte reactivity

## Styling Guide

### Color Scheme
- Background: `gray-950` (almost black)
- Cards: `gray-900` with `gray-800` borders
- Accent: `cyan-400` for interactive elements
- Success: `green-400` for positive rates
- Danger: `red-400` for negative rates

### Typography
- Headers: Bold with accent colors
- Data: Monospace for rates, sans-serif for labels
- Status: Small, muted colors

### Interactions
- Hover states on all interactive elements
- Smooth transitions
- Focus states for accessibility
- Loading animations

## Future Enhancements

- Historical rate charts
- Price alerts and notifications
- WebSocket real-time updates
- Advanced analytics dashboard
- Export functionality
- Mobile app version

## Development

### Adding New Exchanges
1. Create exchange service in `src/lib/services/exchanges/`
2. Add to `aggregator.ts`
3. Update types if needed
4. Test with API endpoints

### Customizing Views
- Modify component layouts
- Add new filter options
- Extend sorting capabilities
- Customize styling

### Performance Optimization
- Adjust cache TTL in `cache.ts`
- Modify refresh intervals
- Optimize API call patterns
- Monitor bundle size