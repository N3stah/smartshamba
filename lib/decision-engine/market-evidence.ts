import { MarketObservation } from './types';

export const MARKET_EVIDENCE_FRESHNESS_DAYS = 30;

/**
 * Filters market observations for the farmer's local market.
 * Used to find comparable local evidence.
 */
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

/**
 * Filters market observations for ALTERNATIVE markets (different county/market).
 * Used to evaluate REDIRECT opportunities.
 * Preserves the same freshness and commodity validation as local filtering,
 * but EXCLUDES the farmer's own county to find genuinely different markets.
 */
export function filterAlternativeMarketObservations(
  observations: MarketObservation[],
  targetCommodity: string,
  excludeCounty: string,
  asOfDate: Date = new Date()
): MarketObservation[] {
  const staleThreshold = new Date(asOfDate.getTime() - MARKET_EVIDENCE_FRESHNESS_DAYS * 24 * 60 * 60 * 1000);
  
  return observations.filter(obs => {
    // Must match commodity
    if (obs.commodity.toLowerCase() !== targetCommodity.toLowerCase()) return false;
    
    // Must be from a DIFFERENT county (alternative market)
    if (obs.county.toLowerCase() === excludeCounty.toLowerCase()) return false;
    
    // Must not be future-dated
    if (new Date(obs.observedAt) > asOfDate) return false;
    
    // Must not be stale
    if (new Date(obs.observedAt) < staleThreshold) return false;
    
    // Must have at least one price
    if (obs.wholesaleKesPerKg === null && obs.retailKesPerKg === null) return false;
    
    return true;
  });
}
