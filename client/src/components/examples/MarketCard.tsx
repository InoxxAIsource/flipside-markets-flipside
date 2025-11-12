import { MarketCard } from '../MarketCard';

export default function MarketCardExample() {
  const mockMarket = {
    id: '1',
    question: 'Will Bitcoin reach $100,000 by the end of 2025?',
    description: 'This market will resolve to YES if Bitcoin price reaches $100,000 at any point before December 31, 2025.',
    category: 'Crypto',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    resolvedAt: null,
    outcome: null,
    yesPrice: 0.68,
    noPrice: 0.32,
    volume: 125000,
    liquidity: 50000,
    creatorAddress: '0x1234567890123456789012345678901234567890',
    contractAddress: '0x9876543210987654321098765432109876543210',
    pythPriceFeed: 'BTC/USD',
    baselinePrice: 95000,
    resolved: false,
    createdAt: new Date(),
  };

  return <MarketCard market={mockMarket} />;
}
