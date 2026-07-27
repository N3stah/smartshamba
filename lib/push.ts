import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

webpush.setVapidDetails(
  'mailto:admin@smartshamba.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface WebPushSubscription {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export async function sendPushNotification(userId: string, title: string, body: string) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    const payload = JSON.stringify({ title, body });

    const promises = subscriptions.map(sub => {
      // Cast to the specific type required by web-push to avoid JsonValue mismatch
      const pushSub: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: sub.keys as unknown as PushSubscriptionKeys
      };
      
      return webpush.sendNotification(pushSub, payload).catch(err => {
        console.error('[PUSH] Failed to send to endpoint:', sub.endpoint, err.statusCode);
        // If subscription expired, delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          return prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('[PUSH] Error sending notifications:', error);
  }
}
