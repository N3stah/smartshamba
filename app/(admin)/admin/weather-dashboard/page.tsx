import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, CloudRain, AlertTriangle, MapPin } from 'lucide-react';
import RefreshWeatherButton from '@/components/admin/RefreshWeatherButton';

export const dynamic = 'force-dynamic';

interface WeatherCurrent {
  temp: number;
  rainProbability: number;
  wind: number;
  humidity: number;
}
export default async function AdminWeatherDashboard() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('smartshamba_admin')?.value === process.env.ADMIN_API_KEY;
  if (!isAdmin) redirect('/admin/login');

  let weatherData: Awaited<ReturnType<typeof prisma.weatherData.findMany>> = [];
  let activeAlerts: Awaited<ReturnType<typeof prisma.weatherAlert.findMany>> = [];
  try {
    [weatherData, activeAlerts] = await Promise.all([
      prisma.weatherData.findMany(),
prisma.weatherAlert.findMany({ orderBy: { createdAt: 'desc' } })
    ]);
  } catch (err) {
    console.error('Failed to fetch admin weather data:', err);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CloudRain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">National Climate Operations</h1>
            <p className="text-sm text-gray-500">Monitor weather impacts and alerts across all regions</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <RefreshWeatherButton />
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      {/* Active Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-800">Active Weather Alerts ({activeAlerts.length})</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-red-600 uppercase">{alert.type.replace('_', ' ')}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${alert.severity === 'WARNING' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" /> {alert.county}
                </p>
                <p className="text-xs text-gray-700">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* County Weather Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Regional Weather Status</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {weatherData.map(w => (
            <div key={w.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm mb-2">{w.county} County</h3>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Temp: {(w.data as unknown as { current: WeatherCurrent }).current.temp}°C</span>
                <span>Rain: {(w.data as unknown as { current: WeatherCurrent }).current.rainProbability}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Wind: {(w.data as unknown as { current: WeatherCurrent }).current.wind} km/h</span>
                <span>Humidity: {(w.data as unknown as { current: WeatherCurrent }).current.humidity}%</span>
              </div>
              <p className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-gray-200">&ldquo;{w.advisory}&rdquo;</p>
            </div>
          ))}
          {weatherData.length === 0 && <p className="text-gray-400 text-sm col-span-full text-center py-4">No weather data cached yet. Run cron job.</p>}
        </div>
      </div>
    </div>
  );
}
