import { Effect, pipe, Schema } from "effect";
import { FundingRate, NadoSymbol, NadoPerpProduct } from "../types";
import { cachedExchangeCall } from "../cache";

// Response schemas for funding rate endpoints
const SingleFundingRateResponse = Schema.Struct({
    product_id: Schema.Number,
    funding_rate_x18: Schema.String,
    update_time: Schema.String,
});

const MultipleFundingRatesResponse = Schema.Record({
    key: Schema.String, // product_id as string
    value: SingleFundingRateResponse,
});

// Legacy schemas for product discovery
const AllProductsResponse = Schema.Struct({
    status: Schema.String,
    data: Schema.Struct({
        perp_products: Schema.Array(NadoPerpProduct),
    }),
    request_type: Schema.String,
});

const SymbolsResponse = Schema.Struct({
    status: Schema.String,
    data: Schema.Struct({
        symbols: Schema.Record({ key: Schema.String, value: NadoSymbol }),
    }),
    request_type: Schema.String,
});

const NADO_API = "https://gateway.prod.nado.xyz/v1/query";
const NADO_ARCHIVE_API = "https://archive.prod.nado.xyz/v1";

const getSymbols = (): Effect.Effect<Record<string, NadoSymbol>, Error> =>
    pipe(
        Effect.tryPromise({
            try: () =>
                fetch(NADO_API, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept-Encoding": "gzip",
                    },
                    body: JSON.stringify({
                        type: "symbols",
                        product_type: "perp",
                    }),
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error(`Nado API error: ${res.status}`);
                        }
                        return res.json();
                    }),
            catch: (error) => new Error(`Nado symbols fetch failed: ${error instanceof Error ? error.message : String(error)}`)
        }),
        Effect.flatMap((data) => Schema.decodeUnknown(SymbolsResponse)(data)),
        Effect.map((response) => response.data.symbols),
        Effect.catchAll(() => Effect.succeed({} as Record<string, NadoSymbol>))
    );

const getPerpProducts = (): Effect.Effect<NadoPerpProduct[], Error> =>
    pipe(
        Effect.tryPromise({
            try: () =>
                fetch(NADO_API, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept-Encoding": "gzip",
                    },
                    body: JSON.stringify({
                        type: "all_products",
                    }),
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error(`Nado API error: ${res.status}`);
                        }
                        return res.json();
                    }),
            catch: (error) => new Error(`Nado products fetch failed: ${error instanceof Error ? error.message : String(error)}`)
        }),
        Effect.flatMap((data) => Schema.decodeUnknown(AllProductsResponse)(data)),
        Effect.map((response) => [...response.data.perp_products]),
        Effect.catchAll(() => Effect.succeed([] as NadoPerpProduct[]))
    );

const convertFromX18ToHourlyPercentage = (rateX18: string): number => {
    try {
        const rateBigInt = BigInt(rateX18);
        const percentageX18 = (rateBigInt * 10000n) / 1_000_000_000_000_000_000n;
        const hourlyPercentage = Number(percentageX18) / 24 / 100;
        return hourlyPercentage;
    } catch (error) {
        console.warn('Failed to convert X18 rate to hourly percentage:', rateX18, error);
        return 0;
    }
};

// Fetch funding rates for multiple products in a single request
const fetchFundingRatesForProducts = (productIds: number[]): Effect.Effect<Record<number, string>, Error> =>
    pipe(
        Effect.tryPromise({
            try: () =>
                fetch(NADO_ARCHIVE_API, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept-Encoding": "gzip",
                    },
                    body: JSON.stringify({
                        funding_rates: {
                            product_ids: productIds
                        }
                    }),
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error(`Nado Archive API error: ${res.status} ${res.statusText}`);
                        }
                        return res.json();
                    }),
            catch: (error) => new Error(`Nado funding rates fetch failed: ${error instanceof Error ? error.message : String(error)}`)
        }),
        Effect.flatMap((data) => Schema.decodeUnknown(MultipleFundingRatesResponse)(data)),
        Effect.map((response) => {
            const ratesMap: Record<number, string> = {};
            Object.entries(response).forEach(([productIdStr, rateData]) => {
                const productId = parseInt(productIdStr, 10);
                ratesMap[productId] = rateData.funding_rate_x18;
            });
            return ratesMap;
        }),
        Effect.catchAll((error) => {
            console.warn('Nado Archive API error for funding rates:', error);
            return Effect.succeed({} as Record<number, string>);
        })
    );

// Main function to get all funding rates using the proper API
const getAllFundingRatesUncached = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        Effect.all([getSymbols(), getPerpProducts()], { concurrency: 2 }),
        Effect.flatMap(([symbols, products]) => {
            if (products.length === 0) {
                return Effect.succeed([]);
            }

            // Extract product IDs for batch request
            const productIds = products.map(p => p.product_id);
            
            // Create a map of product_id to symbol name
            const productIdToSymbol = new Map<number, string>();
            Object.entries(symbols)
                .filter(([, symbol]) => symbol.type === "perp")
                .forEach(([symbolName, symbolData]) => {
                    productIdToSymbol.set(symbolData.product_id, symbolName);
                });

            // Fetch funding rates for all products
            return fetchFundingRatesForProducts(productIds).pipe(
                Effect.map((ratesMap) => {
                    // Map products to funding rates using the fetched rates
                    const currentTime = Date.now();
                    return products.map((product) => {
                        const symbolName = productIdToSymbol.get(product.product_id) || `PRODUCT-${product.product_id}`;
                        const rawRateX18 = ratesMap[product.product_id] || "0";
                        const hourlyRate = convertFromX18ToHourlyPercentage(rawRateX18);
                        
                        return {
                            symbol: symbolName,
                            baseAsset: (symbolName.split("-")[0] || symbolName).replace(/^k/, ''),
                            estimatedFundingRate: hourlyRate.toString(),
                            lastSettlementRate: hourlyRate.toString(),
                            lastSettlementTime: currentTime - 3600000,
                            nextFundingTime: currentTime + 3600000,
                            fundingInterval: 3600000,
                        };
                    });
                })
            );
        }),
        Effect.catchAll((error) => {
            console.warn('Nado API error, returning empty array:', error);
            return Effect.succeed([]);
        })
    );

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
    cachedExchangeCall(
        "nado",
        "fundingRates",
        "all",
        getAllFundingRatesUncached()
    );

// Optional: Export single funding rate function for future use
export const getSingleFundingRate = (productId: number): Effect.Effect<number | null, Error> =>
    pipe(
        Effect.tryPromise({
            try: () =>
                fetch(NADO_ARCHIVE_API, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept-Encoding": "gzip",
                    },
                    body: JSON.stringify({
                        funding_rate: {
                            product_id: productId
                        }
                    }),
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error(`Nado Archive API error: ${res.status} ${res.statusText}`);
                        }
                        return res.json();
                    }),
            catch: (error) => new Error(`Nado single funding rate fetch failed: ${error instanceof Error ? error.message : String(error)}`)
        }),
        Effect.flatMap((data) => Schema.decodeUnknown(SingleFundingRateResponse)(data)),
        Effect.map((response) => convertFromX18ToHourlyPercentage(response.funding_rate_x18)),
        Effect.catchAll((error) => {
            console.warn(`Nado Archive API error for product ${productId}:`, error);
            return Effect.succeed(null);
        })
    );