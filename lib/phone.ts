/**
 * Normalizes Kenyan phone numbers to the 2547XXXXXXXX format required by Daraja.
 * Handles inputs like 07XXXXXXXX, +2547XXXXXXXX, or 2547XXXXXXXX.
 */
export function normalizeMsisdn(phone: string): string | null {
  if (!phone) return null;
  
  let normalized = phone.replace(/\s+/g, '').replace(/\+/g, '');
  
  if (normalized.startsWith('254')) {
    normalized = normalized.substring(3);
  }
  
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  // Should now be 7XXXXXXXX or 1XXXXXXXX (for landlines, though we expect mobile)
  if (!normalized.match(/^(7|1)\d{8}$/)) {
    return null;
  }
  
  return `254${normalized}`;
}
