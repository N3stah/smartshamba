import { NextResponse } from 'next/server';
import { clearFarmerSessionCookie, clearBuyerSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearFarmerSessionCookie(response);
  clearBuyerSessionCookie(response);
  return response;
}
