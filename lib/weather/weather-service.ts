import { prisma } from '@/lib/prisma';
import { getAnalyticalProvider } from '@/lib/ai/providers';

export async function fetchAndCacheWeather(county: string) {
  try {
    console.log(`[Weather] Fetching weather for ${county}...`);
    // Simulate fetching weather data (in a real app, this would call OpenWeatherMap or similar)
    const temp = 20 + Math.random() * 10;
    const humidity = 50 + Math.random() * 40;
    const rainMm = Math.random() * 20;
    const windSpeed = 5 + Math.random() * 15;
    const condition = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'][Math.floor(Math.random() * 4)];

    const data = { temp, humidity, rainMm, windSpeed, condition };
    
    await prisma.weatherData.upsert({
      where: { county },
      update: { data: data as any, cachedAt: new Date() },
      create: { county, data: data as any }
    });

    // If rainy/stormy, generate an alert
    if (condition === 'Rainy' || condition === 'Stormy') {
      const severity = condition === 'Stormy' ? 'CRITICAL' : 'HIGH';
      const message = `${condition} weather expected in ${county}. Potential transport delays.`;
      
      await prisma.weatherAlert.upsert({
        where: { county_type: { county, type: condition.toUpperCase() } },
        update: { status: 'ACTIVE', message, severity: severity as any },
        create: { county, type: condition.toUpperCase(), status: 'ACTIVE', message, severity: severity as any }
      });
    } else {
      // Clear alerts if weather is fine
      await prisma.weatherAlert.updateMany({
        where: { county, status: 'ACTIVE' },
        data: { status: 'RESOLVED' }
      });
    }

    console.log(`[Weather] Cached weather for ${county}`);
    return true;
  } catch (error) {
    console.error(`[Weather] Error fetching weather for ${county}:`, error);
    return false;
  }
}

export async function getCachedWeather(county: string) {
  const data = await prisma.weatherData.findUnique({ where: { county } });
  if (!data) return null;

  const ageMs = Date.now() - data.cachedAt.getTime();
  if (ageMs > 60 * 60 * 1000) { // 1 hour
    return fetchAndCacheWeather(county);
  }

  return data;
}

export async function generateWeatherAdvisory(prompt: string): Promise<string | null> {
  const provider = getAnalyticalProvider();
  return provider.generateResponse(prompt, { temperature: 0.7, maxTokens: 1000 });
}
