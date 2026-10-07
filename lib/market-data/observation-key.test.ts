import { generateObservationKey } from './observation-key';
import assert from 'assert';

function runTests() {
  console.log("Running Observation Key Tests...");

  const baseObs = {
    source: 'KAMIS',
    sourceRecordId: 'KAMIS-123',
    county: 'Trans Nzoia',
    market: 'Kitale',
    commodity: 'Maize',
    classification: 'White',
    grade: 'Grade 1',
    observedAt: '2023-10-01T00:00:00.000Z'
  };

  // 1. Same inputs -> same key
  const key1 = generateObservationKey(baseObs);
  const key2 = generateObservationKey(baseObs);
  assert.strictEqual(key1, key2, 'Test 1 Failed: Same inputs should produce same key');
  console.log('✓ Test 1: Same inputs produce same key');

  // 2. Different grade -> different key
  const diffGrade = { ...baseObs, grade: 'Grade 2' };
  const key3 = generateObservationKey(diffGrade);
  assert.notStrictEqual(key1, key3, 'Test 2 Failed: Different grade should produce different key');
  console.log('✓ Test 2: Different grade produces different key');

  // 3. Null sourceRecordId vs undefined sourceRecordId -> same key
  const nullId = { ...baseObs, sourceRecordId: null };
  const undefId = { ...baseObs, sourceRecordId: undefined };
  const key4 = generateObservationKey(nullId);
  const key5 = generateObservationKey(undefId);
  assert.strictEqual(key4, key5, 'Test 3 Failed: Null and undefined should produce same key');
  console.log('✓ Test 3: Null and undefined sourceRecordId produce same key');

  // 4. Different case (normalization check) -> same key
  const upperCaseObs = {
    ...baseObs,
    county: 'TRANS NZOIA',
    market: 'KITALE',
    commodity: 'MAIZE'
  };
  const key6 = generateObservationKey(upperCaseObs);
  assert.strictEqual(key1, key6, 'Test 4 Failed: Case differences should produce same key');
  console.log('✓ Test 4: Case differences produce same key');

  console.log("\nAll tests passed successfully!");
}

runTests();
