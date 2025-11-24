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
import Archived from "@/pages/Archived";
import ApiDocs from "@/pages/ApiDocs";
import ApiKeys from "@/pages/ApiKeys";
import AdminSeed from "@/pages/AdminSeed";
import AdminInvestors from "@/pages/AdminInvestors";
import InvestorApply from "@/pages/InvestorApply";
import InvestorLogin from "@/pages/InvestorLogin";
import InvestorForgotPassword from "@/pages/InvestorForgotPassword";
import InvestorResetPassword from "@/pages/InvestorResetPassword";
import InvestorDashboard from "@/pages/InvestorDashboard";
import NotFound from "@/pages/not-found";

// Force rebuild - v1.0.2

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/market/:id" component={MarketPage} />
      <Route path="/create" component={CreateMarket} />
      <Route path="/hedge" component={Hedge} />
      <Route path="/archived" component={Archived} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/profile" component={Profile} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/docs" component={Docs} />
      <Route path="/api-docs" component={ApiDocs} />
      <Route path="/api-keys" component={ApiKeys} />
      <Route path="/admin/seed" component={AdminSeed} />
      <Route path="/admin/investors" component={AdminInvestors} />
      <Route path="/investor/apply" component={InvestorApply} />
      <Route path="/investor/login" component={InvestorLogin} />
      <Route path="/investor/forgot-password" component={InvestorForgotPassword} />
      <Route path="/investor/reset-password" component={InvestorResetPassword} />
      <Route path="/investor/dashboard" component={InvestorDashboard} />
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
