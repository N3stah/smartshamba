import { prisma } from '@/lib/prisma';
import { sendRawSms } from './sms';
import * as Sentry from '@sentry/nextjs';

export async function deliverNotification(notificationId: string): Promise<void> {
  try {
    const notification = await prisma.notification.findUniqueOrThrow({ where: { id: notificationId } });

    if (notification.status === 'SENT') {
      console.log(`[NOTIFICATIONS] Skipped delivery, already sent: ${notificationId}`);
      return;
    }

    const result = await sendRawSms(notification.recipientPhone, notification.body);

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        providerResponse: result.providerResponse,
        sentAt: result.success ? new Date() : null,
      }
    });

    if (!result.success) {
      // Throwing an error causes the Event Processor to retry the event later
      throw new Error(`SMS delivery failed: ${result.providerResponse}`);
    }

    console.log(`[NOTIFICATIONS] Delivered notification ${notificationId}`);
  } catch (error) {
    console.error(`[NOTIFICATIONS] Delivery error for ${notificationId}:`, error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    throw error;
  }
}
