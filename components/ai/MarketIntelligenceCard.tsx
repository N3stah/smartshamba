'use client';
import { useEffect, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, MinusCircle, Loader2 } from 'lucide-react';

interface Prediction {
  id: string;
  crop: string;
  horizon: string;
  currentPrice: number;
  predictedPrice: number;
  confidenceScore: number;
  recommendation: string;
  explanation: string;
}

export default function MarketIntelligenceCard({ role }: { role: 'FARMER' | 'BUYER' }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/ai/predictions');
        if (res.ok) setPredictions(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchPredictions();
  }, []);

  const getRecommendationStyle = (rec: string) => {
    if (role === 'BUYER') {
      // For buyers, SELL means it's a good time to buy (farmers are selling)
      return rec === 'SELL' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    }
    return rec === 'SELL' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getTrendIcon = (current: number, predicted: number) => {
    if (predicted > current) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (predicted < current) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <MinusCircle className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#00703C]" />
      </div>
    );
  }

  if (predictions.length === 0) return null;

  const crops = [...new Set(predictions.map(p => p.crop))];

  return (
    <div className="bg-gradient-to-br from-[#00703C] to-[#004d29] rounded-xl shadow-lg p-6 text-white mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-6 h-6" />
        <h3 className="text-lg font-bold">AI Market Intelligence</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {crops.map(crop => {
          const cropPreds = predictions.filter(p => p.crop === crop).sort((a, b) => a.horizon.localeCompare(b.horizon));
          const latest = cropPreds[0]; // 7-day
          
          if (!latest) return null;
          
          const priceChange = latest.predictedPrice - latest.currentPrice;
          const percentChange = latest.currentPrice > 0 ? (priceChange / latest.currentPrice) * 100 : 0;

          return (
            <div key={crop} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-green-100">{crop} (7-Day Forecast)</p>
                  <p className="text-2xl font-bold">KSh {latest.predictedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                {getTrendIcon(latest.currentPrice, latest.predictedPrice)}
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-white h-1.5 rounded-full" style={{ width: `${latest.confidenceScore}%` }}></div>
                </div>
                <span className="text-xs font-medium">{latest.confidenceScore}% Confidence</span>
              </div>

              <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${getRecommendationStyle(latest.recommendation)}`}>
                {role === 'BUYER' && latest.recommendation === 'SELL' ? 'BUY NOW' : latest.recommendation}
              </div>
              
              <p className="text-xs text-green-50 italic">"{latest.explanation}"</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
