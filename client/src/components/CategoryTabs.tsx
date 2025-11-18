import { Button } from '@/components/ui/button';
import { Bitcoin, Vote, MapPin, Trophy, Zap, Globe, Sparkles } from 'lucide-react';
import type { Market } from '@shared/schema';

interface CategoryTabsProps {
  markets: Market[] | undefined;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin },
  { id: 'politics', label: 'Politics', icon: Vote },
  { id: 'local', label: 'Local', icon: MapPin },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'technology', label: 'Technology', icon: Zap },
  { id: 'general', label: 'General', icon: Globe },
  { id: 'other', label: 'Other', icon: Sparkles },
];

export function CategoryTabs({
  markets,
  selectedCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  const safeMarkets = markets || [];

  // Calculate category counts
  const categoryCounts: Record<string, number> = {
    all: safeMarkets.length,
  };

  safeMarkets.forEach((market) => {
    const rawCat = market.category?.trim() || '';
    const cat = rawCat ? rawCat.toLowerCase() : 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  return (
    <div className="relative">
      {/* Gradient fade on edges for mobile scrolling hint */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 lg:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 lg:hidden" />
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth">
        {categories.map((category) => {
          const Icon = category.icon;
          const count = categoryCounts[category.id] || 0;
          const isSelected = selectedCategory === category.id;
          
          // Only show categories that have markets (except "All")
          if (category.id !== 'all' && count === 0) return null;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? 'default' : 'outline'}
              className={`flex-shrink-0 gap-2 rounded-full transition-all snap-start min-h-[44px] px-4 sm:px-3 ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-accent'
              }`}
              onClick={() => onCategoryChange(category.id)}
              data-testid={`button-category-${category.id}`}
            >
              <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="font-medium text-sm sm:text-xs">{category.label}</span>
              {count > 0 && (
                <span className={`text-xs font-mono ${
                  isSelected ? 'opacity-90' : 'text-muted-foreground'
                }`}>
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
