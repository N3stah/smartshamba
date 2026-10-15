import assert from 'assert';
import { evaluatePolicy } from './policy';
import { DecisionInput } from './types';

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
  console.log('✓ Test 4: Below break-even offer still recommended with warning');

  // Test 6: Fallback forecast does not trigger HOLD
  const test6 = evaluatePolicy({ 
    ...baseInput, 
    currentOffers: [{ id: 'o1', buyerId: 'b1', commodity: 'Maize', pricePerBag: 4000, quantityBags: 10, destinationCounty: 'Nairobi' }],
    forecast: {
      predictedPriceKesPerKg: 100, // 9000/bag
      lowerBound: 90,
      upperBound: 110,
      confidence: 'LOW',
      isFallback: true,
      boundType: 'HEURISTIC'
    }
  });
  assert.strictEqual(test6.action, 'SELL');
  console.log('✓ Test 6: Fallback forecast does not block SELL or trigger HOLD');

  console.log("\nAll policy tests passed successfully!");
}

runTests();
