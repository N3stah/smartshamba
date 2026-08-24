import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';
import * as Sentry from '@sentry/nextjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdminAuth(req);
    if (authError) return authError;

    // Fetch high-level KPIs for AI context
    const [totalFarmers, totalBuyers, totalTx, settledTx, disputedTx, totalRevenue] = await Promise.all([
      prisma.farmer.count(),
      prisma.buyer.count(),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'SETTLED' } }),
      prisma.transaction.count({ where: { status: 'DISPUTED' } }),
      (prisma as any).ledgerEntry.aggregate({ _sum: { amount: true }, where: { userId: 'revenue', userType: 'PLATFORM', entryType: 'CREDIT' } })
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
    - Platform Revenue: KSh ${totalRevenue._sum.amount || 0}`;

    let aiResponse = "Executive AI summary unavailable.";
    if (GEMINI_API_KEY) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 150 } })
        });
        if (res.ok) {
          const data = await res.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || aiResponse;
        }
      } catch (e) { /* Fallback */ }
    }

    return NextResponse.json({ summary: aiResponse });
  } catch (error) {
    console.error('[API] AI Executive Insights error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
