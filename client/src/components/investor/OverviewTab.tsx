import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, DollarSign, BarChart3, Trophy, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export function OverviewTab() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/investor/overview/metrics"],
  });

  const { data: growthData, isLoading: growthLoading } = useQuery({
    queryKey: ["/api/investor/overview/growth"],
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/investor/overview/revenue"],
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery({
    queryKey: ["/api/investor/overview/milestones"],
  });

  const metricsCards = [
    {
      title: "Total Users",
      value: metrics?.totalUsers || 0,
      icon: Users,
      description: "+12% from last month",
      testId: "metric-total-users",
    },
    {
      title: "Total Volume",
      value: `$${((metrics?.totalVolume || 0) / 1000).toFixed(1)}K`,
      icon: DollarSign,
      description: "All-time trading volume",
      testId: "metric-total-volume",
    },
    {
      title: "Active Markets",
      value: metrics?.activeMarkets || 0,
      icon: BarChart3,
      description: "Live prediction markets",
      testId: "metric-active-markets",
    },
    {
      title: "Total Markets",
      value: metrics?.totalMarkets || 0,
      icon: Trophy,
      description: "Markets created",
      testId: "metric-total-markets",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" data-testid="text-overview-title">
          Platform Overview
        </h2>
        <p className="text-muted-foreground" data-testid="text-overview-description">
          Key metrics and growth trends for Flipside prediction markets
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsCards.map((metric) => (
          <Card key={metric.title} data-testid={metric.testId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid={`${metric.testId}-value`}>
                    {metric.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card data-testid="card-user-growth">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Total registered users over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {growthLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={growthData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card data-testid="card-revenue">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Trading fees and platform revenue</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {revenueLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenueData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Milestones */}
      <Card data-testid="card-milestones">
        <CardHeader>
          <CardTitle>Recent Milestones</CardTitle>
          <CardDescription>Key achievements and platform updates</CardDescription>
        </CardHeader>
        <CardContent>
          {milestonesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {milestones && milestones.length > 0 ? (
                milestones.map((milestone: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    data-testid={`milestone-${index}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none" data-testid={`milestone-${index}-title`}>
                        {milestone.title}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`milestone-${index}-description`}>
                        {milestone.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(milestone.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No milestones available yet
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
