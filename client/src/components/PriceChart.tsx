import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatPrice, formatSharePrice } from '@/lib/priceParser';

interface PriceChartProps {
  data?: Array<{ time: string; price: number }>;
  height?: number;
  showBaseline?: boolean;
  baselinePrice?: number;
  mode?: 'probability' | 'asset-price'; // New: determines chart type
  targetPrice?: number; // New: for oracle markets
}

export function PriceChart({ 
  data, 
  height = 200, 
  showBaseline = false, 
  baselinePrice,
  mode = 'probability',
  targetPrice 
}: PriceChartProps) {
  // Default mock data for probability mode (YES/NO %)
  const mockProbabilityData = [
    { time: '7:30', price: 0.45 },
    { time: '7:50', price: 0.48 },
    { time: '8:20', price: 0.52 },
    { time: '9:00', price: 0.58 },
    { time: '10:15', price: 0.62 },
    { time: '11:30', price: 0.65 },
    { time: '12:45', price: 0.68 },
  ];

  // Mock data for asset price mode (e.g., BTC price)
  const mockAssetPriceData = targetPrice ? [
    { time: '7:30', price: targetPrice * 0.97 },
    { time: '7:50', price: targetPrice * 0.98 },
    { time: '8:20', price: targetPrice * 0.985 },
    { time: '9:00', price: targetPrice * 0.99 },
    { time: '10:15', price: targetPrice * 0.995 },
    { time: '11:30', price: targetPrice * 1.00 },
    { time: '12:45', price: targetPrice * 1.02 },
  ] : [];

  const defaultData = mode === 'asset-price' ? mockAssetPriceData : mockProbabilityData;
  const mockData = data || defaultData;

  // For probability mode, multiply by 100 to show percentages
  // For asset-price mode, use raw prices
  const displayData = mode === 'probability' 
    ? mockData.map(d => ({ ...d, displayPrice: d.price * 100 }))
    : mockData.map(d => ({ ...d, displayPrice: d.price }));

  return (
    <div className="w-full" style={{ height }} data-testid="price-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="polyPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={mode === 'probability' ? [0, 100] : ['auto', 'auto']}
            ticks={mode === 'probability' ? [0, 25, 50, 75, 100] : undefined}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => 
              mode === 'probability' 
                ? formatSharePrice(value / 100)
                : `$${formatPrice(value)}`
            }
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: any) => [
              mode === 'probability' 
                ? formatSharePrice(value / 100)
                : `$${formatPrice(value)}`,
              mode === 'probability' ? 'YES Price' : 'Asset Price'
            ]}
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          {/* Show baseline reference for probability mode */}
          {mode === 'probability' && showBaseline && baselinePrice && (
            <ReferenceLine 
              y={baselinePrice * 100} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3" 
              strokeWidth={1}
              label={{ 
                value: `Baseline: ${formatSharePrice(baselinePrice)}`, 
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11
              }}
            />
          )}
          {/* Show target price reference for asset-price mode */}
          {mode === 'asset-price' && targetPrice && (
            <ReferenceLine 
              y={targetPrice} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              label={{ 
                value: `Target: $${formatPrice(targetPrice)}`, 
                position: 'right',
                fill: 'hsl(var(--primary))',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="displayPrice"
            stroke="url(#polyPurple)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#8b5cf6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
