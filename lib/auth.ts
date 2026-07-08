import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'smartshamba_admin';

export function requireAdminAuth(req: NextRequest): NextResponse | null {
  // Accept x-admin-key header (curl / server-side fetches)
  const apiKey = req.headers.get('x-admin-key');
  if (apiKey && apiKey === process.env.ADMIN_API_KEY) return null;

  // Accept session cookie (browser client components)
  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value && cookie.value === process.env.ADMIN_API_KEY) return null;

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const FARMER_COOKIE_NAME = 'smartshamba_farmer';
const FARMER_SESSION_DURATION = 60 * 60 * 8; // 8 hours

export function getFarmerSession(req: NextRequest): string | null {
  const cookie = req.cookies.get(FARMER_COOKIE_NAME);
  if (!cookie?.value) return null;
  // Cookie value is the farmer's phone number, signed by presence of a valid session
  return cookie.value;
}

export function setFarmerSessionCookie(response: NextResponse, phone: string): void {
  response.cookies.set(FARMER_COOKIE_NAME, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: FARMER_SESSION_DURATION,
  });
}

export function clearFarmerSessionCookie(response: NextResponse): void {
  response.cookies.set(FARMER_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export function requireFarmerAuth(req: NextRequest): NextResponse | null {
  const phone = getFarmerSession(req);
  if (!phone) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
