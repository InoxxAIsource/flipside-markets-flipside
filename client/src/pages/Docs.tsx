import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const CONTRACT_ADDRESSES = {
  ConditionalTokens: '0x7D8610E9567d2a6C9FBf66a5A13E9Ba8bb120d43',
  MarketFactory: '0x0BCF2E4dE978557a88d5a25271881f5D31E7A30F',
  CTFExchange: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
  ProxyWalletFactory: '0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2',
  ProxyWalletImplementation: '0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7',
  MockUSDT: '0x5f207d42F869fd1c71d7f0f81a2A67Fc20FF7323',
};

function ContractAddress({ name, address }: { name: string; address: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 hover-elevate">
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

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Documentation</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Complete technical documentation for the Flipside prediction market platform
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
          
          {/* Overview */}
          <Card data-testid="section-overview">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Project Overview</CardTitle>
              </div>
              <CardDescription>Mission, features, and value proposition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What is Flipside?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Flipside is a decentralized prediction market platform built on Ethereum Sepolia testnet. 
                  Inspired by Polymarket, we enable users to create, trade, and resolve prediction markets on 
                  crypto prices, politics, sports, and real-world events using blockchain technology.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Key Features</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Gasless Trading:</strong> Trade without paying gas fees through our ProxyWallet meta-transaction system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Oracle Integration:</strong> Automated market resolution using Pyth Network price feeds for crypto markets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Liquidity Mining:</strong> Earn rewards points for trading and market creation with weekly rankings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">AI Analysis:</strong> Get instant AI-powered market analysis with probability predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Mobile-First Design:</strong> Fully responsive interface optimized for mobile, tablet, and desktop</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Smart Contracts */}
          <Card data-testid="section-contracts">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <CardTitle>Smart Contract Addresses</CardTitle>
              </div>
              <CardDescription>All deployed contracts on Ethereum Sepolia testnet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
              
              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> All contracts are deployed on Ethereum Sepolia testnet. 
                  View contract code and verification on Etherscan by clicking the external link icon.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CLOB System */}
          <Card data-testid="section-clob">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <CardTitle>Central Limit Order Book (CLOB)</CardTitle>
              </div>
              <CardDescription>Professional trading infrastructure with gasless execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How It Works</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Flipside uses a fully on-chain Central Limit Order Book (CLOB) for price discovery and trade execution. 
                  Unlike AMM-based systems, our order book matches buyers and sellers directly at agreed prices.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Order Types</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium mb-1">Limit Orders</div>
                    <p className="text-sm text-muted-foreground">
                      Set your desired price and wait for a match. Earns 2x rewards multiplier as a market maker.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium mb-1">Market Orders</div>
                    <p className="text-sm text-muted-foreground">
                      Execute immediately at the best available price. Takes liquidity from the order book.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Gasless Trading via ProxyWallet</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  All trading operations (limit orders and market orders) are completely gasless for users:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">1.</span>
                    <span>Sign an EIP-712 typed message (no gas required)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">2.</span>
                    <span>Our relayer submits the transaction and pays gas fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">3.</span>
                    <span>Your ProxyWallet executes the order on-chain trustlessly</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Note:</strong> Deposits, withdrawals, splits, and merges still require gas as they involve direct token transfers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decentralization */}
          <Card data-testid="section-decentralization">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-primary" />
                <CardTitle>Decentralization Benefits</CardTitle>
              </div>
              <CardDescription>Trustless, permissionless, and transparent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Trustless Operation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    All trades settle on-chain via smart contracts. No centralized custody of funds.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    Permissionless Access
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Anyone can create markets, place orders, or trade without approval.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                    Non-Custodial
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You maintain full control of your assets. ProxyWallets are controlled by you alone.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                    On-Chain Settlement
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    All trades are settled instantly on Ethereum with cryptographic guarantees.
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Oracle-Based Resolution</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Markets using Pyth Network oracles are resolved using verified on-chain price data, 
                  eliminating disputes and ensuring fair outcomes. Currently resolved manually by admins 
                  on testnet; automated resolution planned for mainnet.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Creator Benefits */}
          <Card data-testid="section-creator-benefits">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle>Creator & Trader Benefits</CardTitle>
              </div>
              <CardDescription>Liquidity mining rewards and incentives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Liquidity Mining Program</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Earn rewards points for every trade and market you create. Points are tracked off-chain 
                  and recalculated hourly based on your trading activity.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Rewards Structure</h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Base Trading Rewards</span>
                      <Badge variant="secondary">1 point per $1</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Earn 1 point for every $1 of trading volume, whether buying or selling shares.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Market Maker Multiplier</span>
                      <Badge variant="secondary">2x points</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Place limit orders and earn double points when they're filled. Rewards liquidity provision.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Market Creator Bonus</span>
                      <Badge variant="secondary">+10% on trades</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get a 10% bonus on all trades that happen in markets you created. Incentivizes quality market creation.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Weekly Rankings & Resets</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Compete on the global leaderboard to rank among top traders. Points reset every Sunday at 00:00 UTC, 
                  giving everyone a fresh start each week. Historical rankings are preserved.
                </p>
              </div>

              <Separator />

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold mb-2 text-foreground">Future: Fee Sharing</h4>
                <p className="text-sm text-muted-foreground">
                  On mainnet, trading fees will be collected via the FeeDistributor contract and shared with 
                  liquidity providers and market creators. This creates sustainable incentives for ecosystem growth.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Architecture */}
          <Card data-testid="section-architecture">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <CardTitle>Technical Architecture</CardTitle>
              </div>
              <CardDescription>System design and implementation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Stack Overview</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium mb-1">Frontend</div>
                    <p className="text-xs text-muted-foreground">React 18, TypeScript, Vite, TanStack Query, Ethers.js v6</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium mb-1">Backend</div>
                    <p className="text-xs text-muted-foreground">Node.js, Express, Drizzle ORM, PostgreSQL, WebSocket</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium mb-1">Blockchain</div>
                    <p className="text-xs text-muted-foreground">Ethereum Sepolia, Hardhat, OpenZeppelin, Pyth Network</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium mb-1">Services</div>
                    <p className="text-xs text-muted-foreground">Event Indexer, Order Matcher, Pyth Worker, Rewards Cron</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">ProxyWallet System</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Each user gets a dedicated ProxyWallet contract deployed via CREATE2 for deterministic addresses. 
                  The wallet executes EIP-712 signed meta-transactions, allowing gasless operations while maintaining 
                  full user control through signature verification.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Event Indexing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our event indexer continuously monitors blockchain events (market creation, order fills, position splits) 
                  and syncs them to PostgreSQL for fast querying. Enables real-time UI updates via WebSocket.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Pyth Oracle Integration</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time price feeds from Pyth Network for BTC, ETH, SOL, XRP, BNB, Gold, and Silver. 
                  Prices are updated every 30 seconds on cards and every 10 seconds on detail pages for accurate market data.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card data-testid="section-disclaimers" className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Important Disclaimers</CardTitle>
              </div>
              <CardDescription>Read carefully before using Flipside</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <Separator />

              <p className="text-sm text-muted-foreground text-center">
                By using Flipside, you acknowledge that you have read, understood, and agree to these disclaimers.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>Last updated: November 18, 2025</p>
            <p className="mt-2">For questions or support, please visit our community channels.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
