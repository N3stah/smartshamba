import { NextResponse } from 'next/server';
import { clearFarmerSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearFarmerSessionCookie(response);
  console.log('[AUTH] Farmer logout');
  return response;
}
