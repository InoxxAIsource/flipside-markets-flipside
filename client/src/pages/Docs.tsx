import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  BookOpen, 
  Boxes, 
  ArrowLeftRight, 
  Globe, 
  Trophy, 
  Code2, 
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Menu
} from 'lucide-react';

const CONTRACT_ADDRESSES = {
  ConditionalTokens: '0x7D8610E9567d2a6C9FBf66a5A13E9Ba8bb120d43',
  MarketFactory: '0x0BCF2E4dE978557a88d5a25271881f5D31E7A30F',
  CTFExchange: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
  ProxyWalletFactory: '0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2',
  ProxyWalletImplementation: '0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7',
  MockUSDT: '0x5f207d42F869fd1c71d7f0f81a2A67Fc20FF7323',
};

const sections = [
  { id: 'overview', label: 'Project Overview', icon: Globe },
  { id: 'uiux', label: 'UI/UX Features', icon: BookOpen },
  { id: 'contracts', label: 'Smart Contracts', icon: Code2 },
  { id: 'clob', label: 'CLOB System', icon: ArrowLeftRight },
  { id: 'ai', label: 'AI Analysis', icon: Trophy },
  { id: 'decentralization', label: 'Decentralization', icon: Boxes },
  { id: 'benefits', label: 'Creator Benefits', icon: Trophy },
  { id: 'architecture', label: 'Architecture', icon: Code2 },
  { id: 'disclaimers', label: 'Disclaimers', icon: AlertTriangle },
];

