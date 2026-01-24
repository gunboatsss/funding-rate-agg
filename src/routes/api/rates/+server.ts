import { Effect, pipe } from "effect";
import { getAggregatedData } from "$lib/services/aggregator";
import { json } from "@sveltejs/kit";

export async function GET() {
  try {
    const result = await pipe(
      getAggregatedData(),
      Effect.runPromise
    );
    
    return json(result);
  } catch (error) {
    console.error('Error in /api/rates:', error);
    return json(
      { 
        error: 'Failed to fetch funding rates',
        byExchange: [],
        bySymbol: {},
        totalRates: 0,
        lastUpdate: Date.now()
      },
      { status: 500 }
    );
  }
}