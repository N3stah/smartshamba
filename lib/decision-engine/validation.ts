/**
 * Validates a farmer-provided transport cost estimate.
 * Returns null if invalid, otherwise the parsed number.
 * 
 * Rules:
 * - Must be a finite number
 * - Must be non-negative
 * - Max 2 decimal places
 * - Must not exceed 10,000 KES/bag (domain-specific cap)
 */
export function validateTransportCostEstimate(input: string | null | undefined): number | null {
  if (!input || input.trim() === '') return null;

  const parsed = parseFloat(input);
  
  // Must be finite
  if (!isFinite(parsed)) return null;
  
  // Must be non-negative
  if (parsed < 0) return null;
  
  // Must not exceed domain-specific cap (10,000 KES/bag)
  if (parsed > 10000) return null;
  
  // Must have reasonable precision (max 2 decimal places)
  const decimalParts = input.split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > 2) return null;
  
  return parsed;
}

/**
 * Validates evidence input fields.
 * Returns an object with validated values or null for invalid/missing fields.
 */
export interface ValidatedEvidence {
  photoRef: string | null;
  weightKg: number | null;
  moistureLevel: number | null;
  qualityNote: string | null;
}

export function validateEvidenceInput(input: {
  photoRef?: string;
  weightKg?: string | number;
  moistureLevel?: string | number;
  qualityNote?: string;
}): { valid: boolean; errors: string[]; data: ValidatedEvidence | null } {
  const errors: string[] = [];
  const data: ValidatedEvidence = {
    photoRef: null,
    weightKg: null,
    moistureLevel: null,
    qualityNote: null,
  };

  // Photo reference (optional, but if provided must be a non-empty string)
  if (input.photoRef !== undefined && input.photoRef !== null && input.photoRef.trim() !== '') {
    if (input.photoRef.length > 500) {
      errors.push('Photo reference must not exceed 500 characters.');
    } else {
      data.photoRef = input.photoRef.trim();
    }
  }

  // Weight (optional, but if provided must be a positive number)
  if (input.weightKg !== undefined && input.weightKg !== null && input.weightKg !== '') {
    const weight = typeof input.weightKg === 'string' ? parseFloat(input.weightKg) : input.weightKg;
    if (isNaN(weight) || !isFinite(weight) || weight <= 0 || weight > 10000) {
      errors.push('Weight must be a positive number between 0 and 10,000 kg.');
    } else {
      data.weightKg = weight;
    }
  }

  // Moisture (optional, but if provided must be between 0 and 100)
  if (input.moistureLevel !== undefined && input.moistureLevel !== null && input.moistureLevel !== '') {
    const moisture = typeof input.moistureLevel === 'string' ? parseFloat(input.moistureLevel) : input.moistureLevel;
    if (isNaN(moisture) || !isFinite(moisture) || moisture < 0 || moisture > 100) {
      errors.push('Moisture level must be a number between 0 and 100%.');
    } else {
      data.moistureLevel = moisture;
    }
  }

  // Quality note (optional, but if provided must be a reasonable length)
  if (input.qualityNote !== undefined && input.qualityNote !== null && input.qualityNote.trim() !== '') {
    if (input.qualityNote.length > 1000) {
      errors.push('Quality note must not exceed 1,000 characters.');
    } else {
      data.qualityNote = input.qualityNote.trim();
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : null,
  };
}
