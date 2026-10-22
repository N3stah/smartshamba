import assert from 'assert';
import { evaluatePolicy } from './policy';
import { DecisionInput, ForecastData } from './types';

function runTests() {
  console.log("Running Decision Engine Policy Tests...");

  const baseInput: DecisionInput = {
    batchId: 'batch-1',
    bagSizeKg: 90,
    commodity: 'Maize',
    farmerCounty: 'Trans Nzoia',
    breakEvenPricePerBag: 3000,
    currentOffers: [],
    marketObservations: [],
    forecast: null,
    transportCostPerBag: 500
  };

  // Test 1: Missing bag size
  const test1 = evaluatePolicy({ ...baseInput, bagSizeKg: 0 });
  assert.strictEqual(test1.action, 'INSUFFICIENT_EVIDENCE');
  assert.strictEqual(test1.reason, 'MISSING_BAG_SIZE');
  console.log('✓ Test 1: Missing bag size returns INSUFFICIENT_EVIDENCE');

  // Test 2: No executable offers
  const test2 = evaluatePolicy({ ...baseInput });
  assert.strictEqual(test2.action, 'INSUFFICIENT_EVIDENCE');
  assert.strictEqual(test2.reason, 'NO_EXECUTABLE_OFFERS');
  console.log('✓ Test 2: No offers returns INSUFFICIENT_EVIDENCE');

  // Test 3: Missing transport cost
  const test3 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    transportCostPerBag: null
  });
  assert.strictEqual(test3.action, 'INSUFFICIENT_EVIDENCE');
  assert.strictEqual(test3.reason, 'MISSING_TRANSPORT_COST');
  console.log('✓ Test 3: Missing transport cost returns INSUFFICIENT_EVIDENCE');

  // Test 4: Valid SELL recommendation
  const test4 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }]
  });
  assert.strictEqual(test4.action, 'SELL');
  assert.strictEqual(test4.recommendedOfferId, 'o1');
  assert.strictEqual(test4.expectedNetbackPerBag, 3500);
  console.log('✓ Test 4: Valid offer yields SELL with correct netback');

  // Test 5: Below break-even warning (but still SELL)
  const test5 = evaluatePolicy({ 
    ...baseInput, 
    breakEvenPricePerBag: 4000,
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 3500, quantityBags: 10, destinationCounty: 'Nairobi' }]
  });
  assert.strictEqual(test5.action, 'SELL');
  assert.ok(test5.warnings.some(w => w.includes('below break-even')));
  console.log('✓ Test 5: Below break-even offer still recommended with warning');

  // Test 6: Fallback forecast does not trigger HOLD
  const fallbackForecast: ForecastData = {
    predictedPriceKesPerKg: 100,
    lowerBound: 90,
    upperBound: 110,
    confidence: 'LOW',
    isFallback: true,
    boundType: 'HEURISTIC',
    modelVersion: 'v0.1-baseline',
    trainingDatasetVersion: '2024-05-20_v001',
    trainingDataCutoff: '2024-02-15',
    forecastHorizon: 7,
    predictionTimestamp: '2026-10-22T12:00:00.000Z'
  };
  const test6 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    forecast: fallbackForecast
  });
  assert.strictEqual(test6.action, 'SELL');
  console.log('✓ Test 6: Fallback forecast does not block SELL or trigger HOLD');

  // Test 7: Forecast metadata is preserved in INSUFFICIENT_EVIDENCE result
  const test7 = evaluatePolicy({ 
    ...baseInput, 
    forecast: fallbackForecast
  });
  assert.strictEqual(test7.action, 'INSUFFICIENT_EVIDENCE');
  assert.ok(test7.forecastMetadata, 'forecastMetadata should be present');
  assert.strictEqual(test7.forecastMetadata!.modelVersion, 'v0.1-baseline');
  assert.strictEqual(test7.forecastMetadata!.trainingDatasetVersion, '2024-05-20_v001');
  assert.strictEqual(test7.forecastMetadata!.trainingDataCutoff, '2024-02-15');
  assert.strictEqual(test7.forecastMetadata!.forecastHorizon, 7);
  assert.strictEqual(test7.forecastMetadata!.predictionTimestamp, '2026-10-22T12:00:00.000Z');
  assert.strictEqual(test7.forecastMetadata!.isFallback, true);
  assert.strictEqual(test7.forecastMetadata!.confidence, 'LOW');
  assert.strictEqual(test7.forecastMetadata!.boundType, 'HEURISTIC');
  console.log('✓ Test 7: Forecast metadata fully preserved in INSUFFICIENT_EVIDENCE result');

  // Test 8: Forecast metadata is preserved in SELL result
  const test8 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    forecast: fallbackForecast
  });
  assert.strictEqual(test8.action, 'SELL');
  assert.ok(test8.forecastMetadata, 'forecastMetadata should be present');
  assert.strictEqual(test8.forecastMetadata!.modelVersion, 'v0.1-baseline');
  assert.strictEqual(test8.forecastMetadata!.trainingDatasetVersion, '2024-05-20_v001');
  assert.strictEqual(test8.forecastMetadata!.trainingDataCutoff, '2024-02-15');
  assert.strictEqual(test8.forecastMetadata!.isFallback, true);
  console.log('✓ Test 8: Forecast metadata fully preserved in SELL result');

  // Test 9: forecastMetadata is null when no forecast is provided
  const test9 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }]
  });
  assert.strictEqual(test9.action, 'SELL');
  assert.strictEqual(test9.forecastMetadata, null);
  console.log('✓ Test 9: forecastMetadata is null when no forecast is provided');

  console.log("\nAll policy tests passed successfully!");
}

runTests();
