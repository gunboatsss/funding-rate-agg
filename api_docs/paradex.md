# List available markets summary

GET https://api.prod.paradex.trade/v1/markets/summary

Get markets dynamic data component


Reference: https://docs.paradex.trade/api/prod/markets/get-markets-summary

## OpenAPI Specification

```yaml
openapi: 3.1.1
info:
  title: List available markets summary
  version: endpoint_markets.get-markets-summary
paths:
  /markets/summary:
    get:
      operationId: get-markets-summary
      summary: List available markets summary
      description: |
        Get markets dynamic data component
      tags:
        - - subpackage_markets
      parameters:
        - name: end
          in: query
          description: End Time (unix time millisecond)
          required: false
          schema:
            type: integer
        - name: market
          in: query
          description: >-
            Name of the market for which summary is requested (for all available
            markets use ALL)
          required: true
          schema:
            type: string
        - name: start
          in: query
          description: Start Time (unix time millisecond)
          required: false
          schema:
            type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/markets_get-markets-summary_Response_200'
        '400':
          description: Bad Request
          content: {}
components:
  schemas:
    ResponsesApiResultsResultsItems:
      type: object
      properties: {}
    responses.Greeks:
      type: object
      properties:
        delta:
          type: string
          description: Market Delta
        gamma:
          type: string
          description: Market Gamma
        rho:
          type: string
          description: Market Rho
        vanna:
          type: string
          description: Market Vanna
        vega:
          type: string
          description: Market Vega
        volga:
          type: string
          description: Market Volga
    responses.MarketSummaryResp:
      type: object
      properties:
        ask:
          type: string
          description: Best ask price
        ask_iv:
          type: string
          description: Ask implied volatility, for options
        bid:
          type: string
          description: Best bid price
        bid_iv:
          type: string
          description: Bid implied volatility, for options
        created_at:
          type: integer
          description: Market summary creation time
        delta:
          type: string
          description: 'Deprecated: Use greeks.delta instead'
        funding_rate:
          type: string
          description: >-
            This raw funding rate corresponds to the actual funding period of
            the instrument itself. It is not a normalized 8h funding rate.
        future_funding_rate:
          type: string
          description: For options it's a smoothed version of future's funding rate
        greeks:
          $ref: '#/components/schemas/responses.Greeks'
          description: Greeks (delta, gamma, vega). Partial for perpetual futures.
        last_iv:
          type: string
          description: Last traded price implied volatility, for options
        last_traded_price:
          type: string
          description: Last traded price
        mark_iv:
          type: string
          description: Mark implied volatility, for options
        mark_price:
          type: string
          description: >-
            [Mark
            price](https://docs.paradex.trade/risk-system/mark-price-calculation)
        open_interest:
          type: string
          description: Open interest in base currency
        price_change_rate_24h:
          type: string
          description: Price change rate in the last 24 hours
        symbol:
          type: string
          description: Market symbol
        total_volume:
          type: string
          description: Lifetime total traded volume in USD
        underlying_price:
          type: string
          description: Underlying asset price (spot price)
        volume_24h:
          type: string
          description: 24 hour volume in USD
    markets_get-markets-summary_Response_200:
      type: object
      properties:
        results:
          type: array
          items:
            $ref: '#/components/schemas/responses.MarketSummaryResp'

```

## SDK Code Examples

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('https://api.prod.paradex.trade/v1/markets/summary', params={
  'market': 'BTC-USD-PERP'
}, headers = headers)

print(r.json())

```

```javascript
const headers = {
  'Accept':'application/json'
};

fetch('https://api.prod.paradex.trade/v1/markets/summary?market=BTC-USD-PERP',
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
    req, err := http.NewRequest("GET", "https://api.prod.paradex.trade/v1/markets/summary", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

```ruby
require 'uri'
require 'net/http'

url = URI("https://api.prod.paradex.trade/v1/markets/summary?market=market")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)

response = http.request(request)
puts response.read_body
```

```java
HttpResponse<String> response = Unirest.get("https://api.prod.paradex.trade/v1/markets/summary?market=market")
  .asString();
```

```php
<?php

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.prod.paradex.trade/v1/markets/summary?market=market');

echo $response->getBody();
```

```csharp
var client = new RestClient("https://api.prod.paradex.trade/v1/markets/summary?market=market");
var request = new RestRequest(Method.GET);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let request = NSMutableURLRequest(url: NSURL(string: "https://api.prod.paradex.trade/v1/markets/summary?market=market")! as URL,
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