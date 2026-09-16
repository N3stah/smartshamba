import { prisma } from '@/lib/prisma';

export interface WeatherContext {
  activeAlerts: { message: string }[];
}

export async function getWeatherContext(countyId: string | null): Promise<WeatherContext> {
  if (!countyId) return { activeAlerts: [] };
  const alert = await prisma.weatherAlert.findFirst({
    where: { countyId, status: 'ACTIVE', severity: { in: ['HIGH', 'CRITICAL'] } },
    select: { message: true }
  });
  return { activeAlerts: alert ? [alert] : [] };
}
