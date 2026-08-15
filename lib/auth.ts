import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'smartshamba_admin';
const FARMER_COOKIE = 'smartshamba_farmer';
const BUYER_COOKIE = 'smartshamba_buyer';

// Admin Auth
export function requireAdminAuth(req: NextRequest): NextResponse | null {
  const cookie = req.cookies.get(ADMIN_COOKIE);
  const apiKey = req.headers.get('x-admin-key');
  
  if (cookie?.value === process.env.ADMIN_API_KEY || apiKey === process.env.ADMIN_API_KEY) {
    return null;
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Farmer Auth
export function getFarmerSession(req: NextRequest): string | null {
  return req.cookies.get(FARMER_COOKIE)?.value ?? null;
}

export function requireFarmerAuth(req: NextRequest): NextResponse | null {
  if (!getFarmerSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function setFarmerSessionCookie(response: NextResponse, phone: string): void {
  response.cookies.set(FARMER_COOKIE, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearFarmerSessionCookie(response: NextResponse): void {
  response.cookies.set(FARMER_COOKIE, '', { maxAge: 0, path: '/' });
}

// Buyer Auth
export function getBuyerSession(req: NextRequest): string | null {
  return req.cookies.get(BUYER_COOKIE)?.value ?? null;
}

export function requireBuyerAuth(req: NextRequest): NextResponse | null {
  if (!getBuyerSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function setBuyerSessionCookie(response: NextResponse, phone: string): void {
  response.cookies.set(BUYER_COOKIE, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearBuyerSessionCookie(response: NextResponse): void {
  response.cookies.set(BUYER_COOKIE, '', { maxAge: 0, path: '/' });
}

// V2 compatibility exports
export async function getAdminSession() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const value = cookieStore.get('smartshamba_admin')?.value;
  if (!value || value !== process.env.ADMIN_API_KEY) return null;
  return { role: 'admin' as const };
}

export async function getUserSession() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const farmerPhone = cookieStore.get('smartshamba_farmer')?.value;
  if (farmerPhone) return { phone: farmerPhone, role: 'farmer' as const };
  const buyerPhone = cookieStore.get('smartshamba_buyer')?.value;
  if (buyerPhone) return { phone: buyerPhone, role: 'buyer' as const };
  return null;
}

const TRANSPORT_COOKIE = 'smartshamba_transport';
const SESSION_DURATION = 60 * 60 * 8;

export function getTransportSession(req: NextRequest): string | null {
  const cookie = req.cookies.get(TRANSPORT_COOKIE);
  return cookie?.value ?? null;
}

export function requireTransportAuth(req: NextRequest): NextResponse | null {
  const session = getTransportSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export function setTransportSessionCookie(response: NextResponse, phone: string): void {
  response.cookies.set(TRANSPORT_COOKIE, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DURATION,
  });
}

export function clearTransportSessionCookie(response: NextResponse): void {
  response.cookies.set(TRANSPORT_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}
