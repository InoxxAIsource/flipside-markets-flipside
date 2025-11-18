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
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
            size="sm"
            className={`flex-shrink-0 gap-2 rounded-full transition-all ${
              isSelected 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background hover:bg-accent'
            }`}
            onClick={() => onCategoryChange(category.id)}
            data-testid={`button-category-${category.id}`}
          >
            <Icon className="h-4 w-4" />
            <span>{category.label}</span>
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
  );
}
