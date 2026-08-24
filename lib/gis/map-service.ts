// @ts-nocheck
// TODO: V2 - Re-enable type checking after Stage 6/7 schema is built
import { prisma } from '@/lib/prisma';
import { getBoundingBox, maskCoordinates } from './gis-service';

/**
 * Enterprise GIS Service Layer.
 * Centralizes all spatial queries to ensure consistent privacy and performance.
 */

export async function getMapDataForAdmin() {
  const [farmers, buyers, warehouses] = await Promise.all([
    prisma.farmer.findMany({ where: { latitude: { not: null } }, select: { id: true, name: true, latitude: true, longitude: true } }),
    prisma.buyer.findMany({ where: { latitude: { not: null } }, select: { id: true, name: true, latitude: true, longitude: true } }),
    (prisma as any).warehouse.findMany({ select: { id: true, name: true, latitude: true, longitude: true } })
  ]);
  
  // Admins see exact coordinates
  return {
    farmers: farmers.map(f => ({ ...f, type: 'FARMER' })),
    buyers: buyers.map(b => ({ ...b, type: 'BUYER' })),
    warehouses: warehouses.map(w => ({ ...w, type: 'WAREHOUSE' }))
  };
}

export async function getNearbySuppliersForBuyer(buyerId: string, lat: number, lng: number, radiusKm: number) {
  const bbox = getBoundingBox(lat, lng, radiusKm);
  
  const farmers = await prisma.farmer.findMany({
    where: {
      latitude: bbox.latitude,
      longitude: bbox.longitude,
      ProduceListing: { some: { status: 'ACTIVE' } }
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      village: true,
      // Check if there is an accepted/executed transaction with this specific buyer
      transactions: { 
        where: { buyerId: buyerId, status: { in: ['CONFIRMED', 'DELIVERED', 'SETTLED'] } },
        select: { id: true } 
      }
    }
  });

  // Privacy Logic: Mask coordinates unless a transaction has been agreed upon
  return farmers.map(f => {
    const hasAccess = f.transactions.length > 0;
    const coords = hasAccess ? { lat: f.latitude!, lng: f.longitude! } : maskCoordinates(f.latitude!, f.longitude!);
    
    return {
      id: f.id,
      name: f.name,
      village: f.village,
      latitude: coords.lat,
      longitude: coords.lng,
      isExact: hasAccess // Flag for UI to show lock icon if masked
    };
  });
}
