import { NormalizedMarketObservation, RawMarketRecord } from './types';

export function normalizeRecord(raw: RawMarketRecord): NormalizedMarketObservation | null {
  try {
    const price = parseFloat(raw.price_kes_per_kg);
    if (isNaN(price) || price <= 0) return null; // Reject invalid prices

    const observedAt = new Date(raw.date);
    if (isNaN(observedAt.getTime())) return null; // Reject invalid dates

    return {
      source: raw.source.trim(),
      sourceRecordId: null, // Phase 1B dataset does not contain explicit record IDs
      county: raw.county.trim(),
      market: raw.market.trim(),
      commodity: raw.commodity.trim(),
      classification: null,
      grade: null,
      wholesaleKesPerKg: price, // Assuming CSV contains wholesale prices
      retailKesPerKg: null,
      observedAt
    };
  } catch (e) {
    return null;
  }
}
