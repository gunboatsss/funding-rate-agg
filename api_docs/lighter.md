funding-rates

# funding-rates

Get funding rates

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "",
    "version": ""
  },
  "paths": {
    "/api/v1/funding-rates": {
      "get": {
        "summary": "funding-rates",
        "operationId": "funding-rates",
        "responses": {
          "200": {
            "description": "A successful response.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "integer",
                      "format": "int32",
                      "example": "200"
                    },
                    "message": {
                      "type": "string"
                    },
                    "funding_rates": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "market_id": {
                            "type": "integer",
                            "format": "uint8"
                          },
                          "exchange": {
                            "type": "string",
                            "enum": [
                              "binance",
                              "bybit",
                              "hyperliquid",
                              "lighter"
                            ]
                          },
                          "symbol": {
                            "type": "string"
                          },
                          "rate": {
                            "type": "number",
                            "format": "double"
                          }
                        },
                        "title": "FundingRate",
                        "required": [
                          "market_id",
                          "exchange",
                          "symbol",
                          "rate"
                        ],
                        "x-readme-ref-name": "FundingRate"
                      }
                    }
                  },
                  "title": "FundingRates",
                  "required": [
                    "code",
                    "funding_rates"
                  ],
                  "x-readme-ref-name": "FundingRates"
                }
              }
            }
          },
          "400": {
            "description": "Bad request",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "type": "integer",
                      "format": "int32",
                      "example": "200"
                    },
                    "message": {
                      "type": "string"
                    }
                  },
                  "title": "ResultCode",
                  "required": [
                    "code"
                  ],
                  "x-readme-ref-name": "ResultCode"
                }
              }
            }
          }
        },
        "tags": [
          "funding"
        ],
        "description": "Get funding rates"
      }
    }
  },
  "servers": [
    {
      "url": "https://mainnet.zklighter.elliot.ai"
    }
  ]
}
```