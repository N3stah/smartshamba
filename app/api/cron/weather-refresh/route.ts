import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAndCacheWeather } from '@/lib/weather/weather-service';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch distinct counties that have active farmers/buyers
    const farmers = await prisma.farmer.findMany({
      where: { countyId: { not: null } },
      select: { county: { select: { name: true } } },
      distinct: ['countyId']
    });

    const counties = [...new Set(farmers.map(f => f.county?.name).filter(Boolean))] as string[];
    
    // If no farmers have counties, fallback to defaults so the dashboard isn't empty
    if (counties.length === 0) {
      counties.push('Trans Nzoia', 'Uasin Gishu', 'Nakuru', 'Nairobi');
    }

    const errors = [];
    for (const county of counties) {
      console.log(`[Weather Cron] Fetching weather for ${county}...`);
      const result = await fetchAndCacheWeather(county);
      if (!result) {
        errors.push(`Failed to fetch/cache weather for ${county}. Check server logs.`);
      }
    }

    if (errors.length > 0) {
      console.error('[Weather Cron] Errors:', errors);
      return NextResponse.json({ success: false, error: errors.join('\\n') }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Weather refreshed for ${counties.length} counties.` });
  } catch (error) {
    console.error('[Weather] Cron error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
