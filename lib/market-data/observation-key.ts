import { createHash } from 'crypto';

export interface ObservationIdentity {
  source: string;
  sourceRecordId?: string | null;
  county: string;
  market: string;
  commodity: string;
  classification?: string | null;
  grade?: string | null;
  observedAt: Date | string;
}

/**
 * Generates a deterministic idempotency key for a MarketPriceObservation.
 * 
 * Identity Dimensions:
 * - source
 * - sourceRecordId (if available)
 * - county
 * - market
 * - commodity
 * - classification (if available)
 * - grade (if available)
 * - observedAt (ISO string)
 * 
 * Two legitimately different observations (e.g., different grade) will produce different keys.
 * Re-importing the same observation will produce the same key, preventing duplicates.
 */
export function generateObservationKey(identity: ObservationIdentity): string {
  const normalize = (val?: string | null): string => {
    if (!val) return 'NULL';
    return val.trim().toLowerCase();
  };

  const observedAtStr = typeof identity.observedAt === 'string' 
    ? new Date(identity.observedAt).toISOString()
    : identity.observedAt.toISOString();

  const identityString = [
    normalize(identity.source),
    normalize(identity.sourceRecordId),
    normalize(identity.county),
    normalize(identity.market),
    normalize(identity.commodity),
    normalize(identity.classification),
    normalize(identity.grade),
    observedAtStr
  ].join('|');

  return createHash('sha256').update(identityString).digest('hex');
}
