import { NextRequest, NextResponse } from 'next/server';
import { registerC2BUrl } from '@/lib/mpesa';
import { requireAdminAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const result = await registerC2BUrl();

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
