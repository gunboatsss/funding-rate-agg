# Get Funding Rate

Retrieve current funding rates for perpetual markets. This is a public endpoint that returns market-wide funding rate information without requiring authentication.

<InfoEndpoints />

## Request

### Request Format


```json
{
  "params": {
    "action": "getFundingRate",
    "symbol": "BTC-USDT"
  }
}
```

### Request Parameters

| Parameter | Type   | Required | Description                             |
| --------- | ------ | -------- | --------------------------------------- |
| `params.action` | string | Yes      | Must be `"getFundingRate"`              |
| `params.symbol` | string | Yes      | Trading pair symbol (e.g., "BTC-USDT") |

### Example Request

#### cURL
```bash
curl -X POST https://papi.synthetix.io/info \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "action": "getFundingRate",
      "symbol": "BTC-USDT"
    }
  }'
```

#### JavaScript
```javascript
const response = await fetch('https://papi.synthetix.io/info', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    params: {
      action: 'getFundingRate',
      symbol: 'BTC-USDT'
    }
  })
});

const data = await response.json();
console.log(data);
```

#### Python
```python
import requests

response = requests.post('https://papi.synthetix.io/info',
    json={
        "params": {
            "action": "getFundingRate",
            "symbol": "BTC-USDT"
        }
    }
)

data = response.json()
print(data)
```

## Response

### Success Response

```json
{
  "status": "ok",
  "response": {
    "symbol": "BTC-USDT",
    "estimatedFundingRate": "0.000010960225996",
    "lastSettlementRate": "0.00001250",
    "lastSettlementTime": 1735689600000,
    "nextFundingTime": 1735693200000,
    "fundingInterval": 3600000
  },
  "request_id": "5ccf215d37e3ae6d"
}
```

<FundingRateObject />


### Funding Rate Calculation

The funding rate is calculated using:
- **Premium Rate**: Difference between perpetual and spot prices
- **Interest Rate**: Typically 0.01% per 1-hour period
- **Dampening Factor**: Applied to smooth rate changes

**Formula**: `Funding Rate = Premium Rate + clamp(Interest Rate - Premium Rate, -0.05%, 0.05%)`

### Understanding Funding Payments

- **Positive funding rate**: Long positions pay short positions
- **Negative funding rate**: Short positions pay long positions
- **Payment frequency**: Every 1 hour (hourly basis)
- **Rate basis**: 1-hour rate (multiply by 24 for daily, 1095 for annual)

<RateLimitsInfo />

## Error Responses

<CommonErrorResponses />

### Endpoint-Specific Errors

| Error Code | Error Type | Description | Solution |
| ---------- | ---------- | ----------- | -------- |
| 40002 | `INVALID_SYMBOL` | Invalid or unsupported trading symbol | Use valid symbol from getMarkets |
| 50003 | `FUNDING_DATA_UNAVAILABLE` | Funding rate data temporarily unavailable | Retry request or check system status |

## Use Cases

### Real-Time Funding Monitoring
```javascript
// Monitor funding rates for risk management
const symbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'];
const fundingRates = await Promise.all(
  symbols.map(symbol => getFundingRate(symbol))
);
```

### Funding Rate Alerts
```javascript
// Set up alerts for extreme funding rates
if (Math.abs(parseFloat(fundingRate)) > 0.01) {
  console.log(`High funding rate alert: ${symbol} at ${fundingRate}`);
}
```

## Related Endpoints

- [Get Funding Payments](/developer-resources/api/rest-api/trade/getFundingPayments) - User's funding payments history
- [Get Markets](/developer-resources/api/rest-api/info/getMarkets) - Available trading pairs
- [Get Market Prices](/developer-resources/api/rest-api/info/getMarketPrices) - Current market prices
