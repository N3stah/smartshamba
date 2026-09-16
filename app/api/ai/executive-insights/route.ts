import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRoleAuth, getStaffSession } from '@/lib/auth';
import { StaffRole } from '@prisma/client';
import { getAnalyticalProvider } from '@/lib/ai/providers';
import { checkApiRateLimit } from '@/lib/rateLimit';
import { buildSecureAIContext } from '@/lib/ai/context-builder';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    // 1. Staff RBAC (L.1)
    const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CFO, StaffRole.CTO, StaffRole.PM]);
    if (authError) return authError;

    // 2. Staff Identity Resolution
    const staff = await getStaffSession(req);
    if (!staff) return NextResponse.json({ error: 'Staff authentication required' }, { status: 403 });

    // 3. AI Executive Rate Limiting (L.5) — Before expensive context/provider work
    const limit = parseInt(process.env.AI_EXEC_LIMIT || '10');
    const windowMs = parseInt(process.env.AI_EXEC_WINDOW_MS || '3600000');
    if (limit > 0 && windowMs > 0) {
      const identifier = `ai:executive:${staff.id}`;
      const rateLimit = await checkApiRateLimit(identifier, limit, windowMs);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
          { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 0) } }
        );
      }
    }

    // 4. Audit Log — Preserved
    if (staff.id !== 'legacy-admin') {
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

    // 5. Build Canonical L.3 Context (uses K.3 DailyMetric + bounded live queries + SMARTSHAMBA_AI_SCOPE)
    // This replaces all inline Prisma queries and enforces role-specific least-privilege
    const { systemPrompt } = await buildSecureAIContext(
      staff.id,
      'STAFF',
      staff.role as StaffRole
    );

    // 6. Append Executive Briefing Instruction (on top of L.3 scope + context)
    const executiveInstruction = `Analyze the provided context and provide a concise Executive Brief (max 3 sentences) highlighting the most critical insight, a potential risk, and a strategic recommendation.`;
    const fullPrompt = `${systemPrompt}\n\n---\nINSTRUCTION:\n${executiveInstruction}`;

    // 7. Call L.4 Analytical Provider
    let aiResponse = "Executive AI summary unavailable.";
    try {
      const provider = getAnalyticalProvider();
      const response = await provider.generateResponse(fullPrompt, { temperature: 0.4, maxTokens: 150 });
      if (response) aiResponse = response;
    } catch (e) {
      console.error('[AI] Executive Insights provider request failed:', e);
      Sentry.captureException(e);
      await Sentry.flush(2000);
    }

    return NextResponse.json({ summary: aiResponse });
  } catch (error) {
    console.error('[API] AI Executive Insights error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
