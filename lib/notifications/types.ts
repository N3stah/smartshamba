export type NotificationType =
  | 'TRANSACTION_CONFIRMATION'
  | 'SETTLEMENT'
  | 'WEEKLY_MARKET_REPORT'
  | 'HARVEST_ADVISORY'
  | 'QUALITY_ADVISORY'
  | 'DISPUTE_UPDATE'
  | 'OTP'
  | 'GROUP_TRANSACTION';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';

export interface SendNotificationParams {
  type: NotificationType;
  recipientPhone: string;
  body: string;
  farmerId?: string;
  buyerId?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export interface NotificationPreferences {
  transactionSms: boolean;
  weeklyMarketReport: boolean;
  harvestTips: boolean;
  qualityAlerts: boolean;
  disputeUpdates: boolean;
}

// Maps each NotificationType to the preference key that gates it.
// OTP has no preference gate — it always sends.
export const PREFERENCE_GATE: Partial<Record<NotificationType, keyof NotificationPreferences>> = {
  TRANSACTION_CONFIRMATION: 'transactionSms',
  SETTLEMENT:               'transactionSms',
  WEEKLY_MARKET_REPORT:     'weeklyMarketReport',
  HARVEST_ADVISORY:         'harvestTips',
  QUALITY_ADVISORY:         'qualityAlerts',
  DISPUTE_UPDATE:           'disputeUpdates',
  GROUP_TRANSACTION:        'transactionSms',
};