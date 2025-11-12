import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface PriceChartProps {
  data?: Array<{ time: string; yes: number; no: number }>;
  height?: number;
}

export function PriceChart({ data, height = 200 }: PriceChartProps) {
  // TODO: Remove mock data when real data is available
  const mockData = data || [
    { time: '12:00', yes: 45, no: 55 },
    { time: '13:00', yes: 48, no: 52 },
    { time: '14:00', yes: 52, no: 48 },
    { time: '15:00', yes: 58, no: 42 },
    { time: '16:00', yes: 62, no: 38 },
    { time: '17:00', yes: 65, no: 35 },
    { time: '18:00', yes: 68, no: 32 },
  ];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}¢`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: any) => [`${value}¢`, 'YES']}
          />
          <Area
            type="monotone"
            dataKey="yes"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#yesGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
