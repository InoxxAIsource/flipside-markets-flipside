import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Map, TrendingUp, Users, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OverviewTab } from "@/components/investor/OverviewTab";
import { DocumentationTab } from "@/components/investor/DocumentationTab";
import { RoadmapTab } from "@/components/investor/RoadmapTab";
import { FinancialsTab } from "@/components/investor/FinancialsTab";
import { TeamTab } from "@/components/investor/TeamTab";

export default function InvestorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [investor, setInvestor] = useState<any>(null);

  // Verify authentication
  const { data: verifyData, isLoading } = useQuery({
    queryKey: ['/api/investor/verify'],
    retry: false,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/investor/logout", {});
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      setLocation("/investor/login");
    },
  });

  useEffect(() => {
    const data = verifyData as any;
    if (data && data.investor) {
      setInvestor(data.investor);
    } else if (!isLoading && !verifyData) {
      setLocation("/investor/login");
    }
  }, [verifyData, isLoading, setLocation]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!investor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Flipside Investor Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {investor.name}</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <TrendingUp className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="docs" data-testid="tab-docs">
              <FileText className="mr-2 h-4 w-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="roadmap" data-testid="tab-roadmap">
              <Map className="mr-2 h-4 w-4" />
              Roadmap
            </TabsTrigger>
            <TabsTrigger value="financials" data-testid="tab-financials">
              <TrendingUp className="mr-2 h-4 w-4" />
              Financials
            </TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">
              <Users className="mr-2 h-4 w-4" />
              Team & Vision
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="docs">
            <DocumentationTab />
          </TabsContent>

          <TabsContent value="roadmap">
            <RoadmapTab />
          </TabsContent>

          <TabsContent value="financials">
            <FinancialsTab />
          </TabsContent>

          <TabsContent value="team">
            <TeamTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
