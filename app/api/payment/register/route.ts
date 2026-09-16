import { NextRequest, NextResponse } from 'next/server';
import { registerC2BUrlWithRetry } from '@/lib/mpesa';
import { requireRoleAuth } from '@/lib/auth';
import { StaffRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  const authError = await requireRoleAuth(req, [StaffRole.CEO, StaffRole.CTO, StaffRole.CFO, StaffRole.PM]);
  if (authError) return authError;

  const result = await registerC2BUrlWithRetry(3);

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
