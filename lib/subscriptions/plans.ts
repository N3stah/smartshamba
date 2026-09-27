import { SubscriptionType, SubscriptionBillingPeriod } from '@prisma/client';

interface PlanDetails {
  priceKsh: number;
  durationDays: number;
}

const PRICING_MATRIX: Record<string, Partial<Record<SubscriptionBillingPeriod, PlanDetails>>> = {
  WEATHER_ALERTS: {
    MONTHLY: { priceKsh: 150, durationDays: 30 },
  },
  BUYER_DEMAND_ALERTS: {
    MONTHLY: { priceKsh: 120, durationDays: 30 },
  },
  PEST_ALERTS: {
    MONTHLY: { priceKsh: 80, durationDays: 30 },
  },
  BUYER_VERIFICATION: {
    MONTHLY: { priceKsh: 200, durationDays: 30 },
    YEARLY: { priceKsh: 2000, durationDays: 365 },
  },
};

export function getPlanDetails(
  type: SubscriptionType,
  billingPeriod: SubscriptionBillingPeriod
): PlanDetails | null {
  const plans = PRICING_MATRIX[type];
  if (!plans) return null;
  return plans[billingPeriod] || null;
}
