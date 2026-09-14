import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';
import fs from 'fs';
import path from 'path';

interface CTOMetrics {
  system: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    env: string;
  };
  database: {
    status: 'CONNECTED' | 'DISCONNECTED';
    latency: number;
    counts: Record<string, number>;
  };
  ai: {
    gemini: 'CONFIGURED' | 'MISSING';
    nvidia: 'CONFIGURED' | 'MISSING';
    openweather: 'CONFIGURED' | 'MISSING';
    predictions: number;
  };
  integrations: {
    mapTiler: 'CONFIGURED' | 'MISSING';
    africaTalking: 'CONFIGURED' | 'MISSING';
    mpesaDaraja: 'CONFIGURED' | 'MISSING';
    sentry: 'CONFIGURED' | 'MISSING';
  };
  cron: Array<{ path: string; schedule: string }>;
  security: {
    rbac: boolean;
    rateLimiting: boolean;
  };
  deployment: {
    vercelEnv: string | undefined;
    nextVersion: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Strict RBAC: Only CTO and CEO can access technical metrics
    const authError = await requireRoleAuth(req, [StaffRole.CTO, StaffRole.CEO]);
    if (authError) return authError;

    // Audit Log: Record who accessed this executive data
    const staff = await getStaffSession(req);
    if (staff && staff.id !== 'legacy-admin') {
      await prisma.auditLog.create({
        data: {
          action: 'CTO_VIEWED_SYSTEM_METRICS',
          actorType: 'STAFF',
          actorId: staff.id,
          staffId: staff.id,
          entityType: 'SystemHealth',
          entityId: 'metrics'
        }
      }).catch(e => console.error('[AUDIT]', e));
    }

    // 1. System Info
    const system = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development'
    };

    // 2. Database Health & Counts
    let database = { status: 'DISCONNECTED' as 'CONNECTED' | 'DISCONNECTED', latency: 0, counts: {} as Record<string, number> };
    
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      // Group counts in a transaction to prevent connection pool exhaustion
      const countsArray = await prisma.$transaction([
        prisma.farmer.count(),
        prisma.buyer.count(),
        prisma.transaction.count(),
        prisma.wallet.count(),
        prisma.contract.count(),
        prisma.marketPrediction.count(),
        prisma.weatherData.count(),
        prisma.transportProvider.count(),
        prisma.auditLog.count()
      ]);

      database = {
        status: 'CONNECTED',
        latency,
        counts: {
          farmers: countsArray[0],
          buyers: countsArray[1],
          transactions: countsArray[2],
          wallets: countsArray[3],
          contracts: countsArray[4],
          aiPredictions: countsArray[5],
          weatherRecords: countsArray[6],
          transportProviders: countsArray[7],
          auditLogs: countsArray[8]
        }
      };
    } catch (dbError) {
      Sentry.captureException(dbError);
    }

    // 3. AI & Integrations (Never expose keys, only check existence)
    const ai = {
      gemini: process.env.GEMINI_API_KEY ? 'CONFIGURED' as const : 'MISSING' as const,
      nvidia: process.env.NVIDIA_API_KEY ? 'CONFIGURED' as const : 'MISSING' as const,
      openweather: process.env.OPENWEATHER_API_KEY ? 'CONFIGURED' as const : 'MISSING' as const,
      predictions: database.counts.aiPredictions || 0
    };

    const integrations = {
      mapTiler: process.env.NEXT_PUBLIC_MAPTILER_KEY ? 'CONFIGURED' as const : 'MISSING' as const,
      africaTalking: process.env.AT_API_KEY ? 'CONFIGURED' as const : 'MISSING' as const,
      mpesaDaraja: process.env.MPESA_CONSUMER_KEY ? 'CONFIGURED' as const : 'MISSING' as const,
      sentry: process.env.SENTRY_DSN ? 'CONFIGURED' as const : 'MISSING' as const
    };

    // 4. Cron Jobs (Parsed from vercel.json)
    let cron: Array<{ path: string; schedule: string }> = [];
    try {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      const vercelConfigRaw = fs.readFileSync(vercelConfigPath, 'utf-8');
      const vercelConfigParsed = JSON.parse(vercelConfigRaw);
      cron = vercelConfigParsed.crons || [];
    } catch {
      // Fallback if vercel.json is not found
      cron = [];
    }

    // 5. Security
    const security = {
      rbac: true,
      rateLimiting: true
    };

    // 6. Deployment Info
    const deployment = {
      vercelEnv: process.env.VERCEL_ENV,
      nextVersion: '16.2.6'
    };

    const metrics: CTOMetrics = {
      system,
      database,
      ai,
      integrations,
      cron,
      security,
      deployment
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('[API] CTO Metrics error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