function ContractAddress({ name, address }: { name: string; address: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover-elevate">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm mb-1">{name}</div>
        <div className="font-mono text-xs text-muted-foreground truncate">{address}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          data-testid={`button-copy-${name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <a
          href={`https://sepolia.etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`link-etherscan-${name.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}

function Sidebar({ activeSection, onSectionClick, isMobile = false }: { 
  activeSection: string; 
  onSectionClick: (id: string) => void;
  isMobile?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="px-3 py-2 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Documentation
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Complete technical guide</p>
      </div>
      
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
              isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
            data-testid={`sidebar-${section.id}`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{section.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = contentRefs.current[section.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = contentRefs.current[id];
    if (element) {
      const offsetTop = element.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="flex w-full max-w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-card/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4">
            <Sidebar activeSection={activeSection} onSectionClick={scrollToSection} />
          </div>
        </aside>

        {/* Mobile Header with Menu */}
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between p-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Documentation
              </h2>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-mobile-docs-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <Sidebar activeSection={activeSection} onSectionClick={scrollToSection} isMobile={true} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:mt-0 mt-[72px] min-w-0 w-full">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12 overflow-x-hidden">
            
            {/* Project Overview */}
            <section 
              ref={(el) => contentRefs.current['overview'] = el}
              id="overview" 
              data-testid="section-overview"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold">Project Overview</h1>
              </div>
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">What is Flipside?</h3>
                  <p>
                    Flipside is a decentralized prediction market platform built on Ethereum Sepolia testnet. 
                    Inspired by Polymarket, we enable users to create, trade, and resolve prediction markets on 
                    crypto prices, politics, sports, and real-world events using blockchain technology.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Key Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Gasless Trading:</span> Trade without paying gas fees through our ProxyWallet meta-transaction system
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Oracle Integration:</span> Automated market resolution using Pyth Network price feeds for crypto markets
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Liquidity Mining:</span> Earn rewards points for trading and market creation with weekly rankings
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">AI Analysis:</span> Get instant AI-powered market analysis with probability predictions
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Mobile-First Design:</span> Fully responsive interface optimized for mobile, tablet, and desktop
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* UI/UX Features */}
            <section 
              ref={(el) => contentRefs.current['uiux'] = el}
              id="uiux" 
              data-testid="section-uiux"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold">UI/UX Features</h1>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Polymarket-inspired design with professional polish
              </p>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Market Cards</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Custom Images:</span> Upload custom market images with automatic WebP conversion and resizing
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Auto Crypto Logos:</span> Automatic detection and display of crypto logos (BTC, ETH, SOL, etc.) from market questions
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Oracle Price Display:</span> Real-time price vs. target comparison with trending indicators for oracle markets
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Direct Buy Buttons:</span> Quick "Buy Yes" and "Buy No" buttons on cards for instant trading
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Smooth Hover Effects:</span> Scale animations and gradient overlays for professional feel
                      </div>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Market Detail Page</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Countdown Timer:</span> Real-time countdown to market expiration with dynamic updates
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Enhanced Price Chart:</span> Beautiful purple gradient chart showing historical market prices
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">TradingView Widget:</span> Embedded live charts for resolution sources (crypto prices, etc.)
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Oracle Info Display:</span> Shows Pyth Network feed details and confidence levels
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Buy/Sell Toggle:</span> Seamless switch between buying and selling positions
                      </div>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Navigation & Filtering</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Horizontal Category Tabs:</span> Polymarket-style pill navigation with snap scrolling on mobile
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Time Range Filters:</span> Filter by 24h, 7d, 30d, or all markets
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Search & Sort:</span> Real-time search and sorting by volume, price, or expiry
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Responsive Grid:</span> 1-column (mobile) → 2-column (tablet) → 3-column (desktop) layout
                      </div>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Mobile Optimization</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Touch Targets:</span> All buttons and interactive elements ≥44px for easy tapping
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Gradient Scroll Hints:</span> Edge fades indicate scrollable content
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Sheet Drawers:</span> Mobile-friendly slide-in menus for filters and navigation
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">WalletConnect Support:</span> Native mobile wallet integration for trading on-the-go
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Smart Contracts */}
            <section 
              ref={(el) => contentRefs.current['contracts'] = el}
              id="contracts" 
              data-testid="section-contracts"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold">Smart Contract Addresses</h1>
              </div>
              
              <p className="text-muted-foreground mb-6">
                All deployed contracts on Ethereum Sepolia testnet
              </p>

              <div className="space-y-3">
                <ContractAddress 
                  name="Conditional Tokens" 
                  address={CONTRACT_ADDRESSES.ConditionalTokens}
                />
                <ContractAddress 
                  name="Market Factory" 
                  address={CONTRACT_ADDRESSES.MarketFactory}
                />
                <ContractAddress 
                  name="CTF Exchange (Order Book)" 
                  address={CONTRACT_ADDRESSES.CTFExchange}
                />
                <ContractAddress 
                  name="ProxyWallet Factory" 
                  address={CONTRACT_ADDRESSES.ProxyWalletFactory}
                />
                <ContractAddress 
                  name="ProxyWallet Implementation" 
                  address={CONTRACT_ADDRESSES.ProxyWalletImplementation}
                />
                <ContractAddress 
                  name="Mock USDT (Testnet)" 
                  address={CONTRACT_ADDRESSES.MockUSDT}
                />
                
                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Note:</strong> All contracts are deployed on Ethereum Sepolia testnet. 
                    View contract code and verification on Etherscan by clicking the external link icon.
                  </p>
                </div>
              </div>
            </section>

            {/* CLOB System */}
            <section 
              ref={(el) => contentRefs.current['clob'] = el}
              id="clob" 
              data-testid="section-clob"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold">Central Limit Order Book</h1>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Professional trading infrastructure with gasless execution
              </p>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">How It Works</h3>
                  <p>
                    Flipside uses a fully on-chain Central Limit Order Book (CLOB) for price discovery and trade execution. 
                    Unlike AMM-based systems, our order book matches buyers and sellers directly at agreed prices.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Order Types</h3>
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="font-medium text-foreground mb-2">Limit Orders</div>
                        <p className="text-sm">
                          Set your desired price and wait for a match. Earns 2x rewards multiplier as a market maker.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="font-medium text-foreground mb-2">Market Orders</div>
                        <p className="text-sm">
                          Execute immediately at the best available price. Takes liquidity from the order book.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Gasless Trading via ProxyWallet</h3>
                  <p className="mb-4">
                    All trading operations (limit orders and market orders) are completely gasless for users:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">1.</span>
                      <span>Sign an EIP-712 typed message (no gas required)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">2.</span>
                      <span>Our relayer submits the transaction and pays gas fees</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">3.</span>
                      <span>Your ProxyWallet executes the order on-chain trustlessly</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm">
                      <strong className="text-foreground">Note:</strong> Deposits, withdrawals, splits, and merges still require gas as they involve direct token transfers.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* AI Analysis */}
            <section 
              ref={(el) => contentRefs.current['ai'] = el}
              id="ai" 
              data-testid="section-ai"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold">AI-Powered Market Analysis</h1>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Get instant insights powered by OpenAI GPT-4o-mini
              </p>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Ask AI Button</h3>
                  <p>
                    Every market card and detail page features an "Ask AI" button that generates instant analysis 
                    using OpenAI's GPT-4o-mini model. Simply click the button to receive comprehensive market insights.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">What AI Analyzes</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Market Question:</span> Interprets the prediction question and context
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Current Prices:</span> Analyzes YES/NO probabilities and market sentiment
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Trading Volume:</span> Considers market liquidity and trader engagement
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Expiry Date:</span> Factors in time remaining until resolution
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <div>
                        <span className="font-medium text-foreground">Oracle Data:</span> For oracle markets, analyzes real-time price feeds and targets
                      </div>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">AI Analysis Output</h3>
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="font-medium text-foreground mb-2">Summary</div>
                        <p className="text-sm">
                          Clear explanation of what the market is predicting and key factors at play
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="font-medium text-foreground mb-2">Probability Assessment</div>
                        <p className="text-sm">
                          AI's estimated likelihood of YES vs NO outcomes with reasoning
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="font-medium text-foreground mb-2">Key Factors</div>
                        <p className="text-sm">
                          Important events, trends, or data points that could influence the outcome
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="font-medium text-foreground mb-2">Risk Assessment</div>
                        <p className="text-sm">
                          Identified risks and uncertainties that traders should consider
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Caching & Performance</h3>
                  <p>
                    AI analyses are cached in the database after first generation. This means instant loading 
                    for previously analyzed markets while keeping OpenAI API costs low.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <h4 className="font-semibold mb-2 text-destructive">⚠️ Important Disclaimer</h4>
                  <p className="text-sm text-muted-foreground">
                    AI analysis is for informational purposes only and should NOT be considered financial advice. 
                    The AI may make errors or miss important factors. Always do your own research before trading.
                  </p>
                </div>
              </div>
            </section>

            {/* Decentralization */}
            <section 
              ref={(el) => contentRefs.current['decentralization'] = el}
              id="decentralization" 
              data-testid="section-decentralization"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Boxes className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold">Decentralization Benefits</h1>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Trustless, permissionless, and transparent
              </p>

              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Trustless Operation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      All trades settle on-chain via smart contracts. No centralized custody of funds.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      Permissionless Access
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Anyone can create markets, place orders, or trade without approval.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                      Non-Custodial
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You maintain full control of your assets. ProxyWallets are controlled by you alone.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                      On-Chain Settlement
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      All trades are settled instantly on Ethereum with cryptographic guarantees.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-6" />

              <div className="text-muted-foreground leading-relaxed">
                <h3 className="text-lg font-semibold text-foreground mb-3">Oracle-Based Resolution</h3>
                <p>
                  Markets using Pyth Network oracles are resolved using verified on-chain price data, 
                  eliminating disputes and ensuring fair outcomes. Currently resolved manually by admins 
                  on testnet; automated resolution planned for mainnet.
                </p>
              </div>
            </section>

            {/* Creator Benefits */}
            <section 
              ref={(el) => contentRefs.current['benefits'] = el}
              id="benefits" 
              data-testid="section-benefits"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold">Creator & Trader Benefits</h1>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Liquidity mining rewards and incentives
              </p>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Liquidity Mining Program</h3>
                  <p>
                    Earn rewards points for every trade and market you create. Points are tracked off-chain 
                    and recalculated hourly based on your trading activity.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Rewards Structure</h3>
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <span className="font-medium text-foreground">Base Trading Rewards</span>
                          <Badge variant="secondary">1 point per $1</Badge>
                        </div>
                        <p className="text-sm">
                          Earn 1 point for every $1 of trading volume, whether buying or selling shares.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <span className="font-medium text-foreground">Market Maker Multiplier</span>
                          <Badge variant="secondary">2x points</Badge>
                        </div>
                        <p className="text-sm">
                          Place limit orders and earn double points when they're filled. Rewards liquidity provision.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <span className="font-medium text-foreground">Market Creator Bonus</span>
                          <Badge variant="secondary">+10% on trades</Badge>
                        </div>
                        <p className="text-sm">
                          Get a 10% bonus on all trades that happen in markets you created. Incentivizes quality market creation.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Weekly Rankings & Resets</h3>
                  <p>
                    Compete on the global leaderboard to rank among top traders. Points reset every Sunday at 00:00 UTC, 
                    giving everyone a fresh start each week. Historical rankings are preserved.
                  </p>
                </div>

                <Separator />

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold mb-2 text-foreground">Future: Fee Sharing</h4>
                  <p className="text-sm">
                    On mainnet, trading fees will be collected via the FeeDistributor contract and shared with 
                    liquidity providers and market creators. This creates sustainable incentives for ecosystem growth.
                  </p>
                </div>
              </div>
            </section>

            {/* Technical Architecture */}
            <section 
              ref={(el) => contentRefs.current['architecture'] = el}
              id="architecture" 
              data-testid="section-architecture"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold">Technical Architecture</h1>
              </div>
              
              <p className="text-muted-foreground mb-6">
                System design and implementation details
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Stack Overview</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card>
                      <CardContent className="p-3">
                        <div className="font-medium mb-1">Frontend</div>
                        <p className="text-xs text-muted-foreground">React 18, TypeScript, Vite, TanStack Query, Ethers.js v6</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="font-medium mb-1">Backend</div>
                        <p className="text-xs text-muted-foreground">Node.js, Express, Drizzle ORM, PostgreSQL, WebSocket</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="font-medium mb-1">Blockchain</div>
                        <p className="text-xs text-muted-foreground">Ethereum Sepolia, Hardhat, OpenZeppelin, Pyth Network</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <div className="font-medium mb-1">Services</div>
                        <p className="text-xs text-muted-foreground">Event Indexer, Order Matcher, Pyth Worker, Rewards Cron</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div className="text-muted-foreground leading-relaxed">
                  <h3 className="text-lg font-semibold text-foreground mb-3">ProxyWallet System</h3>
                  <p>
                    Each user gets a dedicated ProxyWallet contract deployed via CREATE2 for deterministic addresses. 
                    The wallet executes EIP-712 signed meta-transactions, allowing gasless operations while maintaining 
                    full user control through signature verification.
                  </p>
                </div>

                <Separator />

                <div className="text-muted-foreground leading-relaxed">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Event Indexing</h3>
                  <p>
                    Our event indexer continuously monitors blockchain events (market creation, order fills, position splits) 
                    and syncs them to PostgreSQL for fast querying. Enables real-time UI updates via WebSocket.
                  </p>
                </div>

                <Separator />

                <div className="text-muted-foreground leading-relaxed">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Pyth Oracle Integration</h3>
                  <p>
                    Real-time price feeds from Pyth Network for BTC, ETH, SOL, XRP, BNB, Gold, and Silver. 
                    Prices are updated every 30 seconds on cards and every 10 seconds on detail pages for accurate market data.
                  </p>
                </div>
              </div>
            </section>

            {/* Disclaimers */}
            <section 
              ref={(el) => contentRefs.current['disclaimers'] = el}
              id="disclaimers" 
              data-testid="section-disclaimers"
              className="scroll-mt-20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-bold text-destructive">Important Disclaimers</h1>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Read carefully before using Flipside
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <h4 className="font-semibold mb-2 text-destructive">⚠️ Testnet Only</h4>
                  <p className="text-sm text-muted-foreground">
                    Flipside currently operates on Ethereum Sepolia testnet. All tokens are for testing purposes only 
                    and have no real value. Do not deposit real funds. Use testnet ETH and Mock USDT only.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <h4 className="font-semibold mb-2 text-destructive">⚠️ Not Financial Advice</h4>
                  <p className="text-sm text-muted-foreground">
                    Nothing on this platform constitutes financial, investment, legal, or tax advice. 
                    Prediction markets involve risk. AI analysis is for informational purposes only and should not be relied upon for trading decisions.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <h4 className="font-semibold mb-2 text-destructive">⚠️ Smart Contract Risk</h4>
                  <p className="text-sm text-muted-foreground">
                    Smart contracts are experimental and may contain bugs. Contracts have not been formally audited. 
                    Use at your own risk. Never invest more than you can afford to lose.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <h4 className="font-semibold mb-2 text-destructive">⚠️ Regulatory Compliance</h4>
                  <p className="text-sm text-muted-foreground">
                    Prediction markets may be subject to regulations in your jurisdiction. It is your responsibility 
                    to ensure compliance with local laws. Flipside does not provide legal advice regarding regulatory matters.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <h4 className="font-semibold mb-2 text-destructive">⚠️ No Guarantees</h4>
                  <p className="text-sm text-muted-foreground">
                    The platform is provided "as is" without warranties of any kind. We do not guarantee uptime, 
                    accuracy of data, or successful transaction execution. Markets may resolve incorrectly or experience delays.
                  </p>
                </div>

                <Separator className="my-6" />

                <p className="text-sm text-muted-foreground text-center">
                  By using Flipside, you acknowledge that you have read, understood, and agree to these disclaimers.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center py-8 text-muted-foreground text-sm border-t">
              <p>Last updated: November 18, 2025</p>
              <p className="mt-2">For questions or support, please visit our community channels.</p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
