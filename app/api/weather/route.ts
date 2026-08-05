import { NextRequest, NextResponse } from 'next/server';
import { getCachedWeather } from '@/lib/weather/weather-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const county = searchParams.get('county') || 'Trans Nzoia';
  
  const weather = await getCachedWeather(county);
  if (!weather) {
    return NextResponse.json({ error: 'Weather data not available yet. Run cron job.' }, { status: 404 });
  }
  
  return NextResponse.json(weather);
}
