import { Search, SlidersHorizontal, TrendingUp, Clock, DollarSign, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SearchAndSortProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const sortOptions = [
  { id: 'volume', label: 'Most Volume', icon: TrendingUp },
  { id: 'ending-soon', label: 'Ending Soon', icon: Clock },
];

export function SearchAndSort({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: SearchAndSortProps) {
  const currentSort = sortOptions.find(opt => opt.id === sortBy) || sortOptions[0];
  const SortIcon = currentSort.icon;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search markets..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10"
          data-testid="input-search-markets"
        />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 h-10 min-w-[160px]"
            data-testid="button-sort-dropdown"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="flex-1 text-left">{currentSort.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.id}
                onClick={() => onSortChange(option.id)}
                className="gap-2 cursor-pointer"
                data-testid={`option-sort-${option.id}`}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
