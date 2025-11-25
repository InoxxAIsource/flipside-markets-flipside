import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Map, Users, LogOut, Sparkles
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DocumentationTab } from "@/components/investor/DocumentationTab";
import { RoadmapTab } from "@/components/investor/RoadmapTab";
import { TeamTab } from "@/components/investor/TeamTab";

export default function InvestorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [investor, setInvestor] = useState<any>(null);

  const { data: verifyData, isLoading } = useQuery({
    queryKey: ['/api/investor/verify'],
    retry: false,
  });

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading Investor Portal...</p>
        </div>
      </div>
    );
  }

  if (!investor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Flipside Investor Portal
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {investor.name}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="docs" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-3 h-14 p-1.5 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger 
                value="docs" 
                data-testid="tab-docs"
                className="gap-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documentation</span>
                <span className="sm:hidden">Docs</span>
              </TabsTrigger>
              <TabsTrigger 
                value="roadmap" 
                data-testid="tab-roadmap"
                className="gap-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <Map className="h-4 w-4" />
                Roadmap
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                data-testid="tab-team"
                className="gap-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <Users className="h-4 w-4" />
                Team
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="docs" className="mt-8">
            <DocumentationTab />
          </TabsContent>

          <TabsContent value="roadmap" className="mt-8">
            <RoadmapTab />
          </TabsContent>

          <TabsContent value="team" className="mt-8">
            <TeamTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
