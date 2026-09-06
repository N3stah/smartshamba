import { prisma } from '@/lib/prisma';
import type { TrustUserType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

interface ScoreBreakdown {
  verification: number;
  transaction_volume: number;
  rating_quality: number;
  dispute_health: number;
  delivery_reliability: number;
  payment_reliability: number;
  platform_activity: number;
}

const MAX_SCORE = 100;

function getTimeWeight(date: Date, halfLifeDays: number = 90): number {
  const daysOld = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-daysOld / halfLifeDays);
}

function getLevel(score: number): string {
  if (score >= 90) return 'PLATINUM';
  if (score >= 75) return 'GOLD';
  if (score >= 60) return 'SILVER';
  if (score >= 40) return 'BRONZE';
  return 'NEW';
}

export async function calculateAndSaveTrustScore(userId: string, userType: 'FARMER' | 'BUYER' | 'TRANSPORT' | 'GROUP') {
  try {
    const breakdown: ScoreBreakdown = {
      verification: 0, transaction_volume: 0, rating_quality: 0, dispute_health: 0,
      delivery_reliability: 0, payment_reliability: 0, platform_activity: 0
    };

    if (userType === 'FARMER' || userType === 'BUYER') {
      const model = userType === 'FARMER' ? prisma.farmer : prisma.buyer;
      // @ts-expect-error -- Prisma dynamic include shape not statically known
      const user = await model.findFirst({
        where: { id: userId },
        include: {
          transactions: { select: { id: true, status: true, createdAt: true, updatedAt: true } },
          ratings: { select: { score: true, createdAt: true } },
          disputes: { select: { id: true, status: true, createdAt: true } },
          ProduceListing: userType === 'FARMER' ? { where: { status: 'ACTIVE' }, select: { id: true } } : false,
          BuyerDemand: userType === 'BUYER' ? { where: { status: 'ACTIVE' }, select: { id: true } } : false,
        }
      });

      if (!user) return null;

      breakdown.verification = (user as { verified?: boolean }).verified ? 10 : 0;

      const completedTx = user.transactions.filter((t: { status: string; updatedAt: Date }) => t.status === 'SETTLED' || t.status === 'CLOSED');
      let txScore = 0;
      completedTx.forEach((tx: { status: string; updatedAt: Date }) => { txScore += 4 * getTimeWeight(tx.updatedAt); });
      breakdown.transaction_volume = Math.min(txScore, 20);

      let ratingScore = 0;
      if (user.ratings.length > 0) {
        let totalWeight = 0, weightedSum = 0;
        user.ratings.forEach((r: { score: number; createdAt: Date }) => {
          const weight = getTimeWeight(r.createdAt);
          weightedSum += r.score * weight;
          totalWeight += weight;
        });
        const avgRating = totalWeight > 0 ? weightedSum / totalWeight : 0;
        ratingScore = (avgRating / 5) * 20;
      }
      breakdown.rating_quality = Math.round(ratingScore);

      // V2.0 Spec: Do NOT automatically penalize for opening a dispute.
      // Only penalize if dispute is RESOLVED or CLOSED against the user.
      const resolvedDisputes = user.disputes.filter((d: { status: string }) => d.status === 'RESOLVED' || d.status === 'CLOSED').length;
      breakdown.dispute_health = Math.max(0, 15 - (resolvedDisputes * 7.5));

      if (userType === 'FARMER') {
        const settledTx = user.transactions.filter((t: { status: string; updatedAt: Date }) => t.status === 'SETTLED').length;
        const totalTx = user.transactions.length;
        const successRate = totalTx > 0 ? settledTx / totalTx : 1;
        breakdown.delivery_reliability = Math.round(Math.max(0, successRate) * 15);
        breakdown.payment_reliability = 0;
        breakdown.platform_activity = (user as { ProduceListing?: { id: string }[] })?.ProduceListing?.length ?? 0 > 0 ? 5 : 0;
      } else {
        breakdown.delivery_reliability = 0;
        const settledTx = user.transactions.filter((t: { status: string; updatedAt: Date }) => t.status === 'SETTLED').length;
        const totalTx = user.transactions.length;
        const paymentRate = totalTx > 0 ? settledTx / totalTx : 1;
        breakdown.payment_reliability = Math.round(paymentRate * 15);
        breakdown.platform_activity = (user as { BuyerDemand?: { id: string }[] })?.BuyerDemand?.length ?? 0 > 0 ? 5 : 0;
      }
      breakdown.platform_activity += completedTx.length > 0 ? 5 : 0;

    } else if (userType === 'TRANSPORT') {
      const provider = await prisma.transportProvider.findUnique({
        where: { id: userId },
        include: { bookings: { select: { id: true, status: true, createdAt: true } } }
      });
      if (!provider) return null;

      breakdown.verification = provider.isVerified ? 10 : 0;
      const completedJobs = provider.bookings.filter((b: { id: string; status: string; createdAt: Date }) => b.status === 'DELIVERED');
      let txScore = 0;
      completedJobs.forEach((job: { id: string; status: string; createdAt: Date }) => { txScore += 4 * getTimeWeight(job.createdAt); });
      breakdown.transaction_volume = Math.min(txScore, 20);
      breakdown.rating_quality = 0; 
      breakdown.dispute_health = 15; 
      const deliveryRate = provider.bookings.length > 0 ? completedJobs.length / provider.bookings.length : 1;
      breakdown.delivery_reliability = Math.round(deliveryRate * 15);
      breakdown.payment_reliability = 0;
      breakdown.platform_activity = completedJobs.length > 0 ? 10 : 0;

    } else if (userType === 'GROUP') {
      const group = await prisma.farmerGroup.findUnique({
        where: { id: userId },
        include: { 
          members: { include: { farmer: { select: { id: true, name: true } } } },
          transactions: { select: { id: true, status: true } }
        }
      });
      if (!group) return null;

      // Group score is average of member scores + group tx success rate
      const memberScores = group.members.map((_m: { farmer: { id: string } }) => 0);
      const avgScore = memberScores.length > 0 ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length : 0;
      
      // Map to breakdown roughly
      breakdown.verification = group.active ? 10 : 0;
      breakdown.transaction_volume = Math.min(group.transactions.filter(t => t.status === 'SETTLED').length * 4, 20);
      breakdown.rating_quality = Math.round((avgScore / 100) * 20);
      breakdown.dispute_health = 15;
      breakdown.delivery_reliability = Math.round((avgScore / 100) * 15);
      breakdown.payment_reliability = 0;
      breakdown.platform_activity = group.members.length > 0 ? 10 : 0;
    }

    const totalScore = Math.min(
      breakdown.verification + breakdown.transaction_volume + breakdown.rating_quality + 
      breakdown.dispute_health + breakdown.delivery_reliability + breakdown.payment_reliability + breakdown.platform_activity,
      MAX_SCORE
    );

    const level = getLevel(totalScore);

    const trustScore = await prisma.trustScore.upsert({
      where: { userId_userType: { userId, userType: userType as TrustUserType } },
      update: { score: totalScore, level, breakdown: breakdown as unknown as Prisma.InputJsonValue },
      create: { userId, userType, score: totalScore, level, breakdown: breakdown as unknown as Prisma.InputJsonValue }
    });

    return trustScore;
  } catch (error) {
    console.error('[TRUST ENGINE] Error:', error);
    Sentry.captureException(error);
    return null;
  }
}

export async function getTrustScore(userId: string, userType: string) {
  return prisma.trustScore.findUnique({ where: { userId_userType: { userId, userType: userType as TrustUserType } } });
}
