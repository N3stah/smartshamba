export interface RawMarketRecord {
  date: string;
  county: string;
  market: string;
  commodity: string;
  price_kes_per_kg: string;
  source: string;
}

export interface NormalizedMarketObservation {
  source: string;
  sourceRecordId: string | null;
  county: string;
  market: string;
  commodity: string;
  classification: string | null;
  grade: string | null;
  wholesaleKesPerKg: number | null;
  retailKesPerKg: number | null;
  observedAt: Date;
}

export interface IngestionReport {
  source: string;
  startedAt: Date;
  completedAt: Date;
  rowsRead: number;
  rowsAccepted: number;
  rowsRejected: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsUnchanged: number;
  errors: string[];
}
