'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PlusCircle, TrendingUp, Wallet, Scale, Inbox } from 'lucide-react';

const CATEGORIES = ['SEED', 'FERTILIZER', 'LABOUR', 'CHEMICALS', 'TRANSPORT', 'HARVESTING', 'STORAGE', 'OTHER'];

type CropCycle = {
  id: string;
  crop: string;
  season: string;
};

type Economics = {
  totalCost: number;
  breakEvenPrice: number | null;
  costPerAcre: number | null;
  costEntries: {
    id: string;
    category: string;
    amountKes: number;
    date: string;
  }[];
};

export default function FarmEconomicsPage() {
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<CropCycle | null>(null);
  const [economics, setEconomics] = useState<Economics | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showCostForm, setShowCostForm] = useState(false);
  
  const [cycleForm, setCycleForm] = useState({ crop: 'Maize', season: '2024', acreage: '', expectedYieldBags: '', plantingDate: '', expectedHarvestDate: '' });
  const [costForm, setCostForm] = useState({ category: 'SEED', amountKes: '', quantity: '', unit: '', description: '' });

  useEffect(() => {
    let isMounted = true;
    const loadCycles = async () => {
      const res = await fetch('/api/farmers/me/crop-cycles');
      const data = await res.json();
      if (isMounted) {
        setCycles(data);
        if (data.length > 0) {
          setSelectedCycle(data[0]);
        }
        setLoading(false);
      }
    };
    loadCycles();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedCycle) return;
    let isMounted = true;
    const loadEconomics = async () => {
      const res = await fetch(`/api/farmers/me/crop-cycles/${selectedCycle.id}/economics`);
      const data = await res.json();
      if (isMounted) {
        setEconomics(data);
      }
    };
    loadEconomics();
    return () => { isMounted = false; };
  }, [selectedCycle]);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/farmers/me/crop-cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cycleForm)
    });
    if (res.ok) {
      setShowCycleForm(false);
      const newCycle = await res.json();
      setCycles([newCycle, ...cycles]);
      setSelectedCycle(newCycle);
    }
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycle) return;
    const res = await fetch(`/api/farmers/me/crop-cycles/${selectedCycle.id}/costs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...costForm, date: new Date().toISOString() })
    });
    if (res.ok) {
      setShowCostForm(false);
      setCostForm({ category: 'SEED', amountKes: '', quantity: '', unit: '', description: '' });
      // Refetch economics
      const econRes = await fetch(`/api/farmers/me/crop-cycles/${selectedCycle.id}/economics`);
      const econData = await econRes.json();
      setEconomics(econData);
    }
  };

  if (loading) return <LoadingSpinner />;

  const renderEmptyState = (title: string, description: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
      <Inbox className="w-10 h-10 text-gray-400 mb-3" />
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111C24]">MavunoWise Farm</h1>
          <p className="text-gray-500">Your Crop Economics</p>
        </div>
        <Button onClick={() => setShowCycleForm(!showCycleForm)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Crop Cycle
        </Button>
      </div>

      {showCycleForm && (
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">New Crop Cycle</h3>
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full p-2 border rounded-md" placeholder="Crop (e.g., Maize)" value={cycleForm.crop} onChange={e => setCycleForm({...cycleForm, crop: e.target.value})} />
            <input className="w-full p-2 border rounded-md" placeholder="Season (e.g., 2024)" value={cycleForm.season} onChange={e => setCycleForm({...cycleForm, season: e.target.value})} />
            <input className="w-full p-2 border rounded-md" placeholder="Acreage" type="number" value={cycleForm.acreage} onChange={e => setCycleForm({...cycleForm, acreage: e.target.value})} />
            <input className="w-full p-2 border rounded-md" placeholder="Expected Yield (bags)" type="number" value={cycleForm.expectedYieldBags} onChange={e => setCycleForm({...cycleForm, expectedYieldBags: e.target.value})} />
            <input className="w-full p-2 border rounded-md" placeholder="Planting Date" type="date" value={cycleForm.plantingDate} onChange={e => setCycleForm({...cycleForm, plantingDate: e.target.value})} />
            <input className="w-full p-2 border rounded-md" placeholder="Expected Harvest" type="date" value={cycleForm.expectedHarvestDate} onChange={e => setCycleForm({...cycleForm, expectedHarvestDate: e.target.value})} />
          </div>
          <Button onClick={handleCreateCycle}>Save Crop Cycle</Button>
        </Card>
      )}

      {cycles.length === 0 ? (
        renderEmptyState("No Crop Cycles", "Create your first crop cycle to start tracking economics.")
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {cycles.map(c => (
            <button 
              key={c.id} 
              onClick={() => setSelectedCycle(c)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${selectedCycle?.id === c.id ? 'bg-[#D97706] text-white' : 'bg-white border border-[#E5E7EB] text-[#111C24]'}`}
            >
              {c.crop} {c.season}
            </button>
          ))}
        </div>
      )}

      {selectedCycle && economics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex flex-col gap-1">
              <div className="flex items-center text-gray-500 text-sm"><Wallet className="h-4 w-4 mr-2" /> Total Production Cost</div>
              <div className="text-2xl font-bold text-[#111C24]">KSh {economics.totalCost.toLocaleString()}</div>
            </Card>
            <Card className="p-4 flex flex-col gap-1">
              <div className="flex items-center text-gray-500 text-sm"><Scale className="h-4 w-4 mr-2" /> Break-even Price / Bag</div>
              {economics.breakEvenPrice ? (
                <div className="text-2xl font-bold text-[#111C24]">KSh {economics.breakEvenPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              ) : (
                <div className="text-sm text-amber-600 mt-2">Add expected yield to calculate break-even price.</div>
              )}
            </Card>
            <Card className="p-4 flex flex-col gap-1">
              <div className="flex items-center text-gray-500 text-sm"><TrendingUp className="h-4 w-4 mr-2" /> Cost / Acre</div>
              {economics.costPerAcre ? (
                <div className="text-2xl font-bold text-[#111C24]">KSh {economics.costPerAcre.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              ) : (
                <div className="text-sm text-gray-400 mt-2">N/A</div>
              )}
            </Card>
          </div>

          <div className="flex justify-between items-center mt-6">
            <h2 className="text-xl font-bold text-[#111C24]">Production Costs</h2>
            <Button variant="outline" onClick={() => setShowCostForm(!showCostForm)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Cost
            </Button>
          </div>

          {showCostForm && (
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="w-full p-2 border rounded-md"
                  value={costForm.category}
                  onChange={e => setCostForm({...costForm, category: e.target.value})}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input className="w-full p-2 border rounded-md" placeholder="Amount (KSh)" type="number" value={costForm.amountKes} onChange={e => setCostForm({...costForm, amountKes: e.target.value})} />
              </div>
              <Button onClick={handleAddCost}>Save Cost</Button>
            </Card>
          )}

          {economics.costEntries.length === 0 ? (
            renderEmptyState("No Costs Recorded", "Add your first cost entry to see totals.")
          ) : (
            <div className="space-y-2">
              {economics.costEntries.map(entry => (
                <Card key={entry.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-[#111C24]">{entry.category}</div>
                    <div className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</div>
                  </div>
                  <div className="font-semibold text-[#111C24]">KSh {entry.amountKes.toLocaleString()}</div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
