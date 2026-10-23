import { ForecastData } from './types';

const FASTAPI_TIMEOUT_MS = 2000;

export async function fetchForecast(
  baseUrl: string,
  commodity: string,
  market: string,
  county: string,
  forecastHorizon: number
): Promise<ForecastData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FASTAPI_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/predict-price-range`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commodity, market, county, forecastHorizon }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn(`[Decision Engine] Forecast service returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Validate response shape strictly - including required metadata fields
    if (typeof data.predictedPrice !== 'number' || 
        typeof data.isFallback !== 'boolean' ||
        !['LOW', 'MEDIUM', 'HIGH'].includes(data.confidence) ||
        typeof data.modelVersion !== 'string' ||
        typeof data.trainingDatasetVersion !== 'string' ||
        typeof data.trainingDataCutoff !== 'string' ||
        typeof data.forecastHorizon !== 'number' ||
        typeof data.predictionTimestamp !== 'string') {
      console.warn('[Decision Engine] Malformed forecast response received - missing required metadata.');
      return null;
    }

    return {
      predictedPriceKesPerKg: data.predictedPrice,
      lowerBound: data.lowerBound,
      upperBound: data.upperBound,
      confidence: data.confidence,
      isFallback: data.isFallback,
      boundType: data.boundType,
      modelVersion: data.modelVersion,
      trainingDatasetVersion: data.trainingDatasetVersion,
      trainingDataCutoff: data.trainingDataCutoff,
      forecastHorizon: data.forecastHorizon,
      predictionTimestamp: data.predictionTimestamp
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[Decision Engine] Forecast service request timed out.');
    } else {
      console.warn(`[Decision Engine] Forecast service unavailable: ${error.message}`);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
