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
