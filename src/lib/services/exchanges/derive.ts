import { Effect, pipe, Schema } from "effect";
import { safeFetch } from "../http";
import { FundingRate, DeriveInstrument } from "../types";

const InstrumentsResponse = Schema.Struct({
    id: Schema.Union(Schema.String, Schema.Number),
    result: Schema.Array(DeriveInstrument),
});

const DERIVE_API = "https://api.lyra.finance";

const getInstruments = (currency: string): Effect.Effect<DeriveInstrument[], Error> =>
    pipe(
        safeFetch(`${DERIVE_API}/public/get_instruments`, {
            method: "POST",
            body: JSON.stringify({
                currency,
                instrument_type: "perp",
                expired: false,
            }),
        }),
        Effect.flatMap(data => Schema.decodeUnknown(InstrumentsResponse)(data)),
        Effect.map(response => [...response.result]),
        Effect.catchAll(() => Effect.succeed([] as DeriveInstrument[]))
    );

const getAllCurrenciesInstruments = (): Effect.Effect<DeriveInstrument[], Error> =>
    pipe(
        Effect.all([
            getInstruments("BTC"),
            getInstruments("ETH"),
            getInstruments("SOL"),
        ], { concurrency: 3 }),
        Effect.map(([btcInstruments, ethInstruments, solInstruments]) => [
            ...btcInstruments,
            ...ethInstruments,
            ...solInstruments,
        ])
    );

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
    pipe(
        getAllCurrenciesInstruments(),
        Effect.map((instruments) =>
            instruments
                .filter(instrument => instrument.instrument_type === "perp" && instrument.perp_details)
                .map((instrument) => ({
                    symbol: instrument.instrument_name,
                    baseAsset: instrument.base_currency,
                    estimatedFundingRate: instrument.perp_details?.funding_rate || "0",
                    lastSettlementRate: instrument.perp_details?.funding_rate || "0",
                    lastSettlementTime: Date.now() - 3600000,
                    nextFundingTime: Date.now() + 3600000,
                    fundingInterval: 3600000,
                }))
        ),
        Effect.catchAll((error) => {
            console.warn('Derive API error, returning empty array:', error);
            return Effect.succeed([]);
        })
    );