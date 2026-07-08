import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'smartshamba_admin';
const FARMER_COOKIE = 'smartshamba_farmer';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
