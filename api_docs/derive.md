Get Instruments

# Get Instruments

Get all active instruments for a given `currency` and `type`.

# OpenAPI definition

```json
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.0.0",
    "title": "REST API"
  },
  "servers": [
    {
      "url": "https://api.lyra.finance",
      "description": "Prod"
    },
    {
      "url": "https://api-demo.lyra.finance",
      "description": "Testnet"
    }
  ],
  "paths": {
    "/public/get_instruments": {
      "post": {
        "tags": [
          "Public"
        ],
        "summary": "Get Instruments",
        "description": "Get all active instruments for a given `currency` and `type`.",
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "application/json": {
                "schema": {
                  "properties": {
                    "id": {
                      "oneOf": [
                        {
                          "title": "",
                          "type": "string"
                        },
                        {
                          "title": "",
                          "type": "integer"
                        }
                      ]
                    },
                    "result": {
                      "title": "result",
                      "type": "array",
                      "description": "",
                      "items": {
                        "properties": {
                          "amount_step": {
                            "title": "amount_step",
                            "type": "string",
                            "format": "decimal",
                            "description": "Minimum valid increment of order amount"
                          },
                          "base_asset_address": {
                            "title": "base_asset_address",
                            "type": "string",
                            "description": "Blockchain address of the base asset"
                          },
                          "base_asset_sub_id": {
                            "title": "base_asset_sub_id",
                            "type": "string",
                            "description": "Sub ID of the specific base asset as defined in Asset.sol"
                          },
                          "base_currency": {
                            "title": "base_currency",
                            "type": "string",
                            "description": "Underlying currency of base asset (`ETH`, `BTC`, etc)"
                          },
                          "base_fee": {
                            "title": "base_fee",
                            "type": "string",
                            "format": "decimal",
                            "description": "$ base fee added to every taker order"
                          },
                          "erc20_details": {
                            "nullable": true,
                            "properties": {
                              "borrow_index": {
                                "title": "borrow_index",
                                "type": "string",
                                "format": "decimal",
                                "default": "1",
                                "description": "Latest borrow index as per `CashAsset.sol` implementation"
                              },
                              "decimals": {
                                "title": "decimals",
                                "type": "integer",
                                "description": "Number of decimals of the underlying on-chain ERC20 token"
                              },
                              "supply_index": {
                                "title": "supply_index",
                                "type": "string",
                                "format": "decimal",
                                "default": "1",
                                "description": "Latest supply index as per `CashAsset.sol` implementation"
                              },
                              "underlying_erc20_address": {
                                "title": "underlying_erc20_address",
                                "type": "string",
                                "default": "",
                                "description": "Address of underlying on-chain ERC20 (not V2 asset)"
                              }
                            },
                            "required": [
                              "decimals"
                            ],
                            "type": "object",
                            "additionalProperties": false,
                            "x-readme-ref-name": "ERC20PublicDetailsSchema"
                          },
                          "fifo_min_allocation": {
                            "title": "fifo_min_allocation",
                            "type": "string",
                            "format": "decimal",
                            "description": "Minimum number of contracts that get filled using FIFO. Actual number of contracts that gets filled by FIFO will be the max between this value and (1 - pro_rata_fraction) x order_amount, plus any size leftovers due to rounding."
                          },
                          "instrument_name": {
                            "title": "instrument_name",
                            "type": "string",
                            "description": "Instrument name"
                          },
                          "instrument_type": {
                            "title": "instrument_type",
                            "type": "string",
                            "enum": [
                              "erc20",
                              "option",
                              "perp"
                            ],
                            "description": "`erc20`, `option`, or `perp`"
                          },
                          "is_active": {
                            "title": "is_active",
                            "type": "boolean",
                            "description": "If `True`: instrument is tradeable within `activation` and `deactivation` timestamps"
                          },
                          "maker_fee_rate": {
                            "title": "maker_fee_rate",
                            "type": "string",
                            "format": "decimal",
                            "description": "Percent of spot price fee rate for makers"
                          },
                          "mark_price_fee_rate_cap": {
                            "title": "mark_price_fee_rate_cap",
                            "type": "string",
                            "format": "decimal",
                            "default": null,
                            "description": "Percent of option price fee cap, e.g. 12.5%, null if not applicable",
                            "nullable": true
                          },
                          "maximum_amount": {
                            "title": "maximum_amount",
                            "type": "string",
                            "format": "decimal",
                            "description": "Maximum valid amount of contracts / tokens per trade"
                          },
                          "minimum_amount": {
                            "title": "minimum_amount",
                            "type": "string",
                            "format": "decimal",
                            "description": "Minimum valid amount of contracts / tokens per trade"
                          },
                          "option_details": {
                            "nullable": true,
                            "properties": {
                              "expiry": {
                                "title": "expiry",
                                "type": "integer",
                                "description": "Unix timestamp of expiry date (in seconds)"
                              },
                              "index": {
                                "title": "index",
                                "type": "string",
                                "description": "Underlying settlement price index"
                              },
                              "option_type": {
                                "title": "option_type",
                                "type": "string",
                                "enum": [
                                  "C",
                                  "P"
                                ]
                              },
                              "settlement_price": {
                                "title": "settlement_price",
                                "type": "string",
                                "format": "decimal",
                                "default": null,
                                "description": "Settlement price of the option",
                                "nullable": true
                              },
                              "strike": {
                                "title": "strike",
                                "type": "string",
                                "format": "decimal"
                              }
                            },
                            "required": [
                              "expiry",
                              "index",
                              "option_type",
                              "strike"
                            ],
                            "type": "object",
                            "additionalProperties": false,
                            "x-readme-ref-name": "OptionPublicDetailsSchema"
                          },
                          "perp_details": {
                            "nullable": true,
                            "properties": {
                              "aggregate_funding": {
                                "title": "aggregate_funding",
                                "type": "string",
                                "format": "decimal",
                                "description": "Latest aggregated funding as per `PerpAsset.sol`"
                              },
                              "funding_rate": {
                                "title": "funding_rate",
                                "type": "string",
                                "format": "decimal",
                                "description": "Current hourly funding rate as per `PerpAsset.sol`"
                              },
                              "index": {
                                "title": "index",
                                "type": "string",
                                "description": "Underlying spot price index for funding rate"
                              },
                              "max_rate_per_hour": {
                                "title": "max_rate_per_hour",
                                "type": "string",
                                "format": "decimal",
                                "description": "Max rate per hour as per `PerpAsset.sol`"
                              },
                              "min_rate_per_hour": {
                                "title": "min_rate_per_hour",
                                "type": "string",
                                "format": "decimal",
                                "description": "Min rate per hour as per `PerpAsset.sol`"
                              },
                              "static_interest_rate": {
                                "title": "static_interest_rate",
                                "type": "string",
                                "format": "decimal",
                                "description": "Static interest rate as per `PerpAsset.sol`"
                              }
                            },
                            "required": [
                              "aggregate_funding",
                              "funding_rate",
                              "index",
                              "max_rate_per_hour",
                              "min_rate_per_hour",
                              "static_interest_rate"
                            ],
                            "type": "object",
                            "additionalProperties": false,
                            "x-readme-ref-name": "PerpPublicDetailsSchema"
                          },
                          "pro_rata_amount_step": {
                            "title": "pro_rata_amount_step",
                            "type": "string",
                            "format": "decimal",
                            "description": "Pro-rata fill share of every order is rounded down to be a multiple of this number. Leftovers of the order due to rounding are filled FIFO."
                          },
                          "pro_rata_fraction": {
                            "title": "pro_rata_fraction",
                            "type": "string",
                            "format": "decimal",
                            "description": "Fraction of order that gets filled using pro-rata matching. If zero, the matching is full FIFO."
                          },
                          "quote_currency": {
                            "title": "quote_currency",
                            "type": "string",
                            "description": "Quote currency (`USD` for perps, `USDC` for options)"
                          },
                          "scheduled_activation": {
                            "title": "scheduled_activation",
                            "type": "integer",
                            "description": "Timestamp at which became or will become active (if applicable)"
                          },
                          "scheduled_deactivation": {
                            "title": "scheduled_deactivation",
                            "type": "integer",
                            "description": "Scheduled deactivation time for instrument (if applicable)"
                          },
                          "taker_fee_rate": {
                            "title": "taker_fee_rate",
                            "type": "string",
                            "format": "decimal",
                            "description": "Percent of spot price fee rate for takers"
                          },
                          "tick_size": {
                            "title": "tick_size",
                            "type": "string",
                            "format": "decimal",
                            "description": "Tick size of the instrument, i.e. minimum price increment"
                          }
                        },
                        "required": [
                          "amount_step",
                          "base_asset_address",
                          "base_asset_sub_id",
                          "base_currency",
                          "base_fee",
                          "erc20_details",
                          "fifo_min_allocation",
                          "instrument_name",
                          "instrument_type",
                          "is_active",
                          "maker_fee_rate",
                          "maximum_amount",
                          "minimum_amount",
                          "option_details",
                          "perp_details",
                          "pro_rata_amount_step",
                          "pro_rata_fraction",
                          "quote_currency",
                          "scheduled_activation",
                          "scheduled_deactivation",
                          "taker_fee_rate",
                          "tick_size"
                        ],
                        "type": "object",
                        "additionalProperties": false,
                        "x-readme-ref-name": "InstrumentPublicResponseSchema"
                      }
                    }
                  },
                  "required": [
                    "id",
                    "result"
                  ],
                  "type": "object",
                  "additionalProperties": false,
                  "x-readme-ref-name": "PublicGetInstrumentsResponseSchema"
                }
              }
            }
          }
        },
        "parameters": [],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "properties": {
                  "currency": {
                    "title": "currency",
                    "type": "string",
                    "description": "Underlying currency of asset (`ETH`, `BTC`, etc)"
                  },
                  "expired": {
                    "title": "expired",
                    "type": "boolean",
                    "description": "If `True`: include expired assets. Note: will soon be capped up to only 1 week in the past."
                  },
                  "instrument_type": {
                    "title": "instrument_type",
                    "type": "string",
                    "enum": [
                      "erc20",
                      "option",
                      "perp"
                    ],
                    "description": "`erc20`, `option`, or `perp`"
                  }
                },
                "required": [
                  "currency",
                  "expired",
                  "instrument_type"
                ],
                "type": "object",
                "additionalProperties": false,
                "x-readme-ref-name": "PublicGetInstrumentsParamsSchema"
              }
            }
          }
        }
      }
    }
  }
}
```