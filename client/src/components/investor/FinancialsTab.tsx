import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function FinancialsTab() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/investor/financials"],
  });

  // Mock financial data for charts (will be replaced with real data from reports)
  const monthlyRevenue = [
    { month: "Jan", revenue: 2400, expenses: 1800 },
    { month: "Feb", revenue: 2800, expenses: 1900 },
    { month: "Mar", revenue: 3200, expenses: 2000 },
    { month: "Apr", revenue: 3800, expenses: 2100 },
    { month: "May", revenue: 4200, expenses: 2200 },
    { month: "Jun", revenue: 5100, expenses: 2300 },
  ];

  const metrics = [
    {
      title: "Monthly Revenue",
      value: "$5,100",
      change: "+21%",
      icon: DollarSign,
      testId: "metric-monthly-revenue",
    },
    {
      title: "Monthly Expenses",
      value: "$2,300",
      change: "+4%",
      icon: TrendingUp,
      testId: "metric-monthly-expenses",
    },
    {
      title: "Net Profit",
      value: "$2,800",
      change: "+45%",
      icon: DollarSign,
      testId: "metric-net-profit",
    },
    {
      title: "Burn Rate",
      value: "18 months",
      change: "Runway",
      icon: TrendingUp,
      testId: "metric-burn-rate",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" data-testid="text-financials-title">
          Financial Reports
        </h2>
        <p className="text-muted-foreground" data-testid="text-financials-description">
          Revenue breakdown, expenses, and financial projections
        </p>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} data-testid={metric.testId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`${metric.testId}-value`}>
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card data-testid="card-revenue-expenses">
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>Monthly financial performance over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
              <Bar dataKey="expenses" fill="hsl(var(--muted-foreground))" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Financial Reports List */}
      <Card data-testid="card-reports-list">
        <CardHeader>
          <CardTitle>Published Reports</CardTitle>
          <CardDescription>Downloadable financial reports and statements</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report: any, index: number) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`report-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium" data-testid={`report-${index}-title`}>
                        {report.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {report.period} • Published {new Date(report.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" data-testid={`button-download-${index}`}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No financial reports available yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card data-testid="card-revenue-breakdown">
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Sources of platform revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">AMM Trading Fees (2%)</span>
              <span className="font-medium">$3,200/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Market Creation Fees</span>
              <span className="font-medium">$1,200/mo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Developer API Subscriptions</span>
              <span className="font-medium">$700/mo</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t font-bold">
              <span>Total Monthly Revenue</span>
              <span>$5,100/mo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
