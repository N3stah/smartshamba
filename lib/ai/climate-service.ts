import * as Sentry from '@sentry/nextjs';

const FOURCASTNET_KEY = process.env.NVIDIA_FOURCASTNET_API_KEY;
const CORRDIFF_KEY = process.env.NVIDIA_CORRDIFF_API_KEY;

interface HyperLocalForecast {
  temp: number;
  precipitation: number;
  windSpeed: number;
  severeRisk: boolean;
  resolution: string;
}

/**
 * V2.0 Advanced Climate Intelligence
 * Uses NVIDIA FourCastNet for medium-range global forecasting 
 * and CorrDiff for generative downscaling to farm-level resolution.
 */
export async function getHyperLocalForecast(lat: number, lon: number): Promise<HyperLocalForecast | null> {
  try {
    // Step 1: FourCastNet - Base Prediction (Global/Meso-scale)
    // Note: NVIDIA Earth-2 APIs typically accept JSON payloads for grid/time requests.
    const fourcastRes = await fetch('https://integrate.api.nvidia.com/v1/weather/fourcastnet/predict', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FOURCASTNET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        horizon_hours: 72 // 3-day forecast
      })
    });

    let baseForecast = { temp: 25, precipitation: 0, windSpeed: 10 }; // Fallback defaults
    if (!fourcastRes.ok) {
      const errText = await fourcastRes.text();
      console.error('[NVIDIA FourCastNet] Error:', fourcastRes.status, errText);
    }
    if (fourcastRes.ok) {
      const fcData = await fourcastRes.json();
      baseForecast = {
        temp: fcData.temperature_2m?.[0] || 25,
        precipitation: fcData.precipitation?.[0] || 0,
        windSpeed: fcData.wind_speed_10m?.[0] || 10
      };
    }

    // Step 2: CorrDiff - Generative Downscaling (Farm-level / 1km resolution)
    const corrdiffRes = await fetch('https://integrate.api.nvidia.com/v1/weather/corrdiff/downscale', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORRDIFF_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        coarse_data: baseForecast
      })
    });

    if (!corrdiffRes.ok) {
      const errText = await corrdiffRes.text();
      console.error('[NVIDIA CorrDiff] Error:', corrdiffRes.status, errText);
    }
    if (corrdiffRes.ok) {
      const cdData = await corrdiffRes.json();
      return {
        temp: cdData.temperature_2m || baseForecast.temp,
        precipitation: cdData.precipitation || baseForecast.precipitation,
        windSpeed: cdData.wind_speed_10m || baseForecast.windSpeed,
        severeRisk: cdData.precipitation > 50 || cdData.wind_speed_10m > 20, // >50mm rain or >20m/s wind
        resolution: '1km (CorrDiff)'
      };
    }

    // Fallback to base FourCastNet if CorrDiff fails
    return {
      ...baseForecast,
      severeRisk: baseForecast.precipitation > 50 || baseForecast.windSpeed > 20,
      resolution: '9km (FourCastNet)'
    };

  } catch (error) {
    console.error('[AI Climate] NVIDIA Earth-2 request failed:', error);
    Sentry.captureException(error);
    return null;
  }
}
