import type { FarmCostEntry, FarmCropCycle } from '@prisma/client';

type CostEntry = Pick<FarmCostEntry, 'amountKes'>;
type CropCycle = Pick<FarmCropCycle, 'expectedYieldBags' | 'acreage'>;

export function calculateTotalCost(costEntries: CostEntry[]): number {
  if (!costEntries || costEntries.length === 0) return 0;
  return costEntries.reduce((sum, entry) => sum + (entry.amountKes || 0), 0);
}

export function calculateCostPerBag(totalCost: number, expectedYieldBags: number | null | undefined): number | null {
  if (!expectedYieldBags || expectedYieldBags <= 0) return null;
  return totalCost / expectedYieldBags;
}

export function calculateBreakEvenPrice(totalCost: number, expectedYieldBags: number | null | undefined): number | null {
  return calculateCostPerBag(totalCost, expectedYieldBags);
}

export function calculateCostPerAcre(totalCost: number, acreage: number | null | undefined): number | null {
  if (!acreage || acreage <= 0) return null;
  return totalCost / acreage;
}

export interface FarmEconomicsResult {
  totalCost: number;
  costPerBag: number | null;
  breakEvenPrice: number | null;
  costPerAcre: number | null;
}

export function calculateFarmEconomics(cycle: CropCycle, costEntries: CostEntry[]): FarmEconomicsResult {
  const totalCost = calculateTotalCost(costEntries);
  return {
    totalCost,
    costPerBag: calculateCostPerBag(totalCost, cycle.expectedYieldBags),
    breakEvenPrice: calculateBreakEvenPrice(totalCost, cycle.expectedYieldBags),
    costPerAcre: calculateCostPerAcre(totalCost, cycle.acreage),
  };
}
