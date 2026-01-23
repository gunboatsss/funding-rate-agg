# Get Markets

Retrieve comprehensive market configuration information for all available trading pairs.


## Request

### Request Format

```json
{
  "params": {
    "action": "getMarkets"
  }
}
```

### Request Parameters

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| `params.action` | string | Yes | Must be `"getMarkets"` |
| `params.activeOnly` | boolean | No | If `true`, returns only markets where `isOpen: true`. Default: `false` (returns all markets) |

## Response

### Success Response

```json
{
  "status": "ok",
  "response": [
    {
      "symbol": "SOL-USDT",
      "description": "Solana",
      "baseAsset": "SOL",
      "quoteAsset": "USDT",
      "isOpen": true,
      "isCloseOnly": false,
      "priceExponent": 2,
      "quantityExponent": 2,
      "priceIncrement": "0.01",
      "minOrderSize": "0.01",
      "orderSizeIncrement": "0.01",
      "contractSize": 1,
      "maxMarketOrderSize": "1000000",
      "maxLimitOrderSize": "1000000",
      "minOrderPrice": "0.01",
      "limitOrderPriceCapRatio": "1.5",
      "limitOrderPriceFloorRatio": "0.5",
      "marketOrderPriceCapRatio": "1.1",
      "marketOrderPriceFloorRatio": "0.9",
      "liquidationClearanceFee": "0.002",
      "minNotionalValue": "10",
      "maintenanceMarginTiers": [
        {
          "minPositionSize": "0",
          "maxPositionSize": "500000",
          "maxLeverage": 100,
          "initialMarginRequirement": "0.01",
          "maintenanceMarginRequirement": "0.005"
        },
        {
          "minPositionSize": "500001",
          "maxPositionSize": "10000000",
          "maxLeverage": 50,
          "initialMarginRequirement": "0.02",
          "maintenanceMarginRequirement": "0.01"
        },
        {
          "minPositionSize": "10000001",
          "maxPositionSize": "50000000",
          "maxLeverage": 25,
          "initialMarginRequirement": "0.04",
          "maintenanceMarginRequirement": "0.02"
        },
        {
          "minPositionSize": "50000001",
          "maxPositionSize": "200000000",
          "maxLeverage": 10,
          "initialMarginRequirement": "0.1",
          "maintenanceMarginRequirement": "0.05"
        },
        {
          "minPositionSize": "200000001",
          "maxPositionSize": "",
          "maxLeverage": 2,
          "initialMarginRequirement": "0.5",
          "maintenanceMarginRequirement": "0.25"
        }
      ]
    }
  ],
  "request_id": "5ccf215d37e3ae6d"
}
```


### Error Response

```json
{
  "status": "error",
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Could not pull market configuration",
    "details": {}
  },
  "request_id": "5ccf215d37e3ae6d"
}
```

## Code Examples

### Get All Markets

```json
{
  "params": {
    "action": "getMarkets"
  }
}
```

### Get Only Active Markets

```json
{
  "params": {
    "action": "getMarkets",
    "activeOnly": true
  }
}
```

## Market Information

- **Comprehensive Data**: Includes all market configuration, trading rules, and limits
- **Real-time Updates**: Market status and configuration are updated in real-time
- **Trading Rules**: All necessary information for placing compliant orders
- **Margin Requirements**: Complete margin tier information for risk management
- **Price Precision**: Exact decimal precision for prices and quantities

## Use Cases

- **Trading Applications**: Get market specifications for order validation
- **Risk Management**: Access margin requirements and position limits
- **Market Analysis**: Understand trading rules and market structure
- **Order Management**: Validate order parameters before submission
- **System Integration**: Configure trading systems with market rules

## Validation Rules

- No authentication required
- No rate limiting beyond standard API limits
- Returns data for all available markets

## Error Handling

Common error scenarios:

<CommonErrorResponses />

| Error                            | Description                                               |
| -------------------------------- | --------------------------------------------------------- |
| Market configuration unavailable | Failed to retrieve market data from configuration service |
| Internal error                   | Service temporarily unavailable                           |

## Related Endpoints

- [Get Market Prices](/developer-resources/api/rest-api/info/getMarketPrices) - Current market prices
- [Get Orderbook](/developer-resources/api/rest-api/info/getOrderbook) - Order book depth
