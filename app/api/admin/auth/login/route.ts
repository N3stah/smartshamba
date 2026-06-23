import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'smartshamba_admin';
const SESSION_DURATION = 60 * 60 * 8; // 8 hours

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== process.env.ADMIN_API_KEY) {
      console.warn('[AUTH] Failed login attempt');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, process.env.ADMIN_API_KEY!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_DURATION,
    });

    console.log('[AUTH] Admin login successful');
    return response;
  } catch (error) {
    console.error('[AUTH] Login error:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
