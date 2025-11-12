import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
}

function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-mono font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-primary">{trend}</p>
          )}
        </div>
        <div className="p-2 bg-primary/10 rounded-md">
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface MarketStatsProps {
  volume: number;
  liquidity: number;
  traders?: number;
  activity?: number;
}

export function MarketStats({ volume, liquidity, traders = 0, activity = 0 }: MarketStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
        label="24h Volume"
        value={`$${volume.toLocaleString()}`}
        trend="+12.5%"
      />
      <StatCard
        icon={<DollarSign className="h-5 w-5 text-primary" />}
        label="Liquidity"
        value={`$${liquidity.toLocaleString()}`}
      />
      <StatCard
        icon={<Users className="h-5 w-5 text-primary" />}
        label="Traders"
        value={traders.toLocaleString()}
      />
      <StatCard
        icon={<Activity className="h-5 w-5 text-primary" />}
        label="24h Trades"
        value={activity.toLocaleString()}
      />
    </div>
  );
}
