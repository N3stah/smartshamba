import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CTO, StaffRole.CEO]);
  if (authError) return authError;

  try {
    // 1. Outbox Health (Provenance Anchoring)
    const outboxMetrics = await prisma.eventOutbox.groupBy({
      by: ['status'],
      where: { eventType: 'PROVENANCE_ANCHOR_REQUESTED' },
      _count: { id: true },
    });

    const pendingAnchors = outboxMetrics.find(m => m.status === 'PENDING')?._count.id || 0;
    const processingAnchors = outboxMetrics.find(m => m.status === 'PROCESSING')?._count.id || 0;
    const failedAnchors = outboxMetrics.find(m => m.status === 'FAILED')?._count.id || 0;

    // 2. Blockchain Anchor Status
    const confirmedAnchors = await prisma.provenanceAnchor.count({
      where: { transactionHash: { not: null } }
    });

    // 3. Market Data Freshness
    const latestMarketData = await prisma.marketPriceObservation.findFirst({
      orderBy: { importedAt: 'desc' },
    });

    const totalObservations = await prisma.marketPriceObservation.count();

    // 4. Model Version (Fallback reported as UNAVAILABLE per CTO directive)
    const latestModelVersion = await prisma.modelVersion.findFirst({
      orderBy: { deployedAt: 'desc' },
    });

    // 5. Deal Evidence Completeness
    const evidenceCaptured = await prisma.dealEvidence.count();
    
    const evidenceWithAnchor = await prisma.dealEvidence.count({
      where: { batch: { provenanceAnchors: { some: {} } } }
    });

    const evidencePendingAnchoring = evidenceCaptured - evidenceWithAnchor;

    return NextResponse.json({
      outbox: {
        pending: pendingAnchors,
        processing: processingAnchors,
        failed: failedAnchors,
      },
      blockchain: {
        confirmedAnchors,
      },
      marketData: {
        totalObservations,
        lastImportedAt: latestMarketData?.importedAt || null,
        lastObservedAt: latestMarketData?.observedAt || null,
      },
      model: {
        version: latestModelVersion?.version || 'N/A',
        isFallback: 'UNAVAILABLE', // Explicitly reported as unavailable per CTO directive
        trainingDataCutoff: latestModelVersion?.trainingDatasetVersion || 'N/A',
      },
      evidence: {
        evidenceCaptured,
        evidencePendingAnchoring,
      }
    });

  } catch (error) {
    console.error('[V3 METRICS API] Error:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
