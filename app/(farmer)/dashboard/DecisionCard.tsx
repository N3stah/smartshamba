'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { AlertTriangle, TrendingUp, Scale, ArrowRight, Sprout, Info, Truck } from 'lucide-react';
import Link from 'next/link';

interface DecisionResult {
  action: string;
  reason: string;
  rationale: string;
  recommendedOfferId?: string;
  expectedNetbackPerBag?: number;
  breakEvenPricePerBag?: number | null;
  warnings: string[];
  evidence: {
    offersEvaluated: number;
    observationsEvaluated: number;
    forecastAvailable: boolean;
    forecastIsFallback: boolean;
  };
  transportCostIsEstimate?: boolean;
}

export default function DecisionCard() {
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [transportCost, setTransportCost] = useState('');
  const [showTransportInput, setShowTransportInput] = useState(false);
  const [transportError, setTransportError] = useState('');

  const loadDecision = async (cost?: string) => {
    setLoading(true);
    setError(false);
    setTransportError('');
    try {
      const url = cost ? `/api/farmers/me/decision?transportCostPerBag=${encodeURIComponent(cost)}` : '/api/farmers/me/decision';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch decision');
      const data = await res.json();
      setDecision(data);
      if (data.reason === 'MISSING_TRANSPORT_COST') {
        setShowTransportInput(true);
      } else {
        setShowTransportInput(false);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecision();
  }, []);

  const handleTransportSubmit = () => {
    const val = parseFloat(transportCost);
    if (isNaN(val) || val < 0 || val > 10000) {
      setTransportError('Enter a valid amount between 0 and 10,000 KSh per bag.');
      return;
    }
    if (transportCost.includes('.') && transportCost.split('.')[1].length > 2) {
      setTransportError('Use at most 2 decimal places.');
      return;
    }
    loadDecision(transportCost);
  };

  if (loading) return <LoadingSpinner />;

  if (error || !decision) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-gray-500">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm">Unable to load recommendation. Please try again later.</p>
        </div>
      </Card>
    );
  }

  // INSUFFICIENT_EVIDENCE states
  if (decision.action === 'INSUFFICIENT_EVIDENCE') {
    let actionText = 'Complete your farm setup';
    let actionHref = '/dashboard/farm-economics';
    let icon = <Sprout className="w-5 h-5" />;

    if (decision.reason === 'NO_CROP_CYCLE') {
      actionText = 'Create a crop cycle & enter costs';
    } else if (decision.reason === 'NO_BATCH') {
      actionText = 'Record a harvest batch';
    } else if (decision.reason === 'NO_EXECUTABLE_OFFERS') {
      actionText = 'View buyer demands';
      actionHref = '/dashboard/demands';
    } else if (decision.reason === 'MISSING_TRANSPORT_COST') {
      actionText = '';
    }

    return (
      <Card className="p-6 border-l-4 border-l-amber-500">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text mb-1">Insufficient data for recommendation</h3>
            <p className="text-xs text-gray-500 mb-3">{decision.rationale}</p>

            {showTransportInput && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <label className="text-xs font-medium text-text flex items-center gap-1 mb-2">
                  <Truck className="w-3 h-3" /> Transport Cost Estimate (KSh per bag)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    value={transportCost}
                    onChange={(e) => { setTransportCost(e.target.value); setTransportError(''); }}
                    placeholder="e.g., 200"
                    className="flex-1 border border-border rounded-md px-3 py-2 text-sm text-text focus:ring-farmer-primary focus:border-farmer-primary"
                  />
                  <Button size="sm" onClick={handleTransportSubmit}>
                    Update
                  </Button>
                </div>
                {transportError && <p className="text-xs text-red-500 mt-1">{transportError}</p>}
                <p className="text-xs text-gray-400 mt-1">This is a farmer-provided estimate, not a confirmed quote. Recommendations using it are estimates.</p>
              </div>
            )}

            {actionText && (
              <Link href={actionHref}>
                <Button variant="outline" size="sm">
                  {icon}
                  <span className="ml-2">{actionText}</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // SELL recommendation
  if (decision.action === 'SELL') {
    return (
      <Card className="p-6 border-l-4 border-l-green-500">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-green-700">Recommendation: SELL NOW</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">{decision.rationale}</p>

            {decision.expectedNetbackPerBag !== undefined && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs text-gray-400">Expected Netback / Bag</p>
                  <p className="text-lg font-bold text-text">KSh {decision.expectedNetbackPerBag.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                {decision.breakEvenPricePerBag && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs text-gray-400">Break-even / Bag</p>
                    <p className="text-lg font-bold text-text">KSh {decision.breakEvenPricePerBag.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                )}
              </div>
            )}

            {decision.transportCostIsEstimate && (
              <div className="flex items-start gap-2 text-xs text-blue-600 mb-2 bg-blue-50 p-2 rounded-md">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Netback is based on a farmer-provided transport estimate, not a confirmed quote.</span>
              </div>
            )}

            {decision.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-600 mb-2 bg-amber-50 p-2 rounded-md">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-400">
                Based on {decision.evidence.offersEvaluated} offer(s) · Forecast: {decision.evidence.forecastAvailable ? (decision.evidence.forecastIsFallback ? 'Fallback' : 'Active') : 'Unavailable'}
              </span>
            </div>

            <Link href="/dashboard/demands">
              <Button size="sm" className="mt-3">
                View buyer demands <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // HOLD or other actions
  return (
    <Card className="p-6 border-l-4 border-l-blue-500">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-text mb-1">Recommendation: {decision.action}</h3>
          <p className="text-xs text-gray-500">{decision.rationale}</p>
        </div>
      </div>
    </Card>
  );
}
