import assert from 'assert';
import { validateTransportCostEstimate, validateEvidenceInput } from './validation';

function runTests() {
  console.log('Running Validation Tests...');

  // === Transport Cost Validation ===
  
  // Test 1: Valid transport cost
  assert.strictEqual(validateTransportCostEstimate('200'), 200);
  console.log('✓ Test 1: Valid transport cost returns parsed number');

  // Test 2: Valid transport cost with decimals
  assert.strictEqual(validateTransportCostEstimate('150.50'), 150.50);
  console.log('✓ Test 2: Valid transport cost with decimals');

  // Test 3: Empty string returns null
  assert.strictEqual(validateTransportCostEstimate(''), null);
  console.log('✓ Test 3: Empty string returns null');

  // Test 4: null returns null
  assert.strictEqual(validateTransportCostEstimate(null), null);
  console.log('✓ Test 4: null returns null');

  // Test 5: undefined returns null
  assert.strictEqual(validateTransportCostEstimate(undefined), null);
  console.log('✓ Test 5: undefined returns null');

  // Test 6: Negative returns null
  assert.strictEqual(validateTransportCostEstimate('-100'), null);
  console.log('✓ Test 6: Negative returns null');

  // Test 7: NaN returns null
  assert.strictEqual(validateTransportCostEstimate('abc'), null);
  console.log('✓ Test 7: Non-numeric returns null');

  // Test 8: Infinity returns null
  assert.strictEqual(validateTransportCostEstimate('Infinity'), null);
  console.log('✓ Test 8: Infinity returns null');

  // Test 9: Exceeds max returns null
  assert.strictEqual(validateTransportCostEstimate('10001'), null);
  console.log('✓ Test 9: Exceeds 10,000 returns null');

  // Test 10: More than 2 decimal places returns null
  assert.strictEqual(validateTransportCostEstimate('100.123'), null);
  console.log('✓ Test 10: More than 2 decimal places returns null');

  // Test 11: Zero is valid (free transport)
  assert.strictEqual(validateTransportCostEstimate('0'), 0);
  console.log('✓ Test 11: Zero is valid');

  // === Evidence Input Validation ===

  // Test 12: All fields valid
  const result1 = validateEvidenceInput({
    photoRef: 'https://example.com/photo.jpg',
    weightKg: '90',
    moistureLevel: '13.5',
    qualityNote: 'Good quality'
  });
  assert.strictEqual(result1.valid, true);
  assert.strictEqual(result1.data?.weightKg, 90);
  assert.strictEqual(result1.data?.moistureLevel, 13.5);
  console.log('✓ Test 12: All evidence fields valid');

  // Test 13: All fields empty is valid (optional)
  const result2 = validateEvidenceInput({});
  assert.strictEqual(result2.valid, true);
  assert.strictEqual(result2.data?.photoRef, null);
  console.log('✓ Test 13: All fields empty is valid');

  // Test 14: Weight negative is invalid
  const result3 = validateEvidenceInput({ weightKg: '-10' });
  assert.strictEqual(result3.valid, false);
  assert.ok(result3.errors.some(e => e.includes('Weight')));
  console.log('✓ Test 14: Negative weight is invalid');

  // Test 15: Moisture > 100 is invalid
  const result4 = validateEvidenceInput({ moistureLevel: '150' });
  assert.strictEqual(result4.valid, false);
  assert.ok(result4.errors.some(e => e.includes('Moisture')));
  console.log('✓ Test 15: Moisture > 100 is invalid');

  // Test 16: Photo ref too long is invalid
  const result5 = validateEvidenceInput({ photoRef: 'a'.repeat(501) });
  assert.strictEqual(result5.valid, false);
  assert.ok(result5.errors.some(e => e.includes('Photo reference')));
  console.log('✓ Test 16: Photo ref too long is invalid');

  // Test 17: Weight 0 is invalid (must be positive)
  const result6 = validateEvidenceInput({ weightKg: '0' });
  assert.strictEqual(result6.valid, false);
  console.log('✓ Test 17: Weight 0 is invalid');

  console.log('\nAll validation tests passed successfully!');
}

runTests();
