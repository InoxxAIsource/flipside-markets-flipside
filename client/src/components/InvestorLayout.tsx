import { Link } from "wouter";
import { TrendingUp } from "lucide-react";

interface InvestorLayoutProps {
  children: React.ReactNode;
}

export function InvestorLayout({ children }: InvestorLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md" data-testid="link-home">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Flipside</span>
            <span className="text-sm text-muted-foreground ml-2">Investor Portal</span>
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
