/**
 * Extracts a target price from a market question
 * Examples:
 * - "Will BTC hit $97,000 by Nov 28?" → 97000
 * - "Will ETH reach $5000?" → 5000
 * - "BTC above 100000?" → 100000
 */
export function extractTargetPrice(question: string): number | null {
  // Pattern matches:
  // - Currency symbols: $, €, £, ¥
  // - Numbers with commas: 97,000
  // - Numbers with decimals: 97000.50
  // - Large numbers without formatting: 97000
  const patterns = [
    /[\$€£¥]\s*([\d,]+(?:\.\d+)?)/,  // $97,000 or $97000.50
    /(?:hit|reach|above|below|over|under|exceed|cross)\s+[\$€£¥]?\s*([\d,]+(?:\.\d+)?)/i, // "hit $97,000" or "reach 97000"
    /([\d,]+(?:\.\d+)?)\s*[\$€£¥]/, // 97,000$ (number before currency)
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      // Remove commas and convert to number
      const numStr = match[1].replace(/,/g, '');
      const num = parseFloat(numStr);
      
      // Validate it's a reasonable price (positive, not too small)
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  return null;
}

/**
 * Formats a price for display with appropriate decimals
 * @param price - Price value
 * @param decimals - Number of decimals (default: auto-detect based on value)
 */
export function formatPrice(price: number, decimals?: number): string {
  // Auto-detect decimals if not provided
  if (decimals === undefined) {
    if (price < 1) {
      decimals = 4; // Small prices like 0.0543
    } else if (price < 100) {
      decimals = 2; // Prices like 95.14
    } else {
      decimals = 0; // Large prices like 97000
    }
  }

  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a prediction market share price as cents (Polymarket-style)
 * @param price - Share price (between 0 and 1)
 * @returns Formatted price as cents (e.g., "50¢" instead of "$0.50")
 */
export function formatSharePrice(price: number): string {
  // Convert price to cents and round, capping at 99¢ to match Polymarket
  const cents = Math.min(Math.round(price * 100), 99);
  return `${cents}¢`;
}
