import { Schema } from "effect";

export const FundingRate = Schema.Struct({
    symbol: Schema.String,
    baseAsset: Schema.String,
    estimatedFundingRate: Schema.String,
    lastSettlementRate: Schema.String,
    lastSettlementTime: Schema.Number,
    nextFundingTime: Schema.Number,
    fundingInterval: Schema.Number,
});

export type FundingRate = Schema.Schema.Type<typeof FundingRate>;

// Exchange-specific schemas for validation

export const NadoSymbol = Schema.Struct({
    type: Schema.String,
    product_id: Schema.Number,
    symbol: Schema.String,
    price_increment_x18: Schema.String,
    size_increment: Schema.String,
    min_size: Schema.String,
    maker_fee_rate_x18: Schema.String,
    taker_fee_rate_x18: Schema.String,
    long_weight_initial_x18: Schema.String,
    long_weight_maintenance_x18: Schema.String,
    max_open_interest_x18: Schema.Union(Schema.String, Schema.Null),
});

export type NadoSymbol = Schema.Schema.Type<typeof NadoSymbol>;

export const NadoPerpProduct = Schema.Struct({
    product_id: Schema.Number,
    oracle_price_x18: Schema.String,
    risk: Schema.Struct({
        long_weight_initial_x18: Schema.String,
        short_weight_initial_x18: Schema.String,
        long_weight_maintenance_x18: Schema.String,
        short_weight_maintenance_x18: Schema.String,
        price_x18: Schema.String,
    }),
    state: Schema.Struct({
        cumulative_funding_long_x18: Schema.String,
        cumulative_funding_short_x18: Schema.String,
        available_settle: Schema.String,
        open_interest: Schema.String,
    }),
    book_info: Schema.Struct({
        size_increment: Schema.String,
        price_increment_x18: Schema.String,
        min_size: Schema.String,
        collected_fees: Schema.String,
    }),
});

export type NadoPerpProduct = Schema.Schema.Type<typeof NadoPerpProduct>;

export const DerivePerpDetails = Schema.Struct({
    aggregate_funding: Schema.String,
    funding_rate: Schema.String,
    index: Schema.String,
    max_rate_per_hour: Schema.String,
    min_rate_per_hour: Schema.String,
    static_interest_rate: Schema.String,
});

export const DeriveInstrument = Schema.Struct({
    amount_step: Schema.String,
    base_asset_address: Schema.String,
    base_asset_sub_id: Schema.String,
    base_currency: Schema.String,
    base_fee: Schema.String,
    erc20_details: Schema.Union(Schema.Struct({
        borrow_index: Schema.String,
        decimals: Schema.Number,
        supply_index: Schema.String,
        underlying_erc20_address: Schema.String,
    }), Schema.Null),
    fifo_min_allocation: Schema.String,
    instrument_name: Schema.String,
    instrument_type: Schema.Union(
        Schema.Literal("erc20"),
        Schema.Literal("option"),
        Schema.Literal("perp")
    ),
    is_active: Schema.Boolean,
    maker_fee_rate: Schema.String,
    mark_price_fee_rate_cap: Schema.Union(Schema.String, Schema.Null),
    maximum_amount: Schema.String,
    minimum_amount: Schema.String,
    option_details: Schema.Union(Schema.Struct({
        expiry: Schema.Number,
        index: Schema.String,
        option_type: Schema.Union(Schema.Literal("C"), Schema.Literal("P")),
        settlement_price: Schema.Union(Schema.String, Schema.Null),
        strike: Schema.String,
    }), Schema.Null),
    perp_details: Schema.Union(DerivePerpDetails, Schema.Null),
    pro_rata_amount_step: Schema.String,
    pro_rata_fraction: Schema.String,
    quote_currency: Schema.String,
    scheduled_activation: Schema.Number,
    scheduled_deactivation: Schema.Union(Schema.Number, Schema.Null),
    taker_fee_rate: Schema.String,
    tick_size: Schema.String,
});

export type DeriveInstrument = Schema.Schema.Type<typeof DeriveInstrument>;

export const ParadexMarketSummary = Schema.Struct({
    ask: Schema.String,
    bid: Schema.String,
    created_at: Schema.Number,
    delta: Schema.String,
    funding_rate: Schema.String,
    greeks: Schema.Any,
    last_traded_price: Schema.String,
    mark_price: Schema.String,
    open_interest: Schema.String,
    price_change_rate_24h: Schema.String,
    symbol: Schema.String,
    total_volume: Schema.String,
    underlying_price: Schema.String,
    volume_24h: Schema.String,
});

export type ParadexMarketSummary = Schema.Schema.Type<typeof ParadexMarketSummary>;

export const EtherealProduct = Schema.Struct({
    id: Schema.String,
    ticker: Schema.String,
    displayTicker: Schema.String,
    engineType: Schema.Number,
    onchainId: Schema.Number,
    blockNumber: Schema.String,
    baseTokenAddress: Schema.String,
    quoteTokenAddress: Schema.String,
    baseTokenName: Schema.String,
    quoteTokenName: Schema.String,
    lotSize: Schema.String,
    tickSize: Schema.String,
    makerFee: Schema.String,
    takerFee: Schema.String,
    maxQuantity: Schema.String,
    minQuantity: Schema.String,
    minPrice: Schema.String,
    maxPrice: Schema.String,
    volume24h: Schema.String,
    createdAt: Schema.Number,
    cumulativeFundingUsd: Schema.String,
    fundingUpdatedAt: Schema.Number,
    fundingRate1h: Schema.String,
    openInterest: Schema.String,
    maxLeverage: Schema.Number,
    maxOpenInterestUsd: Schema.String,
    maxPositionNotionalUsd: Schema.String,
    pythFeedId: Schema.Number,
});

export type EtherealProduct = Schema.Schema.Type<typeof EtherealProduct>;

export const LighterFundingRate = Schema.Struct({
    market_id: Schema.Number,
    exchange: Schema.String,
    symbol: Schema.String,
    rate: Schema.Number,
});

export type LighterFundingRate = Schema.Schema.Type<typeof LighterFundingRate>;

export const SynthetixMarket = Schema.Struct({
    symbol: Schema.String,
    description: Schema.String,
    baseAsset: Schema.String,
    quoteAsset: Schema.String,
    isOpen: Schema.Boolean,
    isCloseOnly: Schema.Boolean,
    priceExponent: Schema.Number,
    quantityExponent: Schema.Number,
    priceIncrement: Schema.String,
    minOrderSize: Schema.String,
    orderSizeIncrement: Schema.String,
    contractSize: Schema.Number,
    maxMarketOrderSize: Schema.String,
    maxLimitOrderSize: Schema.String,
    minOrderPrice: Schema.String,
    limitOrderPriceCapRatio: Schema.String,
    limitOrderPriceFloorRatio: Schema.String,
    marketOrderPriceCapRatio: Schema.String,
    marketOrderPriceFloorRatio: Schema.String,
    liquidationClearanceFee: Schema.String,
    minNotionalValue: Schema.String,
    maintenanceMarginTiers: Schema.Array(
        Schema.Struct({
            minPositionSize: Schema.String,
            maxPositionSize: Schema.String,
            maxLeverage: Schema.Number,
            initialMarginRequirement: Schema.String,
            maintenanceMarginRequirement: Schema.String,
        })
    ),
});

export type SynthetixMarket = Schema.Schema.Type<typeof SynthetixMarket>;