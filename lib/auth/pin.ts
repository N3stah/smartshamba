import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as Sentry from '@sentry/nextjs';

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

export async function verifyFarmerPin(farmerId: string, pin: string): Promise<{ success: boolean; error?: string; locked?: boolean }> {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      select: { pin: true, pinFailedAttempts: true, pinLockedUntil: true }
    });

    if (!farmer) return { success: false, error: 'Farmer not found' };
    if (!farmer.pin) return { success: false, error: 'PIN not set. Please set your PIN on the web dashboard first.' };

    if (farmer.pinLockedUntil && farmer.pinLockedUntil > new Date()) {
      const minsLeft = Math.ceil((farmer.pinLockedUntil.getTime() - Date.now()) / 60000);
      return { success: false, locked: true, error: `Account locked. Try again in ${minsLeft} minutes.` };
    }

    const valid = await bcrypt.compare(pin, farmer.pin);
    
    if (valid) {
      if (farmer.pinFailedAttempts > 0) {
        await prisma.farmer.update({
          where: { id: farmerId },
          data: { pinFailedAttempts: 0, pinLockedUntil: null }
        });
      }
      return { success: true };
    }

    const newAttempts = farmer.pinFailedAttempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;
    
    await prisma.farmer.update({
      where: { id: farmerId },
      data: {
        pinFailedAttempts: newAttempts,
        ...(shouldLock && { pinLockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60000) })
      }
    });

    if (shouldLock) {
      return { success: false, locked: true, error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` };
    }

    return { success: false, error: `Wrong PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.` };
  } catch (error) {
    console.error('[PIN] Farmer verification error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return { success: false, error: 'Verification failed. Try again.' };
  }
}

export async function verifyBuyerPin(buyerId: string, pin: string): Promise<{ success: boolean; error?: string; locked?: boolean }> {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: buyerId },
      select: { pin: true, pinFailedAttempts: true, pinLockedUntil: true }
    });

    if (!buyer) return { success: false, error: 'Buyer not found' };
    if (!buyer.pin) return { success: false, error: 'PIN not set. Please set your PIN on the web dashboard first.' };

    if (buyer.pinLockedUntil && buyer.pinLockedUntil > new Date()) {
      const minsLeft = Math.ceil((buyer.pinLockedUntil.getTime() - Date.now()) / 60000);
      return { success: false, locked: true, error: `Account locked. Try again in ${minsLeft} minutes.` };
    }

    const valid = await bcrypt.compare(pin, buyer.pin);
    
    if (valid) {
      if (buyer.pinFailedAttempts > 0) {
        await prisma.buyer.update({
          where: { id: buyerId },
          data: { pinFailedAttempts: 0, pinLockedUntil: null }
        });
      }
      return { success: true };
    }

    const newAttempts = buyer.pinFailedAttempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;
    
    await prisma.buyer.update({
      where: { id: buyerId },
      data: {
        pinFailedAttempts: newAttempts,
        ...(shouldLock && { pinLockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60000) })
      }
    });

    if (shouldLock) {
      return { success: false, locked: true, error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` };
    }

    return { success: false, error: `Wrong PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.` };
  } catch (error) {
    console.error('[PIN] Buyer verification error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return { success: false, error: 'Verification failed. Try again.' };
  }
}
