import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { MarketCard } from '@/components/MarketCard';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SearchAndSort } from '@/components/SearchAndSort';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive as ArchiveIcon, TrendingUp, Clock } from 'lucide-react';
import type { Market } from '@shared/schema';

const archivedSortOptions = [
  { id: 'volume', label: 'Most Volume', icon: TrendingUp },
  { id: 'recently-expired', label: 'Recently Expired', icon: Clock },
];

export default function Archived() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recently-expired');

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ['/api/markets'],
  });

  const filteredMarkets = useMemo(() => {
    if (!markets) return [];
    
    const now = Date.now();
    
    // Only show expired markets
    let filtered = [...markets].filter(market => {
      const isExpired = new Date(market.expiresAt).getTime() <= now;
      if (!isExpired) return false;
      
      // Category filter with normalization
      const normalizedCat = market.category?.trim()?.toLowerCase() || 'other';
      const matchesCategory = selectedCategory === 'all' || normalizedCat === selectedCategory;
      
      // Search filter
      const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });

    // Sorting
    if (sortBy === 'volume') {
      filtered.sort((a, b) => Number(b.volume) - Number(a.volume));
    } else if (sortBy === 'recently-expired') {
      // Most recently expired markets first
      filtered.sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
    }
    
    return filtered;
  }, [markets, selectedCategory, searchQuery, sortBy]);

  return (
    <>
      <Helmet>
        <title>Archived Markets - Flipside</title>
        <meta name="description" content="Browse expired and archived prediction markets on Flipside." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Main Content */}
        <div className="w-full overflow-auto bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArchiveIcon className="h-6 w-6" />
                Archived Markets
              </h1>
              <p className="text-sm text-muted-foreground">Browse expired prediction markets</p>
            </div>

            {/* Category Tabs */}
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
              customSortOptions={archivedSortOptions}
            />

            {/* Markets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64" data-testid={`skeleton-market-card-${i}`} />
                ))
              ) : filteredMarkets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <ArchiveIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg" data-testid="text-no-archived-markets">
                    No archived markets found
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Markets will appear here after they expire
                  </p>
                </div>
              ) : (
                filteredMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
