/**
 * KYC-lite: Kenya National ID validation
 * Format check only - not third-party verification against government database.
 * Kenya National ID is 8 digits.
 */

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

/**
 * Validates a Kenyan National ID number.
 * @param id - The ID string to validate
 * @returns true if valid format (8 digits), false otherwise
 */
export function isValidKenyanNationalId(id: string): boolean {
  return sanitizeNationalId(id) !== null;
}
