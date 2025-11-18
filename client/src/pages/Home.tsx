import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MarketCard } from '@/components/MarketCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SearchAndSort } from '@/components/SearchAndSort';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, TrendingUp, Users, Activity } from 'lucide-react';
import type { Market } from '@shared/schema';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ['/api/markets'],
  });

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;
    
    // Create a copy of markets to avoid mutating React Query cache
    let filtered = [...markets].filter(market => {
      // Category filter with normalization
      const normalizedCat = market.category?.trim()?.toLowerCase() || 'other';
      const matchesCategory = selectedCategory === 'all' || normalizedCat === selectedCategory;
      
      // Search filter
      const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Time filter
      let matchesTime = true;
      if (selectedTimeFilter !== 'all') {
        const timeUntilExpiry = new Date(market.expiresAt).getTime() - now;
        if (timeUntilExpiry <= 0) {
          matchesTime = false;
        } else if (selectedTimeFilter === '24h') {
          matchesTime = timeUntilExpiry <= oneDay;
        } else if (selectedTimeFilter === '7d') {
          matchesTime = timeUntilExpiry <= sevenDays;
        } else if (selectedTimeFilter === '30d') {
          matchesTime = timeUntilExpiry <= thirtyDays;
        }
      }
      
      return matchesCategory && matchesSearch && matchesTime;
    });

    // Sorting
    if (sortBy === 'volume') {
      filtered.sort((a, b) => Number(b.volume) - Number(a.volume));
    } else if (sortBy === 'ending-soon') {
      filtered.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    }
    
    return filtered;
  }, [markets, selectedCategory, selectedTimeFilter, searchQuery, sortBy]);

  const stats = useMemo(() => {
    if (!markets) return { totalVolume: 0, activeMarkets: 0, traders: 0 };
    
    // Normalize volume to numbers before aggregation (with safety check for large values)
    const totalVolume = markets.reduce((sum, m) => {
      const vol = Number(m.volume);
      return sum + (isFinite(vol) ? vol : 0);
    }, 0);
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

      <div className="flex h-[calc(100vh-400px)] min-h-[600px]">
        {/* Filter Sidebar */}
        <FilterSidebar
          markets={markets}
          selectedTimeFilter={selectedTimeFilter}
          selectedCategory={selectedCategory}
          onTimeFilterChange={setSelectedTimeFilter}
          onCategoryChange={setSelectedCategory}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6 space-y-6">
            {/* Header with Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Active Markets</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} available
                </p>
              </div>
              <Link href="/create">
                <Button data-testid="button-create-market-top" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Market
                </Button>
              </Link>
            </div>

            {/* Search and Sort */}
            <SearchAndSort
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Markets Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMarkets.map((market) => (
                    <MarketCard key={market.id} market={market} />
                  ))}
                </div>

                {filteredMarkets.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg">No markets found</p>
                    <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search query</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
