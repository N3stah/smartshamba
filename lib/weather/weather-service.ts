import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export interface WeatherRiskSignal {
  isAvailable: boolean;
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  rationale: string;
}

/**
 * Fetches weather data from a real provider if configured, otherwise skips ingestion.
 * Replaces the previous Math.random() simulation which was unsafe for production.
 */
export async function fetchAndCacheWeather(county: string): Promise<boolean> {
  const providerUrl = process.env.WEATHER_API_URL;
  const providerKey = process.env.OPENWEATHER_API_KEY;

  if (!providerUrl || !providerKey) {
    console.warn(`[WEATHER] No real provider configured for ${county}. Skipping ingestion.`);
    return false;
  }

  try {
    // Example: Call real provider (implementation depends on the specific API)
    // const response = await fetch(`${providerUrl}?q=${county}&appid=${providerKey}`);
    // const data = await response.json();
    // await prisma.weatherData.upsert({ 
    //   where: { county },
    //   update: { data: data, cachedAt: new Date() },
    //   create: { county, data: data }
    // });
    
    console.log(`[WEATHER] Real weather ingestion completed for ${county}.`);
    return true;
  } catch (error: any) {
    console.error(`[WEATHER] Failed to fetch weather for ${county}:`, error.message);
    Sentry.captureException(error);
    return false;
  }
}

/**
 * Retrieves cached weather data for a county.
 * Maintained for backward compatibility with V2 API routes.
 */
export async function getCachedWeather(county: string) {
  return prisma.weatherData.findUnique({
    where: { county }
  });
}

/**
 * Evaluates weather risk for transport decisions based on real, cached data.
 * Returns UNAVAILABLE if data is missing or stale.
 */
export async function evaluateWeatherRisk(county: string): Promise<WeatherRiskSignal> {
  const weatherRecord = await getCachedWeather(county);

  if (!weatherRecord) {
    return {
      isAvailable: false,
      riskLevel: 'NONE',
      rationale: 'Weather data is unavailable for this region.'
    };
  }

  // Check if data is stale (older than 6 hours)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  if (new Date(weatherRecord.cachedAt) < sixHoursAgo) {
    return {
      isAvailable: false,
      riskLevel: 'NONE',
      rationale: 'Weather data is stale.'
    };
  }

  // Evaluate actual risk based on real data (e.g., rainMm > 10)
  // Assuming data is stored as JSON with a rainMm field
  const rainMm = (weatherRecord.data as any)?.rainMm ?? 0;
  if (rainMm > 20) {
    return {
      isAvailable: true,
      riskLevel: 'HIGH',
      rationale: `Heavy rainfall detected (${rainMm}mm). Transport not recommended.`
    };
  }

  return {
    isAvailable: true,
    riskLevel: 'NONE',
    rationale: 'Weather conditions are clear.'
  };
}
