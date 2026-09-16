import { prisma } from '@/lib/prisma';

export interface TrustContext {
  score: number | null;
  level: string | null;
}

export async function getTrustContext(userId: string, userType: 'FARMER' | 'BUYER' | 'TRANSPORT'): Promise<TrustContext> {
  const trustScore = await prisma.trustScore.findUnique({
    where: { userId_userType: { userId, userType } },
    select: { score: true, level: true }
  });
  return { score: trustScore?.score ?? null, level: trustScore?.level ?? null };
}
