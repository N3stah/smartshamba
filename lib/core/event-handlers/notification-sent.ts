import { EventOutbox } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { deliverNotification } from '@/lib/notifications/delivery-service';

interface NotificationPayload {
  recipientType: 'FARMER' | 'BUYER' | 'TRANSPORT';
  recipientId: string;
  notificationType: string;
  context: Record<string, unknown>;
}

export async function handleNotificationSent(event: EventOutbox): Promise<void> {
  if (!event.eventKey) {
    throw new Error('Cannot process notification event without eventKey');
  }

  const payload = event.payload as unknown as NotificationPayload;
  const { recipientType, recipientId, notificationType, context } = payload;

  // 1. Resolve Recipient
  let phone: string | null = null;
  let preferenceWhere: Record<string, string> = {};

  if (recipientType === 'FARMER') {
    const farmer = await prisma.farmer.findUnique({ where: { id: recipientId }, select: { phone: true } });
    phone = farmer?.phone || null;
    preferenceWhere = { farmerId: recipientId };
  } else if (recipientType === 'BUYER') {
    const buyer = await prisma.buyer.findFirst({ where: { id: recipientId }, select: { phone: true } });
    phone = buyer?.phone || null;
    preferenceWhere = { buyerId: recipientId };
  } else if (recipientType === 'TRANSPORT') {
    const provider = await prisma.transportProvider.findUnique({ where: { id: recipientId }, select: { phone: true } });
    phone = provider?.phone || null;
    preferenceWhere = { providerId: recipientId };
  }

  if (!phone) {
    console.log(`[EVENTS] Notification skipped: no phone for ${recipientType} ${recipientId}`);
    return;
  }

  // 2. Check Preferences
  const prefs = await prisma.notificationPreference.findFirst({ where: preferenceWhere });
  if (prefs) {
    if (notificationType === 'WEEKLY_MARKET_REPORT' && !prefs.weeklyMarketReport) return;
    if (notificationType === 'HARVEST_ADVISORY' && !prefs.harvestTips) return;
    if (notificationType === 'QUALITY_ADVISORY' && !prefs.qualityAlerts) return;
    if (notificationType.includes('DISPUTE') && !prefs.disputeUpdates) return;
    if (notificationType.includes('TRANSACTION') && !prefs.transactionSms) return;
  }

  // 3. Generate Message Body
  const body = generateMessageBody(notificationType, context);
  if (!body) {
    console.log(`[EVENTS] No template found for notification type: ${notificationType}`);
    return;
  }

  // 4. Create Notification (Idempotent via deliveryKey)
  const deliveryKey = event.eventKey;
  const notification = await prisma.notification.upsert({
    where: { deliveryKey },
    update: {}, 
    create: {
      type: mapToNotificationEnum(notificationType),
      recipientPhone: phone,
      body,
      status: 'PENDING',
      deliveryKey,
      farmerId: recipientType === 'FARMER' ? recipientId : null,
      buyerId: recipientType === 'BUYER' ? recipientId : null,
    }
  });

  // 5. Deliver
  await deliverNotification(notification.id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToNotificationEnum(type: string): any {
  const mapping: Record<string, string> = {
    'TRANSACTION_CONFIRMATION': 'TRANSACTION_CONFIRMATION',
    'SETTLEMENT': 'SETTLEMENT',
    'WEEKLY_MARKET_REPORT': 'WEEKLY_MARKET_REPORT',
    'HARVEST_ADVISORY': 'HARVEST_ADVISORY',
    'QUALITY_ADVISORY': 'QUALITY_ADVISORY',
    'DISPUTE_UPDATE': 'DISPUTE_UPDATE',
    'GROUP_TRANSACTION': 'GROUP_TRANSACTION',
    'OTP': 'OTP'
  };
  return mapping[type] || 'TRANSACTION_CONFIRMATION';
}

function generateMessageBody(type: string, ctx: Record<string, unknown>): string | null {
  switch (type) {
    case 'TRANSACTION_CONFIRMATION':
      return `SmartShamba: Offer confirmed! Ref: ${ctx.reference}. ${ctx.quantityBags} bags @ KSh ${ctx.pricePerBag}/bag. Total: KSh ${ctx.totalValue}.`;
    case 'SETTLEMENT':
      return `SmartShamba: Payment received! Ref: ${ctx.reference}. Amount: KSh ${ctx.totalValue}. M-PESA Ref: ${ctx.mpesaRef || 'N/A'}.`;
    case 'DISPUTE_UPDATE':
      return `SmartShamba: Dispute update for Ref: ${ctx.reference}. Status: ${(ctx.status as string).replace('_', ' ')}.`;
    case 'GROUP_TRANSACTION':
      return `SmartShamba Group: Sale confirmed to ${ctx.buyerName}. Ref: ${ctx.reference}. ${ctx.totalBags} bags @ KSh ${ctx.pricePerBag}/bag.`;
    case 'TRANSPORT_REQUESTED':
      return `SmartShamba: New transport request for ${ctx.quantityBags} bags from ${ctx.pickupLocation} to ${ctx.dropoffLocation}.`;
    case 'TRANSPORT_ACCEPTED':
      return `SmartShamba: Transport accepted by ${ctx.providerName} for booking ${ctx.bookingId}.`;
    case 'TRANSPORT_STATUS':
      return `SmartShamba: Transport status update for booking ${ctx.bookingId}: ${ctx.status}.`;
    case 'CONTRACT_REMINDER':
      return `SmartShamba Reminder: You have a pending contract to sign for Tx ${ctx.reference}. Dial *384*53374# or visit the website.`;
    case 'WEEKLY_MARKET_REPORT':
      return `SmartShamba Weekly Report: ${ctx.summary}`;
    case 'HARVEST_ADVISORY':
      return `SmartShamba Advisory: ${ctx.title} - ${ctx.message}`;
    case 'CHAT_MESSAGE':
      return `SmartShamba: New message in transaction ${ctx.reference}.`;
    case 'PAYMENT_RECEIVED':
      return `SmartShamba: Payment of KSh ${ctx.amount} received for transaction ${ctx.reference}.`;
    case 'PAYOUT_RECEIVED':
      return `SmartShamba: Payout of KSh ${ctx.amount} sent to your M-PESA. Ref: ${ctx.mpesaRef}.`;
    default:
      return null;
  }
}
