import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import type { Market } from '@shared/schema';

const categoryDefinitions = [
  { id: 'all', label: 'All Markets' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'sports', label: 'Sports' },
  { id: 'politics', label: 'Politics' },
  { id: 'finance', label: 'Finance' },
  { id: 'technology', label: 'Technology' },
];

interface CategoryFilterProps {
  selected?: string;
  onSelect?: (category: string) => void;
  markets?: Market[];
}

export function CategoryFilter({ selected = 'all', onSelect, markets = [] }: CategoryFilterProps) {
  const categoriesWithCounts = useMemo(() => {
    return categoryDefinitions.map(category => {
      const count = category.id === 'all' 
        ? markets.length 
        : markets.filter(m => m.category.toLowerCase() === category.id).length;
      
      return { ...category, count };
    });
  }, [markets]);

  return (
    <div className="flex flex-wrap gap-2">
      {categoriesWithCounts.map((category) => (
        <Button
          key={category.id}
          variant={selected === category.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect?.(category.id)}
          data-testid={`button-category-${category.id}`}
          className="gap-2"
        >
          {category.label}
          <Badge 
            variant="secondary" 
            className="ml-1 font-mono text-xs"
          >
            {category.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}
