import * as Sentry from '@sentry/nextjs';

/**
 * Calculates distance between two coordinates in Km using Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  try {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 10) / 10; // Round to 1 decimal place
  } catch (e) {
    console.error('[GIS] Distance calc failed:', e);
    return 9999; // Return large number if invalid
  }
}

/**
 * Generates a bounding box for Prisma queries to find nearby users.
 */

/**
 * Masks exact coordinates to protect farmer privacy.
 * Adds up to ~500m of random noise.
 */
export function maskCoordinates(lat: number, lng: number): { lat: number, lng: number } {
  const noiseLat = (Math.random() - 0.5) * 0.005; // ~500m
  const noiseLng = (Math.random() - 0.5) * 0.005;
  return {
    lat: parseFloat((lat + noiseLat).toFixed(4)),
    lng: parseFloat((lng + noiseLng).toFixed(4))
  };
}

export function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  // 1 degree of latitude is approx 111 km
  const latDelta = radiusKm / 111;
  // 1 degree of longitude is approx 111 * cos(latitude) km
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  
  return {
    latitude: { gte: lat - latDelta, lte: lat + latDelta },
    longitude: { gte: lng - lngDelta, lte: lng + lngDelta }
  };
}
