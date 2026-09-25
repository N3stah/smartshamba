export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, CloudRain } from 'lucide-react';
import ProWeatherDashboard from '@/components/weather/ProWeatherDashboard';
import WeatherAlertBanner from '@/components/weather/WeatherAlertBanner';
import ProcurementIntelligence from '@/components/weather/ProcurementIntelligence';


export default async function BuyerWeatherPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ where: { phone }, include: { county: true } });
  if (!buyer) redirect('/buyer/login');

  const countyName = buyer.county?.name ?? 'Trans Nzoia';
  
  let weather = null;
  let advisory = {};
  try {
    weather = await prisma.weatherData.findUnique({ where: { county: countyName } });
    if (weather?.advisory) {
      advisory = JSON.parse(weather.advisory);
    }
  } catch (e) {
    console.error('Failed to fetch weather:', e);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-buyer-secondary rounded-lg">
            <CloudRain className="w-6 h-6 text-buyer-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Procurement Climate Intelligence</h1>
            <p className="text-sm text-gray-500">AI-powered supply chain & weather insights for {countyName}</p>
          </div>
        </div>
        
      </div>

      <WeatherAlertBanner county={countyName} />

      {!weather ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Weather data is loading for {countyName}.
        </div>
      ) : (
        <>
          <ProcurementIntelligence county={countyName} />
          <ProWeatherDashboard county={countyName} weatherData={weather.data as any} advisoryData={advisory} primaryColor="bg-buyer-primary" primaryTextColor="text-buyer-primary" primaryHoverColor="hover:bg-buyer-primary/90" primaryFocusColor="focus:border-buyer-primary" />
        </>
      )}
    </div>
  );
}
