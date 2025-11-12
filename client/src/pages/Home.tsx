import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MarketCard } from '@/components/MarketCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, TrendingUp, Users, Activity } from 'lucide-react';
import type { Market } from '@shared/schema';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: selectedCategory === 'all' ? ['/api/markets'] : ['/api/markets', { category: selectedCategory }],
  });

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    
    return markets.filter(market => {
      const matchesCategory = selectedCategory === 'all' || market.category.toLowerCase() === selectedCategory;
      const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [markets, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    if (!markets) return { totalVolume: 0, activeMarkets: 0, traders: 0 };
    
    const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
    const activeMarkets = markets.filter(m => !m.resolved).length;
    const uniqueTraders = new Set(markets.map(m => m.creatorAddress)).size;
    
    return { totalVolume, activeMarkets, traders: uniqueTraders };
  }, [markets]);

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
              {isLoading ? (
                <Skeleton className="h-7 w-24 mx-auto" />
              ) : (
                <h3 className="font-semibold">${(stats.totalVolume / 1000000).toFixed(1)}M</h3>
              )}
              <p className="text-sm text-muted-foreground">Total Volume</p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-16 mx-auto" />
              ) : (
                <h3 className="font-semibold">{stats.activeMarkets}</h3>
              )}
              <p className="text-sm text-muted-foreground">Active Markets</p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20 mx-auto" />
              ) : (
                <h3 className="font-semibold">{stats.traders}</h3>
              )}
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
