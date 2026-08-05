import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';
import * as Sentry from '@sentry/nextjs';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

const COUNTY_COORDS: Record<string, { lat: number, lon: number }> = {
  'Trans Nzoia': { lat: 1.0167, lon: 34.9833 },
  'Uasin Gishu': { lat: 0.5143, lon: 35.2698 },
  'Nakuru': { lat: -0.3031, lon: 36.0800 },
  'Kakamega': { lat: 0.2827, lon: 34.7519 },
  'Bungoma': { lat: 0.5635, lon: 34.5608 },
  'Busia': { lat: 0.4600, lon: 34.1110 },
  'Kericho': { lat: -0.3673, lon: 35.2833 },
  'Nairobi': { lat: -1.2864, lon: 36.8172 }
};

function degToCompass(num: number): string {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

async function callAIProvider(prompt: string): Promise<string | null> {
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.4 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    } catch (e) {}
  }
  
  if (NVIDIA_API_KEY) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "z-ai/glm-5.2",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 500
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (e) { return null; }
  }
  return null;
}

export async function fetchAndCacheWeather(countyName: string) {
  if (!OPENWEATHER_API_KEY) return null;
  const coords = COUNTY_COORDS[countyName] || COUNTY_COORDS['Nairobi'];

  try {
    const [forecastRes, currentRes, airRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}`)
    ]);

    if (!forecastRes.ok || !currentRes.ok || !airRes.ok) throw new Error('OpenWeather API failed');
    
    const forecastData = await forecastRes.json();
    const currentData = await currentRes.json();
    const airData = await airRes.json();

    const formattedData = {
      current: {
        temp: Math.round(currentData.main.temp),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6),
        windDeg: currentData.wind.deg,
        windDir: degToCompass(currentData.wind.deg),
        condition: currentData.weather[0].main,
        description: currentData.weather[0].description,
        rainProbability: Math.round(forecastData.list[0].pop * 100),
        uvi: Math.round(currentData.uvi || 0),
        visibility: Math.round((currentData.visibility || 10000) / 1000),
        aqi: airData.list[0].main.aqi,
        pm25: airData.list[0].components.pm2_5,
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset,
      },
      forecast: forecastData.list.slice(0, 40).map((item: any) => ({
        time: item.dt,
        temp: Math.round(item.main.temp),
        rain: Math.round(item.pop * 100),
        condition: item.weather[0].main
      }))
    };

    const prompt = `You are an expert precision agriculture and supply chain assistant in Kenya. Analyze this weather data for ${countyName} County:
    Current: ${formattedData.current.temp}°C, ${formattedData.current.description}, Rain: ${formattedData.current.rainProbability}%, Humidity: ${formattedData.current.humidity}%, Wind: ${formattedData.current.windSpeed}km/h ${formattedData.current.windDir}.
    
    Provide a JSON response with these exact keys:
    {
      "agronomy": "1 sentence advisory on planting, spraying, or irrigation based on rain and humidity",
      "disease_risk": "1 sentence assessment of fungal/pest disease risk based on humidity and leaf wetness (High/Medium/Low + reason)",
      "logistics": "1 sentence advisory on harvest trafficability and transport conditions for buyers (Good/Fair/Poor + reason)"
    }`;

    const aiResponse = await callAIProvider(prompt);
    let aiAdvisory = { agronomy: "Advisory unavailable.", disease_risk: "N/A", logistics: "N/A" };
    
    if (aiResponse) {
      try {
        const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        aiAdvisory = JSON.parse(cleanJson);
      } catch (e) {
        aiAdvisory.agronomy = aiResponse;
      }
    }

    const cached = await prisma.weatherCache.upsert({
      where: { county: countyName },
      update: { data: formattedData, advisory: JSON.stringify(aiAdvisory), updatedAt: new Date() },
      create: { county: countyName, data: formattedData, advisory: JSON.stringify(aiAdvisory) }
    });

    // --- Extreme Weather Alert Detection & SMS Notification ---
    const maxRain = Math.max(...formattedData.forecast.map((f: any) => f.rain));
    const maxWind = Math.max(...formattedData.forecast.map((f: any) => f.condition.toLowerCase().includes('wind') ? 30 : 10)); // simplified wind check
    const minTemp = Math.min(...formattedData.forecast.map((f: any) => f.temp));

    const checkAndNotify = async (type: string, condition: boolean, message: string) => {
      const alertExists = await prisma.weatherAlert.findUnique({ where: { county_type: { county: countyName, type } } });
      if (condition) {
        if (!alertExists) {
          await prisma.weatherAlert.create({ data: { county: countyName, type, severity: 'WARNING', message } });
          // Send SMS to farmers and buyers in this county\n          const farmers = await prisma.farmer.findMany({ where: { county: { name: countyName } }, select: { phone: true, id: true } });\n          const buyers = await prisma.buyer.findMany({ where: { county: { name: countyName } }, select: { phone: true, id: true } });\n          const allUsers = [...farmers, ...buyers];\n          for (const u of allUsers) {\n            await sendNotification({ type: 'HARVEST_ADVISORY', recipientPhone: u.phone, body: `SmartShamba Alert: ${message}`, farmerId: u.id }).catch(()=>{});\n          }
          const farmers = await prisma.farmer.findMany({ where: { county: { name: countyName } }, select: { phone: true, id: true } });
          for (const f of farmers) {
            await sendNotification({ type: 'HARVEST_ADVISORY', recipientPhone: f.phone, body: `SmartShamba Alert: ${message}`, farmerId: f.id }).catch(()=>{});
          }
        }
      } else {
        if (alertExists) await prisma.weatherAlert.delete({ where: { id: alertExists.id } }).catch(()=>{});
      }
    };

    await checkAndNotify('HEAVY_RAIN', maxRain > 80 || formattedData.current.condition.toLowerCase().includes('storm'), `Heavy rain expected in ${countyName}. Risk of flooding and harvest damage.`);
    await checkAndNotify('STRONG_WIND', formattedData.current.windSpeed > 30, `Strong winds (>30km/h) expected in ${countyName}. Secure loose structures and delay spraying.`);
    await checkAndNotify('COLD_FROST', minTemp < 10, `Cold conditions (<10°C) expected in ${countyName}. Protect young seedlings from frost.`);

    // Store Weather History for trend analysis\n    const today = new Date();\n    today.setHours(0, 0, 0, 0);\n    await prisma.weatherHistory.upsert({\n      where: { county_date: { county: countyName, date: today } },\n      update: {\n        temp: formattedData.current.temp,\n        humidity: formattedData.current.humidity,\n        rainMm: formattedData.current.rainProbability > 50 ? 10 : 0, // Estimate\n        windSpeed: formattedData.current.windSpeed,\n        condition: formattedData.current.condition,\n      },\n      create: {\n        county: countyName,\n        date: today,\n        temp: formattedData.current.temp,\n        humidity: formattedData.current.humidity,\n        rainMm: formattedData.current.rainProbability > 50 ? 10 : 0,\n        windSpeed: formattedData.current.windSpeed,\n        condition: formattedData.current.condition,\n      }\n    }).catch(() => {}); // Non-blocking\n\n    return cached;
  } catch (error) {
    console.error('[Weather] Fetch failed:', error);
    Sentry.captureException(error);
    return null;
  }
}

export async function getCachedWeather(countyName: string) {
  return prisma.weatherCache.findUnique({ where: { county: countyName } });
}
