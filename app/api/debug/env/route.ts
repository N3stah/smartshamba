import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasKey: !!process.env.MPESA_CONSUMER_KEY,
    hasSecret: !!process.env.MPESA_CONSUMER_SECRET,
    hasShortcode: !!process.env.MPESA_SHORTCODE,
    hasCallback: !!process.env.MPESA_CALLBACK_URL,
    env: process.env.MPESA_ENV,
  });
}