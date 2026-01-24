import { Effect, pipe, Schema } from "effect";
import { withFallback } from "../http";
import { FundingRate, NadoSymbol, NadoPerpProduct } from "../types";
import { cachedExchangeCall } from "../cache";

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

const getAllFundingRatesUncached = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        Effect.all([getSymbols(), getPerpProducts()], { concurrency: 2 }),
        Effect.map(([symbols, products]) => {
            // Create a map of product_id to symbol name
            const productIdToSymbol = new Map<number, string>();
            Object.entries(symbols)
                .filter(([, symbol]) => symbol.type === "perp")
                .forEach(([symbolName, symbolData]) => {
                    productIdToSymbol.set(symbolData.product_id, symbolName);
                });

            // Map products to funding rates using symbol names
            return products.map((product) => {
                const symbolName = productIdToSymbol.get(product.product_id) || `PRODUCT-${product.product_id}`;
                const cumulativeFunding = BigInt(product.state.cumulative_funding_long_x18);
                
                return {
                    symbol: symbolName,
                    baseAsset: symbolName.split("-")[0] || symbolName,
                    estimatedFundingRate: "0", // Nado provides cumulative funding, not rate
                    lastSettlementRate: cumulativeFunding > 0n ? (cumulativeFunding / 1000000000000000000n).toString() : "0",
                    lastSettlementTime: Date.now() - 3600000,
                    nextFundingTime: Date.now() + 3600000,
                    fundingInterval: 3600000,
                };
            });
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