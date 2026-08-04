import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Sentry from '@sentry/nextjs';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[AI] GEMINI_API_KEY is missing. AI features will be disabled.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

interface PredictionResult {
  predictedPrice: number;
  confidenceScore: number;
  recommendation: string;
  explanation: string;
}

export async function getMarketPrediction(
  crop: string,
  historicalData: any[]
): Promise<PredictionResult | null> {
  if (!apiKey) return null;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Format historical data into a simple string for the prompt
    const dataSummary = historicalData.map(d => `Date: ${d.date}, Avg Price: ${d.avgPrice}, Volume: ${d.volume}`).join('\n');
    
    const prompt = `You are an expert agricultural market analyst in Kenya.
    Analyze the following historical transaction data for ${crop}:
    ${dataSummary}

    Based on this data, typical seasonal trends in Kenya, and current market dynamics, predict the price for the next 7 days.
    Return your response STRICTLY as a JSON object with the following structure:
    {
      "predictedPrice": <number representing the predicted average price per 90kg bag in KSh>,
      "confidenceScore": <integer between 0 and 100>,
      "recommendation": "<string: either 'SELL', 'WAIT', or 'BUY'>",
      "explanation": "<string: A 1-2 sentence natural language explanation of your prediction and recommendation>"
    }`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up markdown formatting if present
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      predictedPrice: parseFloat(parsed.predictedPrice),
      confidenceScore: parseInt(parsed.confidenceScore),
      recommendation: parsed.recommendation,
      explanation: parsed.explanation
    };
  } catch (error) {
    console.error('[AI] Error generating prediction:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return null;
  }
}
