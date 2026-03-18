# List available markets

GET https://api.prod.paradex.trade/v1/markets

Get markets static data component


Reference: https://docs.paradex.trade/api/prod/markets/get-markets

## OpenAPI Specification

```yaml
openapi: 3.1.1
info:
  title: List available markets
  version: endpoint_markets.get-markets
paths:
  /markets:
    get:
      operationId: get-markets
      summary: List available markets
      description: |
        Get markets static data component
      tags:
        - - subpackage_markets
      parameters:
        - name: market
          in: query
          description: 'Market Name - example: BTC-USD-PERP'
          required: false
          schema:
            type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/markets_get-markets_Response_200'
        '404':
          description: Not Found
          content: {}
components:
  schemas:
    ResponsesApiResultsResultsItems:
      type: object
      properties: {}
    ResponsesMarketRespAssetKind:
      type: string
      enum:
        - value: PERP
        - value: PERP_OPTION
    responses.MarketChainDetails:
      type: object
      properties:
        collateral_address:
          type: string
          description: Collateral address
        contract_address:
          type: string
          description: Contract address
        fee_account_address:
          type: string
          description: Fee account address
        fee_maker:
          type: string
          description: Maker fee
        fee_taker:
          type: string
          description: Taker fee
        insurance_fund_address:
          type: string
          description: Insurance fund address
        liquidation_fee:
          type: string
          description: Liquidation fee
        oracle_address:
          type: string
          description: Oracle address
        symbol:
          type: string
          description: Market symbol
    responses.Delta1CrossMarginParams:
      type: object
      properties:
        imf_base:
          type: string
          description: Initial Margin Base
        imf_factor:
          type: string
          description: Initial Margin Factor, always 0.
        imf_shift:
          type: string
          description: Initial Margin Shift, unused, always 0.
        mmf_factor:
          type: string
          description: Maintenance Margin Factor
    responses.FeeWithCap:
      type: object
      properties:
        fee:
          type: string
          description: fee rate
        fee_cap:
          type: string
          description: fee cap (used for option)
        fee_floor:
          type: string
          description: fee floor (used for option)
    responses.MakerTakerFee:
      type: object
      properties:
        maker_fee:
          $ref: '#/components/schemas/responses.FeeWithCap'
          description: fee for maker
        taker_fee:
          $ref: '#/components/schemas/responses.FeeWithCap'
          description: fee for taker
    responses.MarketFeeConfig:
      type: object
      properties:
        api_fee:
          $ref: '#/components/schemas/responses.MakerTakerFee'
          description: fee for order coming from API
        interactive_fee:
          $ref: '#/components/schemas/responses.MakerTakerFee'
          description: fee for order coming from UI
        rpi_fee:
          $ref: '#/components/schemas/responses.MakerTakerFee'
          description: fee for order coming from API with RPI instruction
    responses.MarketKind:
      type: string
      enum:
        - value: ''
        - value: cross
        - value: isolated
        - value: isolated_margin
    responses.OptionMarginParams:
      type: object
      properties:
        long_itm:
          type: string
          description: Margin fraction for long ITM options
        premium_multiplier:
          type: string
          description: Multiplier for margin fraction for premium
        short_itm:
          type: string
          description: Margin fraction for short ITM options
        short_otm:
          type: string
          description: Margin fraction for short OTM options
        short_put_cap:
          type: string
          description: Cap for margin fraction for short put options
    responses.OptionCrossMarginParams:
      type: object
      properties:
        imf:
          $ref: '#/components/schemas/responses.OptionMarginParams'
        mmf:
          $ref: '#/components/schemas/responses.OptionMarginParams'
    ResponsesMarketRespOptionType:
      type: string
      enum:
        - value: PUT
        - value: CALL
    responses.MarketResp:
      type: object
      properties:
        asset_kind:
          $ref: '#/components/schemas/ResponsesMarketRespAssetKind'
          description: Type of asset
        base_currency:
          type: string
          description: Base currency of the market
        chain_details:
          $ref: '#/components/schemas/responses.MarketChainDetails'
          description: Chain details
        clamp_rate:
          type: string
          description: Clamp rate
        delta1_cross_margin_params:
          $ref: '#/components/schemas/responses.Delta1CrossMarginParams'
          description: Delta1 Cross margin parameters
        expiry_at:
          type: integer
          description: Market expiry time
        fee_config:
          $ref: '#/components/schemas/responses.MarketFeeConfig'
          description: >-
            Fee config indicates override fee for the market. If not set, it
            will use the global exchange fee config
        funding_multiplier:
          type: number
          format: double
          description: Funding multiplier
        funding_period_hours:
          type: number
          format: double
          description: Funding period in hours
        interest_rate:
          type: string
          description: Interest rate
        iv_bands_width:
          type: string
          description: IV Bands Width
        market_kind:
          $ref: '#/components/schemas/responses.MarketKind'
          description: Market's margin mode
        max_funding_rate:
          type: string
          description: Max funding rate
        max_funding_rate_change:
          type: string
          description: Max funding rate change
        max_open_orders:
          type: integer
          description: Max open orders
        max_order_size:
          type: string
          description: Maximum order size in base currency
        max_slippage:
          type: string
          description: Default max slippage allowed for the market
        max_tob_spread:
          type: string
          description: The maximum TOB spread allowed to apply funding rate changes
        min_notional:
          type: string
          description: >-
            Minimum order notional in USD. For futures: size*mark_price, for
            options: size*spot_price
        open_at:
          type: integer
          description: Market open time in milliseconds
        option_cross_margin_params:
          $ref: '#/components/schemas/responses.OptionCrossMarginParams'
          description: Option Cross margin parameters
        option_type:
          $ref: '#/components/schemas/ResponsesMarketRespOptionType'
          description: Type of option
        oracle_ewma_factor:
          type: string
          description: Oracle EWMA factor
        order_size_increment:
          type: string
          description: Minimum size increment for base currency
        position_limit:
          type: string
          description: Position limit in base currency
        price_bands_width:
          type: string
          description: >-
            Price Bands Width, 0.05 means 5% price deviation allowed from mark
            price
        price_feed_id:
          type: string
          description: Price feed id. Pyth price account used to price underlying asset
        price_tick_size:
          type: string
          description: Minimum price increment of the market in USD
        quote_currency:
          type: string
          description: Quote currency of the market
        settlement_currency:
          type: string
          description: Settlement currency of the market
        strike_price:
          type: string
          description: Strike price for option market
        symbol:
          type: string
          description: Market symbol
        tags:
          type: array
          items:
            type: string
          description: Market tags
    markets_get-markets_Response_200:
      type: object
      properties:
        results:
          type: array
          items:
            $ref: '#/components/schemas/responses.MarketResp'

```

## SDK Code Examples

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('https://api.prod.paradex.trade/v1/markets', headers = headers)

print(r.json())

```

```javascript
const headers = {
  'Accept':'application/json'
};

fetch('https://api.prod.paradex.trade/v1/markets',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```go
package main
import (
      "bytes"
      "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "https://api.prod.paradex.trade/v1/markets", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

```ruby
require 'uri'
require 'net/http'

url = URI("https://api.prod.paradex.trade/v1/markets")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)

response = http.request(request)
puts response.read_body
```

```java
HttpResponse<String> response = Unirest.get("https://api.prod.paradex.trade/v1/markets")
  .asString();
```

```php
<?php

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.prod.paradex.trade/v1/markets');

echo $response->getBody();
```

```csharp
var client = new RestClient("https://api.prod.paradex.trade/v1/markets");
var request = new RestRequest(Method.GET);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let request = NSMutableURLRequest(url: NSURL(string: "https://api.prod.paradex.trade/v1/markets")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "GET"

let session = URLSession.shared
let dataTask = session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) -> Void in
  if (error != nil) {
    print(error as Any)
  } else {
    let httpResponse = response as? HTTPURLResponse
    print(httpResponse)
  }
})

dataTask.resume()
```