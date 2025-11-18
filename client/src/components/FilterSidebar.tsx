import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Timer,
  CalendarDays,
  CalendarRange,
  BarChart3
} from 'lucide-react';
import type { Market } from '@shared/schema';

interface FilterSidebarProps {
  markets: Market[] | undefined;
  selectedTimeFilter: string;
  onTimeFilterChange: (filter: string) => void;
}

const timeFilters = [
  { id: 'all', label: 'All', icon: BarChart3 },
  { id: '24h', label: '24 Hours', icon: Clock },
  { id: '7d', label: '7 Days', icon: CalendarDays },
  { id: '30d', label: '30 Days', icon: CalendarRange },
];


export function FilterSidebar({
  markets,
  selectedTimeFilter,
  onTimeFilterChange,
}: FilterSidebarProps) {
  // Guard against undefined markets
  const safeMarkets = markets || [];
  const now = Date.now();

  // Calculate time filter counts from full dataset (only future expirations)
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;
  const thirtyDays = 30 * oneDay;

  const timeFilterCounts: Record<string, number> = {
    all: safeMarkets.length,
    '24h': safeMarkets.filter(m => {
      const delta = new Date(m.expiresAt).getTime() - now;
      return delta > 0 && delta <= oneDay;
    }).length,
    '7d': safeMarkets.filter(m => {
      const delta = new Date(m.expiresAt).getTime() - now;
      return delta > 0 && delta <= sevenDays;
    }).length,
    '30d': safeMarkets.filter(m => {
      const delta = new Date(m.expiresAt).getTime() - now;
      return delta > 0 && delta <= thirtyDays;
    }).length,
  };

  return (
    <aside className="w-64 border-r bg-card/50 flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Flipside</h1>
        <p className="text-xs text-muted-foreground mt-1">Prediction Markets</p>
      </div>

      {/* Scrollable Filters */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Time Filters Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Time Range
              </h3>
            </div>
            <div className="space-y-1">
              {timeFilters.map((filter) => {
                const Icon = filter.icon;
                const count = timeFilterCounts[filter.id] || 0;
                const isSelected = selectedTimeFilter === filter.id;
                
                return (
                  <Button
                    key={filter.id}
                    variant={isSelected ? 'secondary' : 'ghost'}
                    className={`w-full justify-start gap-3 h-9 font-normal ${
                      isSelected ? 'bg-primary/10 text-primary hover:bg-primary/15' : ''
                    }`}
                    onClick={() => onTimeFilterChange(filter.id)}
                    data-testid={`button-time-filter-${filter.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{filter.label}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {count}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
