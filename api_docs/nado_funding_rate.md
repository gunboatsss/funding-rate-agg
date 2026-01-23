# All Products

## Rate limits

* 480 requests/min or 8 requests/sec per IP address. (**weight = 5**)

{% hint style="info" %}
See more details in [API Rate limits](https://docs.nado.xyz/developer-resources/api/rate-limits)
{% endhint %}

## Request

{% tabs %}
{% tab title="Websocket" %}
**Connect**

<mark style="color:orange;">`WEBSOCKET [GATEWAY_WEBSOCKET_ENDPOINT]`</mark>

**Message**

```json
{
 "type": "all_products"
}
```

{% endtab %}

{% tab title="REST (GET)" %} <mark style="color:green;">**GET**</mark> `[GATEWAY_REST_ENDPOINT]/query?type=all_products`
{% endtab %}

{% tab title="REST (POST)" %} <mark style="color:orange;">`POST [GATEWAY_REST_ENDPOINT]/query`</mark>

**Body**

```json
{
 "type": "all_products"
}
```

{% endtab %}
{% endtabs %}

## Response

{% hint style="info" %}
**Note**:

* A product is some asset / position an account can take on.
* A market is a venue for a product against USDT0.
* All products have a market quoted against USDT0, except for product 0.
* Product 0 is the USDT0 asset itself.
* You can retrieve product symbols via [symbols](https://docs.nado.xyz/developer-resources/api/symbols "mention") query.
  {% endhint %}

```json
{
    "status": "success",
    "data": {
        "spot_products": [
            {
                "product_id": 0,
                "oracle_price_x18": "1000000000000000000",
                "risk": {
                    "long_weight_initial_x18": "1000000000000000000",
                    "short_weight_initial_x18": "1000000000000000000",
                    "long_weight_maintenance_x18": "1000000000000000000",
                    "short_weight_maintenance_x18": "1000000000000000000",
                    "price_x18": "1000000000000000000"
                },
                "config": {
                    "token": "0x0200c29006150606b650577bbe7b6248f58470c1",
                    "interest_inflection_util_x18": "800000000000000000",
                    "interest_floor_x18": "10000000000000000",
                    "interest_small_cap_x18": "40000000000000000",
                    "interest_large_cap_x18": "1000000000000000000",
                    "withdraw_fee_x18": "1000000000000000000",
                    "min_deposit_rate_x18": "0"
                },
                "state": {
                    "cumulative_deposits_multiplier_x18": "1000292524727496146",
                    "cumulative_borrows_multiplier_x18": "1002754401180275098",
                    "total_deposits_normalized": "40264118029351127987049996",
                    "total_borrows_normalized": "6104710033771242437418484"
                },
                "book_info": {
                    "size_increment": "0",
                    "price_increment_x18": "0",
                    "min_size": "0",
                    "collected_fees": "0"
                }
            },
            {
                "product_id": 3,
                "oracle_price_x18": "3019406981108469911172",
                "risk": {
                    "long_weight_initial_x18": "950000000000000000",
                    "short_weight_initial_x18": "1050000000000000000",
                    "long_weight_maintenance_x18": "970000000000000000",
                    "short_weight_maintenance_x18": "1030000000000000000",
                    "price_x18": "3019406981108469911172"
                },
                "config": {
                    "token": "0x4200000000000000000000000000000000000006",
                    "interest_inflection_util_x18": "800000000000000000",
                    "interest_floor_x18": "10000000000000000",
                    "interest_small_cap_x18": "40000000000000000",
                    "interest_large_cap_x18": "1000000000000000000",
                    "withdraw_fee_x18": "300000000000000",
                    "min_deposit_rate_x18": "0"
                },
                "state": {
                    "cumulative_deposits_multiplier_x18": "1000433815463904531",
                    "cumulative_borrows_multiplier_x18": "1002715330536825495",
                    "total_deposits_normalized": "1088625488722071592341",
                    "total_borrows_normalized": "595415196167550220"
                },
                "book_info": {
                    "size_increment": "1000000000000000",
                    "price_increment_x18": "100000000000000000",
                    "min_size": "100000000000000000000",
                    "collected_fees": "0"
                }
            }
        ],
        "perp_products": [
            {
                "product_id": 4,
                "oracle_price_x18": "3017534999994995621168",
                "risk": {
                    "long_weight_initial_x18": "975000000000000000",
                    "short_weight_initial_x18": "1025000000000000000",
                    "long_weight_maintenance_x18": "987500000000000000",
                    "short_weight_maintenance_x18": "1012500000000000000",
                    "price_x18": "3017534999994995621168"
                },
                "state": {
                    "cumulative_funding_long_x18": "33101120779669575254",
                    "cumulative_funding_short_x18": "33101120779669575254",
                    "available_settle": "529219428466873226063096",
                    "open_interest": "8991324000000000000000"
                },
                "book_info": {
                    "size_increment": "1000000000000000",
                    "price_increment_x18": "100000000000000000",
                    "min_size": "100000000000000000000",
                    "collected_fees": "0"
                }
            }
        ]
    },
    "request_type": "query_all_products"
}
```

### Field Descriptions

#### Top-Level Response

| Field         | Type   | Description                                         |
| ------------- | ------ | --------------------------------------------------- |
| status        | string | Response status: `"success"` or `"failure"`         |
| data          | object | Contains `spot_products` and `perp_products` arrays |
| request\_type | string | Echo of the request type: `"query_all_products"`    |

#### Spot Product

| Field              | Type   | Description                                                 |
| ------------------ | ------ | ----------------------------------------------------------- |
| product\_id        | number | Unique identifier for the product. Product 0 is USDT0.      |
| oracle\_price\_x18 | string | Current oracle price, scaled by 10^18                       |
| risk               | object | Risk parameters for margin calculations                     |
| config             | object | Product configuration (interest rates, fees, token address) |
| state              | object | Current state (deposits, borrows, multipliers)              |
| book\_info         | object | Orderbook parameters (increments, min size)                 |

#### Perp Product

| Field              | Type   | Description                                         |
| ------------------ | ------ | --------------------------------------------------- |
| product\_id        | number | Unique identifier for the perpetual product         |
| oracle\_price\_x18 | string | Current oracle price, scaled by 10^18               |
| risk               | object | Risk parameters for margin calculations             |
| state              | object | Current state (funding, open interest, settle pool) |
| book\_info         | object | Orderbook parameters (increments, min size)         |

#### Risk Object

| Field                           | Type   | Description                                                                      |
| ------------------------------- | ------ | -------------------------------------------------------------------------------- |
| long\_weight\_initial\_x18      | string | Initial margin weight for long positions (e.g., `"950000000000000000"` = 0.95)   |
| short\_weight\_initial\_x18     | string | Initial margin weight for short positions (e.g., `"1050000000000000000"` = 1.05) |
| long\_weight\_maintenance\_x18  | string | Maintenance margin weight for long positions                                     |
| short\_weight\_maintenance\_x18 | string | Maintenance margin weight for short positions                                    |
| price\_x18                      | string | Price used for risk calculations, scaled by 10^18                                |

#### Config Object (Spot Only)

| Field                           | Type   | Description                                       |
| ------------------------------- | ------ | ------------------------------------------------- |
| token                           | string | ERC-20 token contract address                     |
| interest\_inflection\_util\_x18 | string | Utilization rate at which interest curve inflects |
| interest\_floor\_x18            | string | Minimum interest rate                             |
| interest\_small\_cap\_x18       | string | Interest rate below inflection point              |
| interest\_large\_cap\_x18       | string | Interest rate above inflection point              |
| withdraw\_fee\_x18              | string | Fee charged on withdrawals                        |
| min\_deposit\_rate\_x18         | string | Minimum deposit interest rate                     |

#### State Object (Spot)

| Field                                 | Type   | Description                                    |
| ------------------------------------- | ------ | ---------------------------------------------- |
| cumulative\_deposits\_multiplier\_x18 | string | Accumulated deposit interest multiplier        |
| cumulative\_borrows\_multiplier\_x18  | string | Accumulated borrow interest multiplier         |
| total\_deposits\_normalized           | string | Total deposits (normalized, before multiplier) |
| total\_borrows\_normalized            | string | Total borrows (normalized, before multiplier)  |

#### State Object (Perp)

| Field                           | Type   | Description                                        |
| ------------------------------- | ------ | -------------------------------------------------- |
| cumulative\_funding\_long\_x18  | string | Accumulated funding for long positions             |
| cumulative\_funding\_short\_x18 | string | Accumulated funding for short positions            |
| available\_settle               | string | Available funds in the settlement pool             |
| open\_interest                  | string | Total open interest in base units, scaled by 10^18 |

#### Book Info Object

| Field                 | Type   | Description                                                                                                                             |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| size\_increment       | string | Minimum order size increment in base units. Orders must be multiples of this value.                                                     |
| price\_increment\_x18 | string | Minimum price increment, scaled by 10^18                                                                                                |
| min\_size             | string | **Minimum order size in quote units (USDT0), scaled by 10^18.** For example, `"100000000000000000000"` = 100 USDT0 minimum order value. |
| collected\_fees       | string | Total fees collected by the orderbook                                                                                                   |
S