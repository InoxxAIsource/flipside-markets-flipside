// Crypto logo detection and URL mapping
// Uses react-icons/si for crypto logos

export interface CryptoToken {
  symbol: string;
  name: string;
  iconName: string; // react-icons/si icon name
  keywords: string[]; // Keywords to detect in market question
}

const cryptoTokens: CryptoToken[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    iconName: 'SiBitcoin',
    keywords: ['bitcoin', 'btc'],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    iconName: 'SiEthereum',
    keywords: ['ethereum', 'eth'],
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    iconName: 'SiSolana',
    keywords: ['solana', 'sol'],
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    iconName: 'SiRipple',
    keywords: ['xrp', 'ripple'],
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    iconName: 'SiBinance',
    keywords: ['bnb', 'binance'],
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    iconName: 'SiDogecoin',
    keywords: ['dogecoin', 'doge'],
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    iconName: 'SiCardano',
    keywords: ['cardano', 'ada'],
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    iconName: 'SiPolygon',
    keywords: ['polygon', 'matic'],
  },
];

/**
 * Detects if a market question contains any cryptocurrency keywords
 * and returns the corresponding crypto token info
 */
export function detectCryptoFromQuestion(question: string): CryptoToken | null {
  const lowerQuestion = question.toLowerCase();
  
  for (const token of cryptoTokens) {
    const hasKeyword = token.keywords.some(keyword => 
      lowerQuestion.includes(keyword)
    );
    
    if (hasKeyword) {
      return token;
    }
  }
  
  return null;
}

/**
 * Gets the appropriate icon name for a crypto token
 */
export function getCryptoIcon(symbol: string): string | null {
  const token = cryptoTokens.find(t => t.symbol === symbol);
  return token?.iconName || null;
}
