import * as Sentry from '@sentry/nextjs';
import { prisma, withDatabaseRetry } from '@/lib/prisma';
import { sendRawSms } from './sms';
import { isNotificationAllowed } from './preferences';
import type { SendNotificationParams, NotificationResult } from './types';

const MAX_RETRIES          = 3;
const RETRY_BASE_DELAY_MS  = 2000;

// ─── Core send function ──────────────────────────────────────────────────────

export async function sendNotification(
  params: SendNotificationParams
): Promise<NotificationResult> {
  const { type, recipientPhone, body, farmerId, buyerId } = params;

  try {
    // Check preference gate before creating a record
    const allowed = await isNotificationAllowed(type, farmerId);
    if (!allowed) {
      console.log('[NOTIFICATIONS] Skipped (preference off):', type, 'for farmer:', farmerId);
      // Create a record so we can audit what was suppressed
      const skipped = await prisma.notification.create({
        data: {
          type,
          recipientPhone,
          body,
          farmerId: farmerId ?? null,
          buyerId:  buyerId  ?? null,
          status:   'FAILED',
          providerResponse: 'Suppressed by farmer preference',
        },
      });
      return { success: false, notificationId: skipped.id, error: 'Suppressed by preference' };
    }

    // Create a PENDING record first
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

    // Attempt send with retry
    return attemptSend(record.id, recipientPhone, body, 0);
  } catch (error) {
    console.error('[NOTIFICATIONS] Setup error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return { success: false, error: 'Failed to queue notification' };
  }
}

async function attemptSend(
  notificationId: string,
  phone: string,
  body: string,
  attempt: number
): Promise<NotificationResult> {
  const result = await sendRawSms(phone, body);

  try {
    if (result.success) {
      await withDatabaseRetry(() =>
        prisma.notification.update({
          where: { id: notificationId },
          data: {
            status:          'SENT',
            providerResponse: result.providerResponse,
            sentAt:           new Date(),
            retries:          attempt,
          },
        })
      );
      console.log('[NOTIFICATIONS] Delivered, id:', notificationId, 'attempt:', attempt + 1);
      return { success: true, notificationId };
    }

    // Failed — should we retry?
    if (attempt < MAX_RETRIES - 1) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.log('[NOTIFICATIONS] Retry', attempt + 1, 'in', delay, 'ms, id:', notificationId);
      await withDatabaseRetry(() =>
        prisma.notification.update({
          where: { id: notificationId },
          data: { status: 'RETRYING', retries: attempt + 1, providerResponse: result.providerResponse },
        })
      );
      await sleep(delay);
      return attemptSend(notificationId, phone, body, attempt + 1);
    }

    // Exhausted retries
    await withDatabaseRetry(() =>
      prisma.notification.update({
        where: { id: notificationId },
        data: {
          status:           'FAILED',
          providerResponse: result.providerResponse,
          retries:          attempt + 1,
        },
      })
    );
    console.error('[NOTIFICATIONS] Failed after', MAX_RETRIES, 'attempts, id:', notificationId);
    Sentry.captureException(new Error(`Notification failed after ${MAX_RETRIES} retries: ${notificationId}`));
    await Sentry.flush(2000);
    return { success: false, notificationId, error: result.providerResponse };
  } catch (dbError) {
    console.error('[NOTIFICATIONS] DB Update error:', (dbError as Error).message);
    Sentry.captureException(dbError);
    await Sentry.flush(2000);
    return { success: false, notificationId, error: 'DB update failed' };
  }
}

// ─── Manual retry of a previously-failed notification ───────────────────────

export async function retryFailedNotification(
  notificationId: string
): Promise<NotificationResult> {
  try {
    const record = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!record) {
      return { success: false, notificationId, error: 'Notification not found' };
    }
    if (record.status === 'SENT') {
      return { success: true, notificationId };
    }
    console.log('[NOTIFICATIONS] Manual retry triggered for id:', notificationId);
    return attemptSend(notificationId, record.recipientPhone, record.body, 0);
  } catch (error) {
    console.error('[NOTIFICATIONS] Manual retry error:', (error as Error).message);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return { success: false, notificationId, error: 'Failed to fetch notification' };
  }
}

// ─── Re-exports for convenience ──────────────────────────────────────────────
export * from './types';
export * from './templates';
export * from './preferences';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
