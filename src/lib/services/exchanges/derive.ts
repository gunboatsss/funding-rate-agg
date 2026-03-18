import { Effect, pipe, Schema } from "effect";
import { safeFetch } from "../http";
import { FundingRate, DeriveInstrument } from "../types";

const PaginationInfo = Schema.Struct({
	count: Schema.Number,
	num_pages: Schema.Number,
});

const AllInstrumentsResponse = Schema.Struct({
	id: Schema.Union(Schema.String, Schema.Number),
	result: Schema.Struct({
		instruments: Schema.Array(DeriveInstrument),
		pagination: PaginationInfo,
	}),
});

const DERIVE_API = "https://api.lyra.finance";

const getAllInstruments = (): Effect.Effect<DeriveInstrument[], Error> =>
	pipe(
		safeFetch(`${DERIVE_API}/public/get_all_instruments`, {
			method: "POST",
			body: JSON.stringify({
				expired: false,
				instrument_type: "perp",
				currency: null,
				page: 1,
				page_size: 1000,
			}),
		}),
		Effect.flatMap((data) => Schema.decodeUnknown(AllInstrumentsResponse)(data)),
		Effect.map((response) => [...response.result.instruments]),
		Effect.catchAll(() => Effect.succeed([] as DeriveInstrument[])),
	);

export const getAllFundingRates = (): Effect.Effect<FundingRate[], Error> =>
	pipe(
		getAllInstruments(),
		Effect.map((instruments) =>
			instruments
				.filter(
					(instrument) =>
						instrument.instrument_type === "perp" && instrument.perp_details,
				)
				.map((instrument) => ({
					symbol: instrument.instrument_name,
					baseAsset: instrument.base_currency,
					estimatedFundingRate: (parseFloat(instrument.perp_details?.funding_rate || "0") * 100).toString(),
					lastSettlementRate: (parseFloat(instrument.perp_details?.funding_rate || "0") * 100).toString(),
					lastSettlementTime: Date.now() - 3600000,
					nextFundingTime: Date.now() + 3600000,
					fundingInterval: 3600000,
				})),
		),
		Effect.catchAll((error) => {
			console.warn("Derive API error, returning empty array:", error);
			return Effect.succeed([]);
		}),
	);
