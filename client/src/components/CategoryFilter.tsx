import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const categories = [
  { id: 'all', label: 'All Markets', count: 48 },
  { id: 'crypto', label: 'Crypto', count: 12 },
  { id: 'sports', label: 'Sports', count: 8 },
  { id: 'politics', label: 'Politics', count: 15 },
  { id: 'finance', label: 'Finance', count: 7 },
  { id: 'technology', label: 'Technology', count: 6 },
];

interface CategoryFilterProps {
  selected?: string;
  onSelect?: (category: string) => void;
}

export function CategoryFilter({ selected = 'all', onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
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
