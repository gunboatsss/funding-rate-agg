import { Effect, pipe } from "effect";
import { getAllExchangeData } from "$lib/services/aggregator";
import { json } from "@sveltejs/kit";

export async function GET() {
  try {
    const result = await pipe(
      getAllExchangeData(),
      Effect.runPromise
    );
    
    const status = result.map(ex => ({
      exchange: ex.exchange,
      status: ex.status,
      lastUpdate: ex.lastUpdate,
      rateCount: ex.rates.length,
      error: ex.error
    }));
    
    return json({ status });
  } catch (error) {
    console.error('Error in /api/status:', error);
    return json(
      { 
        error: 'Failed to fetch exchange status',
        status: []
      },
      { status: 500 }
    );
  }
}