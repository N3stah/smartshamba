import * as Sentry from '@sentry/nextjs';

// County coordinates for distance calculation (Haversine formula)
const COUNTY_COORDS: Record<string, { lat: number, lon: number }> = {
  'Trans Nzoia': { lat: 1.0167, lon: 34.9833 },
  'Uasin Gishu': { lat: 0.5143, lon: 35.2698 },
  'Nakuru': { lat: -0.3031, lon: 36.0800 },
  'Kakamega': { lat: 0.2827, lon: 34.7519 },
  'Bungoma': { lat: 0.5635, lon: 34.5608 },
  'Busia': { lat: 0.4600, lon: 34.1110 },
  'Kericho': { lat: -0.3673, lon: 35.2833 },
  'Nairobi': { lat: -1.2864, lon: 36.8172 }
};

/**
 * Calculates distance between two counties in Km using Haversine formula.
 */
export function calculateDistance(county1: string, county2: string): number {
  try {
    const c1 = COUNTY_COORDS[county1] || COUNTY_COORDS['Nairobi'];
    const c2 = COUNTY_COORDS[county2] || COUNTY_COORDS['Nairobi'];
    
    const R = 6371; // Earth radius in km
    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
    const dLon = (c2.lon - c1.lon) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  } catch (e) {
    console.error('[Transport] Distance calc failed:', e);
    return 50; // Fallback 50km
  }
}

/**
 * Estimates transport cost based on distance, bags, and provider rate.
 */
export function estimateCost(distanceKm: number, bags: number, ratePerKm: number): number {
  // Base cost calculation: Distance * Rate * Bag Factor
  // Bag factor accounts for weight/volume (e.g., 1 bag = 90kg)
  // For simplicity: Cost = Distance * Rate * (1 + (bags * 0.05))
  // This means 20 bags adds 100% to the base rate.
  const bagFactor = 1 + (bags * 0.05);
  const cost = distanceKm * ratePerKm * bagFactor;
  return Math.round(cost);
}
