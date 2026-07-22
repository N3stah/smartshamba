/**
 * KYC-lite: Kenya National ID validation
 * Format check only - not third-party verification against government database.
 * Kenya National ID is 8 digits.
 */

/**
 * Validates a Kenyan National ID number.
 * @param id - The ID string to validate
 * @returns true if valid format (8 digits), false otherwise
 */
export function isValidKenyanNationalId(id: string): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  // Kenya National ID: exactly 8 digits
  return /^\d{8}$/.test(trimmed);
}

/**
 * Sanitizes a National ID input by removing any non-digit characters.
 * @param id - Raw input string
 * @returns Sanitized 8-digit string or null if invalid
 */
export function sanitizeNationalId(id: string): string | null {
  if (!id) return null;
  const digits = id.replace(/\D/g, '');
  if (digits.length === 8) return digits;
  return null;
}
