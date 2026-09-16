import { prisma } from '@/lib/prisma';

export interface TransportContext {
  activeTransport: { status: string; isHalted: boolean; pickupLocation: string; dropoffLocation: string }[];
}

export async function getFarmerTransportContext(farmerId: string): Promise<TransportContext> {
  const activeTransport = await prisma.transportBooking.findMany({
    where: { farmerId, status: { in: ['ACCEPTED', 'LOADED', 'IN_TRANSIT'] } },
    take: 2,
    select: { status: true, isHalted: true, pickupLocation: true, dropoffLocation: true }
  });
  return { activeTransport };
}

export async function getBuyerTransportContext(buyerId: string): Promise<TransportContext> {
  const activeTransport = await prisma.transportBooking.findMany({
    where: { bookedById: buyerId, bookedByType: 'BUYER', status: { in: ['ACCEPTED', 'LOADED', 'IN_TRANSIT'] } },
    take: 2,
    select: { status: true, isHalted: true, pickupLocation: true, dropoffLocation: true }
  });
  return { activeTransport };
}
