import { Search, User, PlusCircle, Wallet, Home, Trophy, BookOpen, Menu, Shield, Archive, Code, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { WalletButton } from './WalletButton';
import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopNavProps {
  onSearch?: (query: string) => void;
}

export function TopNav({ onSearch }: TopNavProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-2 sm:gap-4 px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">F</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline">Flipside</span>
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

        {/* Desktop Navigation - Hidden on small screens */}
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-markets">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/create">
            <Button variant="ghost" size="icon" data-testid="button-create-market">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/hedge">
            <Button variant="ghost" size="icon" data-testid="button-hedge">
              <Shield className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/archived">
            <Button variant="ghost" size="icon" data-testid="button-archived">
              <Archive className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="ghost" size="icon" data-testid="button-leaderboard">
              <Trophy className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost" size="icon" data-testid="button-docs">
              <BookOpen className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/api-docs">
            <Button variant="ghost" size="icon" data-testid="button-api-docs">
              <Code className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/api-keys">
            <Button variant="ghost" size="icon" data-testid="button-api-keys">
              <Key className="h-5 w-5" />
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

        {/* Mobile Navigation - Visible on small screens */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <WalletButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-markets">
                    <Home className="h-4 w-4" />
                    <span>Markets</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/create">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-create">
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Market</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/hedge">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-hedge">
                    <Shield className="h-4 w-4" />
                    <span>Hedge</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/archived">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-archived">
                    <Archive className="h-4 w-4" />
                    <span>Archived</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/leaderboard">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-leaderboard">
                    <Trophy className="h-4 w-4" />
                    <span>Leaderboard</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/docs">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-docs">
                    <BookOpen className="h-4 w-4" />
                    <span>Documentation</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/api-docs">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-api-docs">
                    <Code className="h-4 w-4" />
                    <span>API Docs</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/api-keys">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-api-keys">
                    <Key className="h-4 w-4" />
                    <span>API Keys</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/portfolio">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-portfolio">
                    <Wallet className="h-4 w-4" />
                    <span>Portfolio</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <div className="flex items-center gap-2 w-full" data-testid="menu-item-profile">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
