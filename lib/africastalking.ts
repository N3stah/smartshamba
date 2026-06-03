/**
 * Africa's Talking USSD response helpers
 * CON = continue session (show menu, wait for input)
 * END = terminate session
 */

export function con(message: string): string {
  return `CON ${message}`;
}

export function end(message: string): string {
  return `END ${message}`;
}

/**
 * Parse Africa's Talking text input into an array of steps
 * e.g. "1*2*50" -> ["1", "2", "50"]
 */
export function parseText(text: string): string[] {
  if (!text || text.trim() === '') return [];
  return text.split('*');
}
