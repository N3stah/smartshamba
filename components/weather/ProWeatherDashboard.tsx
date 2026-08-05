'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CloudRain, Sun, Cloud, Wind, Droplets, Eye, ShieldAlert, Send, Loader2, Sunrise, Sunset, Thermometer, Activity, Bug, Truck, Sprout } from 'lucide-react';

interface WeatherData {
  current: {
    temp: number; humidity: number; windSpeed: number; windDir: string;
    condition: string; description: string; rainProbability: number;
    uvi: number; visibility: number; aqi: number; pm25: number;
    sunrise: number; sunset: number;
  };
  forecast: { time: number; temp: number; rain: number; condition: string }[];
}

const formatEAT = (unix: number) => new Date(unix * 1000).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit' });
const formatEATshort = (unix: number) => new Date(unix * 1000).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', weekday: 'short', hour: '2-digit' });

export default function ProWeatherDashboard({ county, weatherData, advisoryData }: { county: string; weatherData: WeatherData; advisoryData: any }) {
  const [chatInput, setChatInput] = useState('');
  const [chatRes, setChatRes] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const getWeatherIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'rain': case 'drizzle': return <CloudRain className="w-10 h-10 text-blue-500" />;
      case 'clear': return <Sun className="w-10 h-10 text-yellow-500" />;
      default: return <Cloud className="w-10 h-10 text-gray-400" />;
    }
  };

  const getAqiStyle = (aqi: number) => {
    if (aqi <= 2) return 'bg-green-100 text-green-800';
    if (aqi === 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatLoading(true);
    setChatRes('');
    try {
      const res = await fetch('/api/ai/weather-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, county })
      });
      const data = await res.json();
      if (res.ok) setChatRes(data.response);
      else setChatRes(data.error || 'Sorry, I could not process that.');
    } catch (e) { setChatRes('Network error.'); }
    finally { setChatLoading(false); setChatInput(''); }
  };

  const dailyForecast = weatherData.forecast.filter((_, i) => i % 8 === 0).slice(0, 5);
  const hourlyForecast = weatherData.forecast.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Top Section: Current Weather & Metrics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Weather Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center">
          {getWeatherIcon(weatherData.current.condition)}
          <p className="text-4xl font-bold text-gray-900 mt-2">{weatherData.current.temp}°C</p>
          <p className="text-sm text-gray-500 capitalize">{weatherData.current.description}</p>
          <p className="text-xs text-gray-400 mt-1">{county} County (EAT: {formatEAT(Date.now()/1000)})</p>
        </div>

        {/* Granular Metrics Grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2">
            <CloudRain className="w-6 h-6 text-blue-500 mb-1" />
            <p className="text-lg font-bold text-gray-900">{weatherData.current.rainProbability}%</p>
            <p className="text-xs text-gray-500">Rain Chance</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2">
            <Wind className="w-6 h-6 text-gray-400 mb-1" />
            <p className="text-lg font-bold text-gray-900">{weatherData.current.windSpeed} km/h</p>
            <p className="text-xs text-gray-500">Wind ({weatherData.current.windDir})</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-teal-50 rounded-lg p-2">
            <Droplets className="w-6 h-6 text-teal-500 mb-1" />
            <p className="text-lg font-bold text-gray-900">{weatherData.current.humidity}%</p>
            <p className="text-xs text-gray-500">Humidity</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-purple-50 rounded-lg p-2">
            <Sun className="w-6 h-6 text-purple-500 mb-1" />
            <p className="text-lg font-bold text-gray-900">{weatherData.current.uvi}</p>
            <p className="text-xs text-gray-500">UV Index</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-indigo-50 rounded-lg p-2">
            <Eye className="w-6 h-6 text-indigo-500 mb-1" />
            <p className="text-lg font-bold text-gray-900">{weatherData.current.visibility} km</p>
            <p className="text-xs text-gray-500">Visibility</p>
          </div>
          <div className={`flex flex-col items-center justify-center rounded-lg p-2 ${getAqiStyle(weatherData.current.aqi)}`}>
            <ShieldAlert className="w-6 h-6 mb-1" />
            <p className="text-lg font-bold">{weatherData.current.aqi}/5</p>
            <p className="text-xs">AQI (PM2.5: {weatherData.current.pm25})</p>
          </div>
        </div>

        {/* Precision Agronomy AI Advisory */}
        <div className="bg-gradient-to-br from-[#00703C] to-[#004d29] rounded-xl shadow-lg p-6 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Precision Agronomy AI</h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2"><Sprout className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span><span className="font-bold text-green-200">Agronomy:</span> {advisoryData?.agronomy || 'N/A'}</span></p>
              <p className="flex items-start gap-2"><Bug className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span><span className="font-bold text-green-200">Disease Risk:</span> {advisoryData?.disease_risk || 'N/A'}</span></p>
              <p className="flex items-start gap-2"><Truck className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span><span className="font-bold text-green-200">Logistics:</span> {advisoryData?.logistics || 'N/A'}</span></p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20 text-xs text-green-100">
            <span className="flex items-center gap-1"><Sunrise className="w-4 h-4" /> {formatEAT(weatherData.current.sunrise)}</span>
            <span className="flex items-center gap-1"><Sunset className="w-4 h-4" /> {formatEAT(weatherData.current.sunset)}</span>
          </div>
        </div>
      </div>

      {/* 5-Day Trend Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-[300px]">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Thermometer className="w-4 h-4 text-red-500" /> 5-Day Temperature Trend</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={dailyForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tickFormatter={formatEATshort} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(t) => formatEATshort(Number(t))} formatter={(v: any) => [`${v}°C`, 'Temp']} />
              <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-[300px]">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><CloudRain className="w-4 h-4 text-blue-500" /> 24-Hour Rain Probability</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={hourlyForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tickFormatter={formatEAT} tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip labelFormatter={(t) => formatEAT(Number(t))} formatter={(v: any) => [`${v}%`, 'Rain']} />
              <Bar dataKey="rain" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Natural Language Weather AI */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Cloud className="w-4 h-4 text-gray-500" /> Ask Precision Agronomy AI</h3>
        <p className="text-xs text-gray-500 mb-3">Type naturally, e.g., "Is it too windy for spraying?" or "Will heavy rain delay harvest trucks?"</p>
        
        <form onSubmit={handleAskAI} className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about weather impacts on your farm..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00703C]"
            disabled={chatLoading}
          />
          <button type="submit" disabled={chatLoading || !chatInput.trim()} className="bg-[#00703C] text-white p-2.5 rounded-full hover:bg-[#00582f] disabled:opacity-50">
            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {chatRes && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800">
            <span className="font-bold text-[#00703C]">AI:</span> {chatRes}
          </div>
        )}
      </div>
    </div>
  );
}
