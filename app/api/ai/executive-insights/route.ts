import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { getWalletBalance } from '@/lib/finance/ledger-service';
import { GoogleGenAI } from '@google/genai';
import * as Sentry from '@sentry/nextjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });

export async function GET(req: NextRequest) {
  try {
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CFO, StaffRole.CTO, StaffRole.PM]);
    if (authError) return authError;

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
    if (GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: { temperature: 0.4, maxOutputTokens: 150 }
        });
        
        if (response.text) {
          aiResponse = response.text;
        }
      } catch (e) {
        console.error('[AI] Gemini request failed:', e);
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
