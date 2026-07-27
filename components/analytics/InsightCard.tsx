import { Lightbulb } from 'lucide-react';

interface Props {
  insights: string[];
}

export default function InsightCard({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-amber-800 mb-4 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" /> Smart Insights
      </h3>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="text-sm text-amber-900 flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span> {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
