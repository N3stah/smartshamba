import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import * as Sentry from '@sentry/nextjs';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CFO, StaffRole.CTO, StaffRole.PM]);
    if (authError) return authError;

    // Audit Log: Record who accessed this executive data
    const staff = await getStaffSession(req);
    if (staff && staff.id !== 'legacy-admin') {
      await prisma.auditLog.create({
        data: {
          action: 'EXECUTIVE_VIEWED_AI_BRIEF',
          actorType: 'STAFF',
          actorId: staff.id,
          staffId: staff.id,
          entityType: 'AIInsight',
          entityId: 'metrics'
        }
      }).catch(e => console.error('[AUDIT]', e));
    }

    // Fetch high-level KPIs for AI context
    const [totalFarmers, totalBuyers, totalTx, settledTx, disputedTx, totalRevenue] = await Promise.all([
      prisma.farmer.count(),
      prisma.buyer.count(),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'SETTLED' } }),
      prisma.transaction.count({ where: { status: 'DISPUTED' } }),
      getWalletBalance('PLATFORM', 'PLATFORM')
    ]);

    const successRate = totalTx > 0 ? (settledTx / totalTx) * 100 : 0;
    const disputeRate = totalTx > 0 ? (disputedTx / totalTx) * 100 : 0;

    const prompt = `You are the Chief AI Analyst for SmartShamba Kenya. 
    Analyze these live platform metrics and provide a concise Executive Brief (max 3 sentences) highlighting the most critical insight, a potential risk, and a strategic recommendation.
    
    Metrics:
    - Farmers: ${totalFarmers}
    - Buyers: ${totalBuyers}
    - Total Transactions: ${totalTx}
    - Success Rate: ${successRate.toFixed(1)}%
    - Dispute Rate: ${disputeRate.toFixed(1)}%
    - Platform Revenue: KSh ${totalRevenue}`;

    let aiResponse = "Executive AI summary unavailable.";
    if (NVIDIA_API_KEY) {
      try {
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "deepseek-ai/deepseek-v4-flash-0731",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            max_tokens: 150
          })
        });
        const data = await res.json();
        aiResponse = data.choices?.[0]?.message?.content || aiResponse;
      } catch (e) {
        console.error('[AI] NVIDIA Executive Insights request failed:', e);
      }
    }

    return NextResponse.json({ summary: aiResponse });
  } catch (error) {
    console.error('[API] AI Executive Insights error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
