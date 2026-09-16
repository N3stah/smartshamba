import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { sendRawSms } from './sms';
import { isNotificationAllowed } from './preferences';
import type { SendNotificationParams, NotificationResult } from './types';

/**
 * Core send function for synchronous exceptions (e.g., OTP).
 * Domain routes should use the EventOutbox (publishEvent) for notifications.
 */
export async function sendNotification(
  params: SendNotificationParams
): Promise<NotificationResult> {
  const { type, recipientPhone, body, farmerId, buyerId } = params;

  try {
    const allowed = await isNotificationAllowed(type, farmerId);
    if (!allowed) {
      console.log('[NOTIFICATIONS] Skipped (preference off):', type, 'for farmer:', farmerId);
      return { success: false, error: 'Suppressed by preference' };
    }

    // Create PENDING record
    const record = await prisma.notification.create({
      data: {
        type,
        recipientPhone,
        body,
        farmerId: farmerId ?? null,
        buyerId:  buyerId  ?? null,
        status: 'PENDING',
      },
    });

    // Attempt single send (no retry loop)
    const result = await sendRawSms(recipientPhone, body);
    
    if (result.success) {
      await prisma.notification.update({
        where: { id: record.id },
        data: { status: 'SENT', providerResponse: result.providerResponse, sentAt: new Date() }
      });
      return { success: true, notificationId: record.id };
    } else {
      await prisma.notification.update({
        where: { id: record.id },
        data: { status: 'FAILED', providerResponse: result.providerResponse }
      });
      return { success: false, notificationId: record.id, error: result.providerResponse };
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Setup error:', (error as Error).message);
    Sentry.captureException(error);
    return { success: false, error: 'Failed to queue notification' };
  }
}

// Re-exports
export * from './types';
export * from './templates';
export * from './preferences';
