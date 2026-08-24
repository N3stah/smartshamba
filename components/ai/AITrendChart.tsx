'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Prediction {
  id: string;
  crop: string;
  horizon: string;
  currentPrice: number;
  predictedPrice: number;
  confidenceScore: number;
  recommendation: string;
  explanation: string | null;
}

export default function AITrendChart({ predictions }: { predictions: Prediction[] }) {
  if (!predictions || predictions.length === 0) return null;

  // Format data for charts
  const chartData = predictions.map(p => ({
    horizon: p.horizon,
    current: p.currentPrice,
    predicted: p.predictedPrice,
    confidence: p.confidenceScore
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-[400px]">
      <h3 className="text-sm font-bold text-gray-700 mb-4">Price Forecast Trend</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="horizon" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip 
            formatter={(value: any) => `KSh ${Number(value).toLocaleString()}`}
          />
          <Legend />
          <Line type="monotone" dataKey="current" stroke="#6b7280" strokeWidth={2} name="Current Price" dot={{ r: 4 }} />
          <Line type="monotone" dataKey="predicted" stroke="#00703C" strokeWidth={3} name="AI Predicted Price" dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
