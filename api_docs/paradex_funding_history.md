# Funding data history

GET https://api.prod.paradex.trade/v1/funding/data

List historical funding data by market


Reference: https://docs.paradex.trade/api/prod/markets/get-funding-data

## OpenAPI Specification

```yaml
openapi: 3.1.1
info:
  title: Funding data history
  version: endpoint_markets.get-funding-data
paths:
  /funding/data:
    get:
      operationId: get-funding-data
      summary: Funding data history
      description: |
        List historical funding data by market
      tags:
        - - subpackage_markets
      parameters:
        - name: cursor
          in: query
          description: Returns the ‘next’ paginated page.
          required: false
          schema:
            type: string
        - name: end_at
          in: query
          description: End Time (unix time millisecond)
          required: false
          schema:
            type: integer
        - name: market
          in: query
          description: Market for which funding payments are queried
          required: true
          schema:
            type: string
        - name: page_size
          in: query
          description: Limit the number of responses in the page
          required: false
          schema:
            type: integer
            default: 100
        - name: start_at
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
                $ref: '#/components/schemas/markets_get-funding-data_Response_200'
        '400':
          description: Bad Request
          content: {}
components:
  schemas:
    ResponsesPaginatedApiResultsResultsItems:
      type: object
      properties: {}
    responses.FundingDataResult:
      type: object
      properties:
        created_at:
          type: integer
          description: Timestamp in milliseconds when the funding data was created
        funding_index:
          type: string
          description: Current funding index value as a decimal string
        funding_period_hours:
          type: number
          format: double
          description: Actual funding period in hours for this market
        funding_premium:
          type: string
          description: Current funding premium as a decimal string
        funding_rate:
          type: string
          description: Raw funding rate for the actual funding period as a decimal string
        funding_rate_8h:
          type: string
          description: Normalized 8-hour funding rate as a decimal string
        market:
          type: string
          description: Market represents the market identifier
    markets_get-funding-data_Response_200:
      type: object
      properties:
        next:
          type: string
          description: >-
            The pointer to fetch next set of records (null if there are no
            records left)
        prev:
          type: string
          description: >-
            The pointer to fetch previous set of records (null if there are no
            records left)
        results:
          type: array
          items:
            $ref: '#/components/schemas/responses.FundingDataResult'

```

## SDK Code Examples

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('https://api.prod.paradex.trade/v1/funding/data', params={
  'market': 'BTC-USD-PERP'
}, headers = headers)

print(r.json())

```

```javascript
const headers = {
  'Accept':'application/json'
};

fetch('https://api.prod.paradex.trade/v1/funding/data?market=BTC-USD-PERP',
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
    req, err := http.NewRequest("GET", "https://api.prod.paradex.trade/v1/funding/data", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

```ruby
require 'uri'
require 'net/http'

url = URI("https://api.prod.paradex.trade/v1/funding/data?market=market")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)

response = http.request(request)
puts response.read_body
```

```java
HttpResponse<String> response = Unirest.get("https://api.prod.paradex.trade/v1/funding/data?market=market")
  .asString();
```

```php
<?php

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.prod.paradex.trade/v1/funding/data?market=market');

echo $response->getBody();
```

```csharp
var client = new RestClient("https://api.prod.paradex.trade/v1/funding/data?market=market");
var request = new RestRequest(Method.GET);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let request = NSMutableURLRequest(url: NSURL(string: "https://api.prod.paradex.trade/v1/funding/data?market=market")! as URL,
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