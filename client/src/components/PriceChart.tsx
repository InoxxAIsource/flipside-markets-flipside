import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PriceChartProps {
  data?: Array<{ time: string; price: number }>;
  height?: number;
  showBaseline?: boolean;
  baselinePrice?: number;
}

export function PriceChart({ data, height = 200, showBaseline = false, baselinePrice }: PriceChartProps) {
  const mockData = data || [
    { time: '7:30', price: 0.45 },
    { time: '7:50', price: 0.48 },
    { time: '8:20', price: 0.52 },
    { time: '9:00', price: 0.58 },
    { time: '10:15', price: 0.62 },
    { time: '11:30', price: 0.65 },
    { time: '12:45', price: 0.68 },
  ];

  const displayData = mockData.map(d => ({
    ...d,
    displayPrice: d.price * 100
  }));

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
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `$${(value / 100).toFixed(2)}`}
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
            formatter={(value: any) => [`$${(value / 100).toFixed(2)}`, 'Price']}
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          {showBaseline && baselinePrice && (
            <ReferenceLine 
              y={baselinePrice * 100} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3" 
              strokeWidth={1}
              label={{ 
                value: `Baseline: $${baselinePrice.toFixed(2)}`, 
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 11
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
