import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MarketCard } from '@/components/MarketCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SearchAndSort } from '@/components/SearchAndSort';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu } from 'lucide-react';
import type { Market } from '@shared/schema';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  return (
    <div className="flex h-screen bg-background">
        {/* Desktop Filter Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <FilterSidebar
            markets={markets}
            selectedTimeFilter={selectedTimeFilter}
            onTimeFilterChange={setSelectedTimeFilter}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
            {/* Mobile Header with Filter Button */}
            <div className="lg:hidden flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Flipside</h1>
                <p className="text-xs text-muted-foreground">Prediction Markets</p>
              </div>
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="button-mobile-filters">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <FilterSidebar
                    markets={markets}
                    selectedTimeFilter={selectedTimeFilter}
                    onTimeFilterChange={(filter) => {
                      setSelectedTimeFilter(filter);
                      setMobileFiltersOpen(false);
                    }}
                    isMobile={true}
                  />
                </SheetContent>
              </Sheet>
            </div>
            {/* Desktop Header - Hidden on mobile */}
            <div className="hidden lg:block">
              <h2 className="text-3xl font-bold tracking-tight">Markets</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} available
              </p>
            </div>
            
            {/* Mobile Markets Count */}
            <div className="lg:hidden">
              <p className="text-sm text-muted-foreground">
                {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Horizontal Category Tabs */}
            <CategoryTabs
              markets={markets}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            {/* Search and Sort */}
            <SearchAndSort
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Markets Grid - Responsive columns */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
  );
}
