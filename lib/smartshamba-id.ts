import { Prisma } from '@prisma/client';
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
  entityId: string,
  tx: Prisma.TransactionClient
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `SS-${TYPE_CODE[type]}-${countyCode}-${yearLetter()}-${randomSuffix()}`;
    
    try {
      await tx.smartShambaIdentity.create({
        data: {
          smartshambaId: candidate,
          userType: type,
          entityId: entityId,
        }
      });
      return candidate;
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.warn(`[SmartShambaID] Collision on ${candidate}, retrying... (Attempt ${attempt + 1})`);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to generate a unique SmartShamba ID after 5 attempts');
}

export async function assignSmartShambaId(
  userType: 'FARMER' | 'BUYER' | 'TRANSPORT',
  entityId: string,
  countyCode: string,
  tx: Prisma.TransactionClient
): Promise<string> {
  const smartshambaId = await generateAndReserveSmartShambaId(userType, countyCode, entityId, tx);
  
  if (userType === 'FARMER') {
    await tx.farmer.update({ where: { id: entityId }, data: { smartshambaId } });
  } else if (userType === 'BUYER') {
    await tx.buyer.update({ where: { id: entityId }, data: { smartshambaId } });
  } else if (userType === 'TRANSPORT') {
    await tx.transportProvider.update({ where: { id: entityId }, data: { smartshambaId } });
  }

  return smartshambaId;
}
