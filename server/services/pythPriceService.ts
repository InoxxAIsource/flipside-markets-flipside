/**
 * Service to fetch current prices from Pyth Network's public API
 * Uses Hermes (https://hermes.pyth.network) - Pyth's public price data API
 */

interface PythPriceData {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
  ema_price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
}

interface PythPriceResponse {
  currentPrice: number;
  confidence: number;
  publishTime: Date;
  exponent: number;
}

/**
 * Fetch latest price for a Pyth price feed
 * @param priceFeedId - Pyth price feed ID (hex string starting with 0x)
 * @returns Current price data
 */
export async function fetchPythPrice(priceFeedId: string): Promise<PythPriceResponse | null> {
  try {
    // Remove 0x prefix if present
    const feedId = priceFeedId.startsWith('0x') ? priceFeedId.slice(2) : priceFeedId;
    
    // Fetch from Pyth Hermes API
    const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch Pyth price: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.parsed || data.parsed.length === 0) {
      console.error('No price data returned from Pyth');
      return null;
    }

    const priceData: PythPriceData = data.parsed[0];
    
    // Parse price and confidence with exponent
    const rawPrice = parseFloat(priceData.price.price);
    const rawConfidence = parseFloat(priceData.price.conf);
    const exponent = priceData.price.expo;
    
    // Normalize price using exponent (e.g., expo = -8 means divide by 10^8)
    const normalizedPrice = rawPrice * Math.pow(10, exponent);
    const normalizedConfidence = rawConfidence * Math.pow(10, exponent);
    
    return {
      currentPrice: normalizedPrice,
      confidence: normalizedConfidence,
      publishTime: new Date(priceData.price.publish_time * 1000),
      exponent,
    };
  } catch (error: any) {
    console.error('Error fetching Pyth price:', error.message);
    return null;
  }
}

/**
 * Pyth price feed IDs for common assets
 * From: https://pyth.network/developers/price-feed-ids
 */
export const PYTH_PRICE_FEEDS = {
  // Crypto
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'XRP/USD': '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
  'BNB/USD': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  'DOGE/USD': '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  'ADA/USD': '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
  'MATIC/USD': '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
} as const;
