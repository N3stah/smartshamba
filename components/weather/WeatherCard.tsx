'use client';
import { useEffect, useState } from 'react';
import { CloudRain, Sun, Cloud, Droplets, Wind, Loader2, AlertTriangle } from 'lucide-react';

interface WeatherData {
  county: string;
  temperature: number;
  maxTemp: number;
  condition: string;
  description: string;
  rainProbability: number;
  humidity: number;
  advice: string;
}

export default function WeatherCard({ county }: { county: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?county=${encodeURIComponent(county)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [county]);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'rain': case 'drizzle': return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'clear': return <Sun className="w-8 h-8 text-yellow-500" />;
      default: return <Cloud className="w-8 h-8 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#00703C]" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center h-48 text-gray-400">
        <AlertTriangle className="w-6 h-6 mb-2 text-yellow-500" />
        <p className="text-sm">Weather data unavailable for {county}.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Climate Intelligence</h3>
          <p className="text-xs text-gray-400">{weather.county} County</p>
        </div>
        {getWeatherIcon(weather.condition)}
      </div>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-3xl font-bold text-gray-900">{weather.temperature}°C</p>
          <p className="text-xs text-gray-500 capitalize">{weather.description}</p>
        </div>
        <div className="flex gap-3 ml-auto text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span>Rain: {weather.rainProbability}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-4 h-4 text-gray-400" />
            <span>Hum: {weather.humidity}%</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-bold mb-1">Farmer Advisory:</p>
        <p className="text-xs">{weather.advice}</p>
      </div>
    </div>
  );
}
