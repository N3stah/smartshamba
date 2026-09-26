import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const TYPE_CODE = { FARMER: 'FA', BUYER: 'BU', TRANSPORT: 'TR' } as const;

function yearLetter(date = new Date()): string {
  const baseYear = 2026; // 2026 = A
  return String.fromCharCode(65 + Math.max(0, date.getFullYear() - baseYear));
}

function randomSuffix(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function generateAndReserveSmartShambaId(
  type: keyof typeof TYPE_CODE,
  countyCode: string,
  entityId: string
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `SS-${TYPE_CODE[type]}-${countyCode}-${yearLetter()}-${randomSuffix()}`;
    
    try {
      // Atomically reserve the ID in the central registry
      await prisma.smartShambaIdentity.create({
        data: {
          smartshambaId: candidate,
          userType: type,
          entityId: entityId,
        }
      });
      return candidate;
    } catch (error: any) {
      // P2002 is Prisma's unique constraint violation error
      if (error.code === 'P2002') {
        console.warn(`[SmartShambaID] Collision on ${candidate}, retrying... (Attempt ${attempt + 1})`);
        continue;
      }
      throw error; // Re-throw unexpected errors
    }
  }
  throw new Error('Failed to generate a unique SmartShamba ID after 5 attempts');
}

// Helper to update the user record with the reserved ID
export async function assignSmartShambaId(
  userType: 'FARMER' | 'BUYER' | 'TRANSPORT',
  entityId: string,
  countyCode: string
): Promise<string> {
  const smartshambaId = await generateAndReserveSmartShambaId(userType, countyCode, entityId);
  
  if (userType === 'FARMER') {
    await prisma.farmer.update({ where: { id: entityId }, data: { smartshambaId } });
  } else if (userType === 'BUYER') {
    await prisma.buyer.update({ where: { id: entityId }, data: { smartshambaId } });
  } else if (userType === 'TRANSPORT') {
    await prisma.transportProvider.update({ where: { id: entityId }, data: { smartshambaId } });
  }

  return smartshambaId;
}
