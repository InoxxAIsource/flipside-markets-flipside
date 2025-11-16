import { Search, User, PlusCircle, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { WalletButton } from './WalletButton';
import { Link } from 'wouter';

interface TopNavProps {
  onSearch?: (query: string) => void;
}

export function TopNav({ onSearch }: TopNavProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline">PredictMarket</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search markets..."
              className="pl-10 w-full"
              data-testid="input-search-markets"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/create">
            <Button variant="ghost" size="icon" data-testid="button-create-market">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/portfolio">
            <Button variant="ghost" size="icon" data-testid="button-portfolio">
              <Wallet className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="icon" data-testid="button-profile">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
