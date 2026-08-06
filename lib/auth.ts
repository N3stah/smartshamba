import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'smartshamba_admin';
const FARMER_COOKIE = 'smartshamba_farmer';
const BUYER_COOKIE = 'smartshamba_buyer';
const TRANSPORT_COOKIE = 'smartshamba_transport';

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


// Transport Provider Auth
export function getTransportSession(req: NextRequest): string | null {
  return req.cookies.get(TRANSPORT_COOKIE)?.value ?? null;
}

export function requireTransportAuth(req: NextRequest): NextResponse | null {
  if (!getTransportSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function setTransportSessionCookie(response: NextResponse, phone: string): void {
  response.cookies.set(TRANSPORT_COOKIE, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
