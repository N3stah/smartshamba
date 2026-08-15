import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'smartshamba_admin';
const FARMER_COOKIE = 'smartshamba_farmer';
const BUYER_COOKIE = 'smartshamba_buyer';

// ─── Tiered Rate Limiting Logic ───────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false; // Limit exceeded
  }

  record.count++;
  return true;
}

function getRateLimitConfig(pathname: string, method: string): { limit: number; windowMs: number } {
  // Very Strict: Admin Mutations & Auth (5 req / min)
  if (pathname.startsWith('/api/admin') && method !== 'GET') return { limit: 5, windowMs: 60000 };
  if (pathname.startsWith('/api/auth')) return { limit: 5, windowMs: 60000 };
  
  // Strict: USSD (10 req / min)
  if (pathname === '/api/ussd') return { limit: 10, windowMs: 60000 };
  
  // Moderate: User Mutations (Chat, Listings, Demands, Status) (30 req / min)
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    return { limit: 30, windowMs: 60000 };
  }

  // Relaxed: GET requests (100 req / min)
  return { limit: 100, windowMs: 60000 };
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Apply Rate Limiting to all API routes
  if (pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { limit, windowMs } = getRateLimitConfig(pathname, method);

    if (!rateLimit(ip, limit, windowMs)) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip} on ${method} ${pathname}`);
      return NextResponse.json(
        { success: false, error: { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' } },
        { status: 429 }
      );
    }
  }

  // ─── Route Protection ───────────────────────────────────────────────────
  
  // Protect admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const cookie = req.cookies.get(ADMIN_COOKIE);
    if (cookie?.value !== process.env.ADMIN_API_KEY) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect farmer dashboard routes
  if (pathname.startsWith('/dashboard') && pathname !== '/dashboard/login') {
    const cookie = req.cookies.get(FARMER_COOKIE);
    if (!cookie?.value) {
      const loginUrl = new URL('/dashboard/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect buyer dashboard routes
  if (pathname.startsWith('/buyer/dashboard') || pathname.startsWith('/buyer/transactions') || pathname.startsWith('/buyer/demands') || pathname.startsWith('/buyer/settings') || pathname.startsWith('/buyer/disputes') || pathname.startsWith('/buyer/notifications')) {
    const cookie = req.cookies.get(BUYER_COOKIE);
    if (!cookie?.value) {
      const loginUrl = new URL('/buyer/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── Security Headers ───────────────────────────────────────────────────
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/buyer/:path*', '/api/:path*'],
};
