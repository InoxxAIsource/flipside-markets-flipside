import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { MarketCard } from '@/components/MarketCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Plus, TrendingUp, Users, Activity } from 'lucide-react';
import type { Market } from '@shared/schema';

// TODO: Remove mock data
const mockMarkets: Market[] = [
  {
    id: '1',
    question: 'Will Bitcoin reach $100,000 by the end of 2025?',
    description: 'Market resolves YES if BTC hits $100k',
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
  },
  {
    id: '2',
    question: 'Will Ethereum price exceed $5,000 in 2025?',
    description: 'Market resolves YES if ETH exceeds $5,000',
    category: 'Crypto',
    expiresAt: new Date('2025-12-31'),
    resolvedAt: null,
    outcome: null,
    yesPrice: 0.45,
    noPrice: 0.55,
    volume: 85000,
    liquidity: 35000,
    creatorAddress: '0x1234567890123456789012345678901234567890',
    contractAddress: null,
    pythPriceFeed: 'ETH/USD',
    baselinePrice: 3500,
    resolved: false,
    createdAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    question: 'Will the US economy enter recession in 2025?',
    description: 'Resolves YES if NBER declares recession',
    category: 'Finance',
    expiresAt: new Date('2025-06-30'),
    resolvedAt: null,
    outcome: null,
    yesPrice: 0.32,
    noPrice: 0.68,
    volume: 210000,
    liquidity: 95000,
    creatorAddress: '0x1234567890123456789012345678901234567890',
    contractAddress: null,
    pythPriceFeed: null,
    baselinePrice: null,
    resolved: false,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '4',
    question: 'Will Solana reach $200 before March 2025?',
    description: 'Market resolves YES if SOL hits $200',
    category: 'Crypto',
    expiresAt: new Date('2025-03-01'),
    resolvedAt: null,
    outcome: null,
    yesPrice: 0.55,
    noPrice: 0.45,
    volume: 62000,
    liquidity: 28000,
    creatorAddress: '0x1234567890123456789012345678901234567890',
    contractAddress: null,
    pythPriceFeed: 'SOL/USD',
    baselinePrice: 150,
    resolved: false,
    createdAt: new Date('2024-01-18'),
  },
  {
    id: '5',
    question: 'Will AI surpass human performance in coding by 2026?',
    description: 'Resolves YES based on benchmarks',
    category: 'Technology',
    expiresAt: new Date('2026-01-01'),
    resolvedAt: null,
    outcome: null,
    yesPrice: 0.72,
    noPrice: 0.28,
    volume: 145000,
    liquidity: 68000,
    creatorAddress: '0x1234567890123456789012345678901234567890',
    contractAddress: null,
    pythPriceFeed: null,
    baselinePrice: null,
    resolved: false,
    createdAt: new Date('2024-01-12'),
  },
  {
    id: '6',
    question: 'Will Tesla stock price exceed $500 in 2025?',
    description: 'Market resolves YES if TSLA > $500',
    category: 'Finance',
    expiresAt: new Date('2025-12-31'),
    resolvedAt: null,
    outcome: null,
    yesPrice: 0.38,
    noPrice: 0.62,
    volume: 98000,
    liquidity: 42000,
    creatorAddress: '0x1234567890123456789012345678901234567890',
    contractAddress: null,
    pythPriceFeed: null,
    baselinePrice: 250,
    resolved: false,
    createdAt: new Date('2024-01-14'),
  },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMarkets = mockMarkets.filter(market => {
    const matchesCategory = selectedCategory === 'all' || market.category.toLowerCase() === selectedCategory;
    const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/5 via-primary/0 to-transparent">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Trade the Future
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create and trade prediction markets on real-world events. Powered by smart contracts on Sepolia testnet.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/create">
                <Button size="lg" data-testid="button-create-market-hero">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Market
                </Button>
              </Link>
              <Button size="lg" variant="outline" data-testid="button-browse-markets">
                Browse Markets
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">$2.5M</h3>
              <p className="text-sm text-muted-foreground">Total Volume</p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">48</h3>
              <p className="text-sm text-muted-foreground">Active Markets</p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">1,247</h3>
              <p className="text-sm text-muted-foreground">Traders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Active Markets</h2>
            <p className="text-sm text-muted-foreground">
              {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <Link href="/create">
            <Button data-testid="button-create-market-top">
              <Plus className="mr-2 h-4 w-4" />
              Create Market
            </Button>
          </Link>
        </div>

        <CategoryFilter 
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>

        {filteredMarkets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No markets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
