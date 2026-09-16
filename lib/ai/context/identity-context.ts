import { prisma } from '@/lib/prisma';
import { StaffRole } from '@prisma/client';

export interface IdentityContext {
  name: string;
  role: string;
  language: string;
  isFrozen: boolean;
  countyId: string | null;
  staffRole?: StaffRole;
}

export async function getFarmerIdentity(farmerId: string): Promise<IdentityContext | null> {
  const farmer = await prisma.farmer.findUnique({
    where: { id: farmerId },
    select: { name: true, language: true, isFrozen: true, countyId: true }
  });
  if (!farmer) return null;
  return { name: farmer.name || 'Farmer', role: 'FARMER', language: farmer.language || 'en', isFrozen: farmer.isFrozen, countyId: farmer.countyId };
}

export async function getBuyerIdentity(buyerId: string): Promise<IdentityContext | null> {
  const buyer = await prisma.buyer.findUnique({
    where: { id: buyerId },
    select: { name: true, language: true, isFrozen: true, countyId: true }
  });
  if (!buyer) return null;
  return { name: buyer.name, role: 'BUYER', language: buyer.language || 'en', isFrozen: buyer.isFrozen, countyId: buyer.countyId };
}

export async function getStaffIdentity(staffId: string, staffRole: StaffRole): Promise<IdentityContext | null> {
  const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { name: true } });
  if (!staff) return null;
  return { name: staff.name, role: 'STAFF', language: 'en', isFrozen: false, countyId: null, staffRole };
}
