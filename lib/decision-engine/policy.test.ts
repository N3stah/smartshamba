import assert from 'assert';
import { evaluatePolicy } from './policy';
import { DecisionInput, ForecastData, MarketObservation } from './types';

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

  // === NEW TESTS FOR TASK 2 ===

  // Test 10: HOLD threshold boundary - exactly 5% higher should NOT trigger HOLD (uses >)
  // Using bagSizeKg=100 for clean math
  // bestOption.netback = 4000 (offer 4500, transport 500)
  // 5% threshold = 4200
  // forecastNetback = 4200 (exactly at threshold, should NOT trigger HOLD)
  // forecastPerKg = (4200 + 500) / 100 = 47.0
  const thresholdInput: DecisionInput = {
    ...baseInput,
    bagSizeKg: 100,
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4500, quantityBags: 10, destinationCounty: 'Nairobi' }],
    transportCostPerBag: 500
  };
  const reliableForecast: ForecastData = {
    predictedPriceKesPerKg: 47.0, // Exactly at 5% threshold
    lowerBound: 45,
    upperBound: 49,
    confidence: 'MEDIUM',
    isFallback: false,
    boundType: 'STATISTICAL',
    modelVersion: 'v0.2-statistical',
    trainingDatasetVersion: '2024-06-01_v002',
    trainingDataCutoff: '2024-05-15',
    forecastHorizon: 7,
    predictionTimestamp: '2026-10-22T12:00:00.000Z'
  };
  const test10 = evaluatePolicy({ ...thresholdInput, forecast: reliableForecast });
  assert.strictEqual(test10.action, 'SELL', 'Exactly 5% should NOT trigger HOLD (uses >)');
  console.log('✓ Test 10: HOLD threshold boundary - exactly 5% higher returns SELL');

  // Test 11: HOLD threshold above - 6% higher should trigger HOLD
  // forecastNetback = 4000 * 1.06 = 4240
  // forecastPerKg = (4240 + 500) / 100 = 47.4
  const test11 = evaluatePolicy({ 
    ...thresholdInput, 
    forecast: { ...reliableForecast, predictedPriceKesPerKg: 47.4 }
  });
  assert.strictEqual(test11.action, 'HOLD');
  console.log('✓ Test 11: HOLD threshold above - 6% higher returns HOLD');

  // Test 12: REDIRECT - better alternative market exists
  // bestOption.netback = 3500 (offer 4000, transport 500, bagSize 90)
  // Alternative: wholesale 50 KES/kg in Nakuru
  // estimatedGrossPerBag = 50 * 90 = 4500
  // estimatedNetback = 4500 - 500 = 4000
  // 4000 > 3500 * 1.05 = 3675 -> REDIRECT
  const alternativeObs: MarketObservation = {
    id: 'obs-1',
    commodity: 'Maize',
    county: 'Nakuru',
    market: 'Nakuru Market',
    wholesaleKesPerKg: 50,
    retailKesPerKg: null,
    observedAt: new Date()
  };
  const test12 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    marketObservations: [alternativeObs]
  });
  assert.strictEqual(test12.action, 'REDIRECT');
  assert.ok(test12.rationale.includes('Nakuru'));
  assert.ok(test12.warnings.some(w => w.includes('not guaranteed')));
  console.log('✓ Test 12: REDIRECT - better alternative market exists');

  // Test 13: REDIRECT - stale alternative observation is filtered out
  const staleObs: MarketObservation = {
    ...alternativeObs,
    observedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
  };
  const test13 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    marketObservations: [staleObs]
  });
  assert.strictEqual(test13.action, 'SELL');
  console.log('✓ Test 13: REDIRECT - stale alternative observation filtered out');

  // Test 14: REDIRECT - missing transport cost prevents evaluation (INSUFFICIENT_EVIDENCE)
  const test14 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    marketObservations: [alternativeObs],
    transportCostPerBag: null
  });
  assert.strictEqual(test14.action, 'INSUFFICIENT_EVIDENCE');
  assert.strictEqual(test14.reason, 'MISSING_TRANSPORT_COST');
  console.log('✓ Test 14: REDIRECT - missing transport cost returns INSUFFICIENT_EVIDENCE');

  // Test 15: REDIRECT - alternative netback lower than current
  // Alternative: wholesale 40 KES/kg
  // estimatedGrossPerBag = 40 * 90 = 3600
  // estimatedNetback = 3600 - 500 = 3100
  // 3100 < 3675 (5% threshold) -> SELL
  const lowerAltObs: MarketObservation = {
    ...alternativeObs,
    wholesaleKesPerKg: 40
  };
  const test15 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    marketObservations: [lowerAltObs]
  });
  assert.strictEqual(test15.action, 'SELL');
  console.log('✓ Test 15: REDIRECT - lower alternative netback returns SELL');

  // Test 16: Weather HIGH risk - warning added but SELL still recommended
  const test16 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    weatherRisk: 'HIGH'
  });
  assert.strictEqual(test16.action, 'SELL');
  assert.ok(test16.warnings.some(w => w.includes('Transport risk is high')));
  console.log('✓ Test 16: Weather HIGH risk - warning added, SELL still recommended');

  // Test 17: Weather UNAVAILABLE - warning added
  const test17 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    weatherRisk: 'UNAVAILABLE'
  });
  assert.strictEqual(test17.action, 'SELL');
  assert.ok(test17.warnings.some(w => w.includes('Weather risk assessment unavailable')));
  console.log('✓ Test 17: Weather UNAVAILABLE - warning added');

  // Test 18: Weather NONE - no weather warning
  const test18 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    weatherRisk: 'NONE'
  });
  assert.strictEqual(test18.action, 'SELL');
  assert.ok(!test18.warnings.some(w => w.includes('Weather')));
  console.log('✓ Test 18: Weather NONE - no weather warning added');

  console.log("\nAll 18 policy tests passed successfully!");
}

runTests();
