import { prisma } from '@/lib/prisma';
import { NotificationPreferences, NotificationType, PREFERENCE_GATE } from './types';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  transactionSms:     true,
  weeklyMarketReport: true,
  harvestTips:        true,
  qualityAlerts:      true,
  disputeUpdates:     true,
};

export async function getPreferences(farmerId: string): Promise<NotificationPreferences> {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { farmerId },
  });
  if (!prefs) return { ...DEFAULT_PREFERENCES };
  return {
    transactionSms:     prefs.transactionSms,
    weeklyMarketReport: prefs.weeklyMarketReport,
    harvestTips:        prefs.harvestTips,
    qualityAlerts:      prefs.qualityAlerts,
    disputeUpdates:     prefs.disputeUpdates,
  };
}

export async function upsertPreferences(
  farmerId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const prefs = await prisma.notificationPreference.upsert({
    where: { farmerId },
    create: { farmerId, ...DEFAULT_PREFERENCES, ...updates },
    update: updates,
  });
  return {
    transactionSms:     prefs.transactionSms,
    weeklyMarketReport: prefs.weeklyMarketReport,
    harvestTips:        prefs.harvestTips,
    qualityAlerts:      prefs.qualityAlerts,
    disputeUpdates:     prefs.disputeUpdates,
  };
}

// Returns true if the notification should be sent given the farmer's preferences.
// OTP has no gate and always returns true.
export async function isNotificationAllowed(
  type: NotificationType,
  farmerId?: string
): Promise<boolean> {
  const gate = PREFERENCE_GATE[type];
  if (!gate) return true;           // OTP and ungated types always send
  if (!farmerId) return true;       // non-farmer recipients (e.g. buyers) always send
  const prefs = await getPreferences(farmerId);
  return prefs[gate];
}