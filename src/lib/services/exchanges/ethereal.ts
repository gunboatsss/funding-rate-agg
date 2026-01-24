import { Effect, pipe, Schema } from "effect";
import { safeFetch } from "../http";
import { FundingRate, EtherealProduct } from "../types";

const ProductsResponse = Schema.Struct({
    data: Schema.Array(EtherealProduct),
    hasNext: Schema.Boolean,
});

const ETHEREAL_API = "https://api.ethereal.trade/v1";

const getProducts = (): Effect.Effect<EtherealProduct[], Error> =>
    pipe(
        safeFetch(`${ETHEREAL_API}/product?order=asc&orderBy=createdAt`),
        Effect.flatMap(data => Schema.decodeUnknown(ProductsResponse)(data)),
        Effect.map(response => [...response.data]),
        Effect.catchAll(() => Effect.succeed([] as EtherealProduct[]))
    );

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        getProducts(),
        Effect.map((products) =>
            products.map((product) => ({
                symbol: product.displayTicker,
                baseAsset: product.baseTokenName,
                estimatedFundingRate: product.fundingRate1h,
                lastSettlementRate: product.fundingRate1h,
                lastSettlementTime: product.fundingUpdatedAt,
                nextFundingTime: product.fundingUpdatedAt + 3600000,
                fundingInterval: 3600000,
            }))
        ),
        Effect.catchAll((error) => {
            console.warn('Ethereal API error, returning empty array:', error);
            return Effect.succeed([]);
        })
    );