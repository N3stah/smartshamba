import { MarketObservation } from './types';

export const MARKET_EVIDENCE_FRESHNESS_DAYS = 30;

export function filterValidObservations(
  observations: MarketObservation[],
  targetCommodity: string,
  targetCounty: string,
  asOfDate: Date = new Date()
): MarketObservation[] {
  const staleThreshold = new Date(asOfDate.getTime() - MARKET_EVIDENCE_FRESHNESS_DAYS * 24 * 60 * 60 * 1000);
  
  return observations.filter(obs => {
    // Must match commodity
    if (obs.commodity.toLowerCase() !== targetCommodity.toLowerCase()) return false;
    
    // Must be local (no silent national fallback)
    if (obs.county.toLowerCase() !== targetCounty.toLowerCase()) return false;
    
    // Must not be future-dated
    if (new Date(obs.observedAt) > asOfDate) return false;
    
    // Must not be stale
    if (new Date(obs.observedAt) < staleThreshold) return false;
    
    // Must have at least one price
    if (obs.wholesaleKesPerKg === null && obs.retailKesPerKg === null) return false;
    
    return true;
  });
}
