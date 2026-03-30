/**
 * Simple test script to verify Nado service implementation
 * This can be run to verify the new funding rate API integration
 */

import { getAllFundingRates } from '../src/lib/services/exchanges/nado.ts';
import { Effect } from 'effect';

// Test the Nado service
const testNadoService = async () => {
  console.log('Testing Nado service with new funding rate API...');
  
  try {
    const result = await Effect.runPromise(getAllFundingRates());
    
    console.log(`Successfully fetched ${result.length} funding rates from Nado`);
    
    if (result.length > 0) {
      console.log('Sample funding rate:', result[0]);
      console.log('Rate format check:', {
        symbol: result[0].symbol,
        baseAsset: result[0].baseAsset,
        estimatedFundingRate: result[0].estimatedFundingRate,
        numericValue: parseFloat(result[0].estimatedFundingRate),
        isPercentage: Math.abs(parseFloat(result[0].estimatedFundingRate)) < 1 // Should be small percentage
      });
    }
    
    // Verify rate values are reasonable (should be small percentages like 0.001, -0.0005, etc.)
    const hasValidRates = result.every(rate => {
      const numericRate = parseFloat(rate.estimatedFundingRate);
      return !isNaN(numericRate) && Math.abs(numericRate) < 0.1; // Rates should be < 10%
    });
    
    console.log('Rate validation:', hasValidRates ? '✅ All rates look valid' : '❌ Some rates look suspicious');
    
  } catch (error) {
    console.error('❌ Nado service test failed:', error);
  }
};

// Only run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testNadoService();
}

export { testNadoService };