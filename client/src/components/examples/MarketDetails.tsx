import { MarketDetails } from '../MarketDetails';

export default function MarketDetailsExample() {
  const mockMarket = {
    id: '1',
    question: 'Will Bitcoin reach $100,000 by the end of 2025?',
    description: 'This market will resolve to YES if Bitcoin (BTC/USD) reaches a price of $100,000 or higher at any point before December 31, 2025, 23:59:59 UTC. The price will be determined using the Pyth Network price feed.',
    category: 'Crypto',
    expiresAt: new Date('2025-12-31'),
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
    createdAt: new Date('2024-01-15'),
  };

  return (
    <div className="max-w-md p-4">
      <MarketDetails market={mockMarket} />
    </div>
  );
}
