'use client';
import { Shield, Award, Star } from 'lucide-react';

interface TrustScore {
  score: number;
  level: string;
}

const LEVEL_STYLES = {
  PLATINUM: { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: '🏆' },
  GOLD: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🥇' },
  SILVER: { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: '🥈' },
  BRONZE: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: '🥉' },
  NEW: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: '🌱' }
};

export default function TrustScoreBadge({ trustScore, size = 'sm' }: { trustScore: TrustScore | null; size?: 'sm' | 'md' | 'lg' }) {
  if (!trustScore) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200`}>
        <Star className="w-3 h-3" /> New User
      </span>
    );
  }

  const style = LEVEL_STYLES[trustScore.level as keyof typeof LEVEL_STYLES] || LEVEL_STYLES.NEW;
  const sizeClass = size === 'lg' ? 'px-4 py-2 text-base' : size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClass} font-bold rounded-full border ${style.bg} ${style.color} ${style.border}`}>
      <span>{style.icon}</span>
      <span>{trustScore.level}</span>
      <span className="opacity-75">({trustScore.score})</span>
    </span>
  );
}
