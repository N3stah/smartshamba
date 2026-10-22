export type DecisionAction = 'SELL' | 'HOLD' | 'STORE' | 'REDIRECT' | 'INSUFFICIENT_EVIDENCE';

export interface ExecutableOffer {
  id: string;
  buyerId: string;
  commodity: string;
  pricePerBag: number;
  quantityBags: number;
  destinationCounty: string;
  validUntil?: Date;
}

export interface MarketObservation {
  id: string;
  commodity: string;
  county: string;
  market: string;
  wholesaleKesPerKg: number | null;
  retailKesPerKg: number | null;
  observedAt: Date;
}

export interface ForecastData {
  predictedPriceKesPerKg: number;
  lowerBound: number;
  upperBound: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  isFallback: boolean;
  boundType: 'HEURISTIC' | 'STATISTICAL';
  // Preserved provenance metadata (CTO Amendment §7)
  modelVersion: string;
  trainingDatasetVersion: string;
  trainingDataCutoff: string;
  forecastHorizon: number;
  predictionTimestamp: string;
}

export interface ForecastMetadata {
  modelVersion: string;
  trainingDatasetVersion: string;
  trainingDataCutoff: string;
  forecastHorizon: number;
  predictionTimestamp: string;
  isFallback: boolean;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  boundType: 'HEURISTIC' | 'STATISTICAL';
}

export interface DecisionInput {
  batchId: string;
  bagSizeKg: number;
  commodity: string;
  farmerCounty: string;
  breakEvenPricePerBag: number | null;
  currentOffers: ExecutableOffer[];
  marketObservations: MarketObservation[];
  forecast?: ForecastData | null;
  transportCostPerBag?: number | null;
}

export interface DecisionResult {
  action: DecisionAction;
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
  forecastMetadata?: ForecastMetadata | null;
}
