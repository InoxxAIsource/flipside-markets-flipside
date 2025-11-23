import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Web3Provider } from "@/contexts/Web3Provider";
import { HelmetProvider } from "react-helmet-async";
import { TopNav } from "@/components/TopNav";
import Home from "@/pages/Home";
import MarketPage from "@/pages/MarketPage";
import CreateMarket from "@/pages/CreateMarket";
import Portfolio from "@/pages/Portfolio";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Docs from "@/pages/Docs";
import Hedge from "@/pages/Hedge";
import NotFound from "@/pages/not-found";

// Force rebuild - v1.0.1

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/market/:id" component={MarketPage} />
      <Route path="/create" component={CreateMarket} />
      <Route path="/hedge" component={Hedge} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/profile" component={Profile} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/docs" component={Docs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <TooltipProvider>
            <div className="min-h-screen bg-background overflow-x-hidden">
              <TopNav />
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </Web3Provider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
