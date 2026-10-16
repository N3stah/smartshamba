export interface EvidenceInput {
  bookingId: string;
  photoRef?: string;
  weightKg?: number;
  moistureLevel?: number;
  qualityNote?: string;
}

export interface EvidenceRecord {
  batchId: string;
  photoRef: string | null;
  weightKg: number | null;
  moistureLevel: number | null;
  qualityNote: string | null;
  capturedBy: string;
  capturedAt: string; // ISO string
}
