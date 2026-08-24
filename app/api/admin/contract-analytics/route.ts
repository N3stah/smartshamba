import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    const [total, executed, drafts, disputed, voided] = await Promise.all([
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'EXECUTED' } }),
      prisma.contract.count({ where: { status: 'DRAFT' } }),
      prisma.contract.count({ where: { status: 'DISPUTED' } }),
      prisma.contract.count({ where: { status: 'VOIDED' } })
    ]);

    // Calculate Average Signing Time (for EXECUTED contracts)
    const executedContracts = await prisma.contract.findMany({
      where: { status: 'EXECUTED', farmerSignedAt: { not: null }, buyerSignedAt: { not: null } },
      select: { createdAt: true, farmerSignedAt: true, buyerSignedAt: true }
    });

    let totalSignTimeMs = 0;
    executedContracts.forEach(c => {
      const lastSign = new Date(Math.max(new Date(c.farmerSignedAt!).getTime(), new Date(c.buyerSignedAt!).getTime()));
      totalSignTimeMs += lastSign.getTime() - new Date(c.createdAt).getTime();
    });

    const avgSignTimeHours = executedContracts.length > 0 ? (totalSignTimeMs / executedContracts.length) / (1000 * 60 * 60) : 0;

    return NextResponse.json({
      kpis: {
        total,
        executed,
        drafts,
        disputed,
        voided,
        completionRate: total > 0 ? parseFloat(((executed / total) * 100).toFixed(1)) : 0,
        disputeRate: total > 0 ? parseFloat(((disputed / total) * 100).toFixed(1)) : 0,
        avgSignTimeHours: parseFloat(avgSignTimeHours.toFixed(1))
      }
    });
  } catch (error) {
    console.error('[API] Contract Analytics error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
