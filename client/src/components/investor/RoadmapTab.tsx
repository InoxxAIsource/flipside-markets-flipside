import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Clock, Calendar } from "lucide-react";

export function RoadmapTab() {
  const { data: roadmapItems, isLoading } = useQuery({
    queryKey: ["/api/investor/roadmap"],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "default",
      in_progress: "secondary",
      planned: "outline",
    };

    const labels: Record<string, string> = {
      completed: "Completed",
      in_progress: "In Progress",
      planned: "Planned",
    };

    return (
      <Badge variant={variants[status] as any} data-testid={`badge-status-${status}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    if (visibility === "investors_only") {
      return (
        <Badge variant="outline" className="border-primary text-primary" data-testid="badge-investor-only">
          Investor Only
        </Badge>
      );
    }
    return null;
  };

  const groupedItems = roadmapItems?.reduce((acc: any, item: any) => {
    const quarter = item.quarter || "Backlog";
    if (!acc[quarter]) {
      acc[quarter] = [];
    }
    acc[quarter].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" data-testid="text-roadmap-title">
          Product Roadmap
        </h2>
        <p className="text-muted-foreground" data-testid="text-roadmap-description">
          Feature development timeline and quarterly milestones
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : roadmapItems && roadmapItems.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedItems || {}).map(([quarter, items]: [string, any]) => (
            <Card key={quarter} data-testid={`card-quarter-${quarter.toLowerCase().replace(/\s/g, '-')}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>{quarter}</CardTitle>
                </div>
                <CardDescription>
                  {items.filter((item: any) => item.status === "completed").length} of {items.length} completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item: any, index: number) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                      data-testid={`roadmap-item-${index}`}
                    >
                      <div className="mt-1">{getStatusIcon(item.status)}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium" data-testid={`roadmap-item-${index}-title`}>
                              {item.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1" data-testid={`roadmap-item-${index}-description`}>
                              {item.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(item.status)}
                            {getVisibilityBadge(item.visibility)}
                          </div>
                        </div>
                        {item.targetDate && (
                          <p className="text-xs text-muted-foreground">
                            Target: {new Date(item.targetDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card data-testid="card-no-roadmap">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No roadmap items available yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
