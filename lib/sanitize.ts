/**
 * Sanitizes user input to prevent XSS attacks.
 * Pure regex implementation — no jsdom dependency.
 * Removes all HTML tags and scripts, returning only safe text.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  // Strip all HTML tags
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}
