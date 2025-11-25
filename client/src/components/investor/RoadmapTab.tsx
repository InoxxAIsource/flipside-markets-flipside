import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Target, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Zap,
  Globe,
  Users,
  Rocket,
  Calendar,
  Building,
  Cpu,
  BarChart3,
  Award,
  Clock,
  Server,
  Database,
  Smartphone,
  Network,
  Layers,
  Bot
} from "lucide-react";

export function RoadmapTab() {
  return (
    <div className="space-y-8 pb-8">
      {/* Main Title */}
      <div className="text-center border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-roadmap-title">
          Flipside - Investor Roadmap & Financial Overview
        </h1>
      </div>

      {/* ==================== SECTION 1: EXECUTIVE SUMMARY ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <Target className="h-6 w-6 text-primary" />
          Executive Summary
        </h2>
        
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Flipside</strong> is a next-generation prediction market platform built on Ethereum, combining trustless blockchain infrastructure with AI-powered trading intelligence. We're positioning to capture significant market share in the rapidly growing prediction markets sector by solving critical UX and liquidity challenges that plague existing platforms.
        </p>

        {/* Our Competitive Edge */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Our Competitive Edge</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Oracle-Powered Automation</p>
                <p className="text-sm text-muted-foreground">First prediction market with Pyth Network integration for trustless, automated resolution</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <DollarSign className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Zero-Fee Trading UX</p>
                <p className="text-sm text-muted-foreground">ProxyWallet infrastructure enables gasless transactions, removing barrier to entry</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Layers className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Dual Liquidity Systems</p>
                <p className="text-sm text-muted-foreground">CLOB + AMM ensure deep liquidity across all market conditions</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <Bot className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">AI-Powered Intelligence</p>
                <p className="text-sm text-muted-foreground">First platform offering AI market analysis and portfolio hedging recommendations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Opportunity */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Market Opportunity</h3>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-muted-foreground">
              The global prediction markets industry is projected to reach <strong className="text-primary text-lg">$10B+ by 2028</strong>, driven by crypto adoption, regulatory clarity, and proven utility in forecasting. Flipside is uniquely positioned to capture institutional and retail market share through superior technology and UX.
            </p>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 2: WHAT WE'VE BUILT ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          What We've Built (Completed Milestones)
        </h2>

        {/* Core Infrastructure */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="default" className="bg-green-500">Core Infrastructure</Badge>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Dual Trading Systems:</p>
              <ul className="ml-6 space-y-1 text-sm text-muted-foreground list-disc">
                <li>CLOB (Central Limit Order Book) with gasless limit/market orders</li>
                <li>AMM Pools with 2% fee structure and LP token rewards</li>
                <li>Real-time order matching engine</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">ProxyWallet System:</p>
              <ul className="ml-6 space-y-1 text-sm text-muted-foreground list-disc">
                <li>EIP-712 meta-transaction framework</li>
                <li>Gasless trading (platform covers gas fees)</li>
                <li>Non-custodial, trustless architecture</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Smart Contracts (Sepolia Testnet):</p>
              <ul className="ml-6 space-y-1 text-sm text-muted-foreground list-disc">
                <li>ConditionalTokens: <code className="bg-muted px-1 rounded text-xs">0xdC8CB01c328795C007879B2C030AbF1c1b580D84</code></li>
                <li>CTFExchange (CLOB): Permissionless order matching</li>
                <li>AMMPoolFactory: <code className="bg-muted px-1 rounded text-xs">0xAe14f8BC192306A891b172A3bc0e91132a4417EF</code></li>
                <li>ProxyWallet Factory: <code className="bg-muted px-1 rounded text-xs">0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Automated Resolution System */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="default" className="bg-green-500">Automated Resolution System</Badge>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold mb-2">Pyth Network Oracle Integration:</p>
            <ul className="ml-6 space-y-1 text-sm text-muted-foreground list-disc">
              <li>Real-time price feeds for crypto markets</li>
              <li>Automated market settlement (no manual intervention)</li>
              <li>Trustless resolution mechanism</li>
              <li>Sub-second price updates</li>
            </ul>
          </CardContent>
        </Card>

        {/* AI & Machine Learning */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="default" className="bg-green-500">AI & Machine Learning</Badge>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">OpenAI GPT-4o Integration:</p>
              <ul className="ml-6 space-y-1 text-sm text-muted-foreground list-disc">
                <li>AI-powered market analysis ("Ask AI" feature)</li>
                <li>Natural language event understanding</li>
                <li>Market sentiment analysis</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Portfolio Hedging Engine:</p>
              <ul className="ml-6 space-y-1 text-sm text-muted-foreground list-disc">
                <li>Vector embeddings for market similarity</li>
                <li>Cosine similarity matching (70%+ threshold)</li>
                <li>Automated inverse position recommendations</li>
                <li>Risk mitigation suggestions</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Data Infrastructure */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="default" className="bg-green-500">Real-Time Data Infrastructure</Badge>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Server className="h-4 w-4 mt-0.5 text-green-500" />
                <span><strong className="text-foreground">Event Indexer:</strong> Background service monitoring blockchain events</span>
              </li>
              <li className="flex items-start gap-2">
                <Network className="h-4 w-4 mt-0.5 text-green-500" />
                <span><strong className="text-foreground">WebSocket Server:</strong> Real-time price/position updates</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-green-500" />
                <span><strong className="text-foreground">HTTP Polling Fallback:</strong> Guaranteed data freshness</span>
              </li>
              <li className="flex items-start gap-2">
                <Database className="h-4 w-4 mt-0.5 text-green-500" />
                <span><strong className="text-foreground">PostgreSQL:</strong> Optimized database with Drizzle ORM</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Additional Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="default" className="bg-green-500">Additional Features</Badge>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span><strong className="text-foreground">ESPN Sports Markets:</strong> Live sportsbook odds integration (NFL, NBA, MLB, NHL, Soccer)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span><strong className="text-foreground">Advanced Order Types:</strong> Fill-or-Kill, Stop-Loss, Good-til-Cancelled</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span><strong className="text-foreground">Quick Sell:</strong> One-click position liquidation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span><strong className="text-foreground">Mobile Wallet Support:</strong> WalletConnect integration</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span><strong className="text-foreground">SEO Optimization:</strong> Dynamic sitemaps, meta tags, Google Search Console</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Professional UI/UX */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="default" className="bg-green-500">Professional UI/UX</Badge>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-6">
              <li>Modern React 18 + TypeScript frontend</li>
              <li>shadcn/ui component library</li>
              <li>Dark/light theme support</li>
              <li>Mobile-first responsive design</li>
              <li>TradingView widget integration</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 3: REVENUE MODEL ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <DollarSign className="h-6 w-6 text-green-500" />
          Revenue Model & Platform Economics
        </h2>

        <h3 className="text-xl font-semibold">Primary Revenue Streams</h3>

        {/* 1. Trading Fees */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">1. Trading Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold">AMM Swaps</p>
                <p className="text-2xl font-bold text-primary">2.0%</p>
                <p className="text-xs text-muted-foreground">50% to LPs, 50% to treasury</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold">CLOB Maker Fees</p>
                <p className="text-2xl font-bold text-primary">0.1%</p>
                <p className="text-xs text-muted-foreground">on limit orders</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-semibold">CLOB Taker Fees</p>
                <p className="text-2xl font-bold text-primary">0.2%</p>
                <p className="text-xs text-muted-foreground">on market orders</p>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-3">Projected Revenue at Scale:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-lg">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-2 px-3 border-b">Daily Volume</th>
                      <th className="text-left py-2 px-3 border-b">Monthly Revenue (2% avg)</th>
                      <th className="text-left py-2 px-3 border-b">Annual Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="py-2 px-3">$100K</td>
                      <td className="py-2 px-3">$60,000</td>
                      <td className="py-2 px-3">$720,000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3">$500K</td>
                      <td className="py-2 px-3">$300,000</td>
                      <td className="py-2 px-3">$3,600,000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3">$1M</td>
                      <td className="py-2 px-3">$600,000</td>
                      <td className="py-2 px-3">$7,200,000</td>
                    </tr>
                    <tr className="bg-primary/5">
                      <td className="py-2 px-3 font-semibold">$5M</td>
                      <td className="py-2 px-3 font-semibold">$3,000,000</td>
                      <td className="py-2 px-3 font-semibold text-green-600">$36,000,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Market Creation Fees */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">2. Market Creation Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Standard Markets:</strong> $10-50 per market (based on category)</li>
              <li><strong className="text-foreground">Premium Markets:</strong> $100+ for high-visibility events</li>
              <li><strong className="text-foreground">Institutional Markets:</strong> Custom pricing for enterprise clients</li>
            </ul>
            <p className="text-sm p-3 bg-muted/50 rounded-lg">
              <strong>Conservative Projection:</strong> 100 markets/day = <span className="text-primary font-semibold">$150,000/month</span>
            </p>
          </CardContent>
        </Card>

        {/* 3. Premium Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">3. Premium Features (Future)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Pro Analytics Dashboard:</strong> $29/month subscription</li>
              <li><strong className="text-foreground">AI Trading Signals:</strong> $99/month for advanced AI recommendations</li>
              <li><strong className="text-foreground">Portfolio Management Tools:</strong> $49/month</li>
              <li><strong className="text-foreground">API Access for Developers:</strong> Tiered pricing ($500-$5000/month)</li>
            </ul>
            <p className="text-sm p-3 bg-muted/50 rounded-lg">
              <strong>Projected Premium Revenue:</strong> <span className="text-primary font-semibold">$50,000-$200,000/month</span> at 10,000 active users
            </p>
          </CardContent>
        </Card>

        {/* 4. Institutional Solutions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">4. Institutional Solutions (Future)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-6">
              <li>White-label prediction market infrastructure</li>
              <li>Custom oracle integrations</li>
              <li>Private market deployments</li>
              <li>SLA-backed API access</li>
            </ul>
            <p className="text-sm p-3 bg-muted/50 rounded-lg">
              <strong>Target:</strong> <span className="text-primary font-semibold">$500K-$2M</span> annual contracts with 5-10 institutional clients
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue Projection */}
        <Card className="bg-gradient-to-r from-green-500/10 to-primary/10 border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Revenue Projection (Year 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Conservative</p>
                <p className="text-2xl font-bold">$5-8M</p>
                <p className="text-xs text-muted-foreground">annually</p>
              </div>
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Moderate</p>
                <p className="text-2xl font-bold">$12-18M</p>
                <p className="text-xs text-muted-foreground">annually</p>
              </div>
              <div className="p-4 bg-background/50 rounded-lg border-2 border-green-500">
                <p className="text-sm text-muted-foreground mb-1">Optimistic</p>
                <p className="text-2xl font-bold text-green-500">$25-40M</p>
                <p className="text-xs text-muted-foreground">with mainnet + viral adoption</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 4: OPERATIONAL COSTS ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <Building className="h-6 w-6 text-orange-500" />
          Current Operational Costs
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Infrastructure Costs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Infrastructure Costs (Monthly)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Blockchain Gas Fees</p>
                    <p className="text-xs text-muted-foreground">Relayer operations, contract deployments, oracle interactions</p>
                  </div>
                  <span className="font-semibold text-right">$5,000-$10,000</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Cloud Infrastructure</p>
                    <p className="text-xs text-muted-foreground">Replit, PostgreSQL, CDN, WebSocket</p>
                  </div>
                  <span className="font-semibold text-right">$2,000-$4,000</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Oracle Fees</p>
                    <p className="text-xs text-muted-foreground">Pyth Network subscriptions</p>
                  </div>
                  <span className="font-semibold text-right">$500-$1,500</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Third-Party Services</p>
                    <p className="text-xs text-muted-foreground">OpenAI, ESPN API, monitoring</p>
                  </div>
                  <span className="font-semibold text-right">$1,000-$2,000</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-primary">
                <span>Total Infrastructure</span>
                <span>$8,500-$17,500</span>
              </div>
            </CardContent>
          </Card>

          {/* Team Costs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Team Costs (Monthly)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Engineering (3-4 FTE)</p>
                    <p className="text-xs text-muted-foreground">Full-stack, smart contract, DevOps</p>
                  </div>
                  <span className="font-semibold text-right">$40,000-$60,000</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Product/Design (1-2 FTE)</p>
                  </div>
                  <span className="font-semibold text-right">$15,000-$25,000</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Marketing/Growth (1-2 FTE)</p>
                  </div>
                  <span className="font-semibold text-right">$10,000-$20,000</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-primary">
                <span>Total Team</span>
                <span>$65,000-$105,000</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Marketing Costs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Marketing & User Acquisition (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">Paid Advertising</p>
                    <p className="text-xs text-muted-foreground">Crypto Twitter/X, Google/Meta, Influencers</p>
                  </div>
                  <span className="font-semibold">$10,000-$30,000</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">Community Building</p>
                    <p className="text-xs text-muted-foreground">Discord/Telegram, content, events</p>
                  </div>
                  <span className="font-semibold">$5,000-$10,000</span>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-primary">
              <span>Total Marketing</span>
              <span>$15,000-$40,000</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Operating Costs */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Monthly Operating Costs</p>
                <p className="text-3xl font-bold">$88,500 - $162,500</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Annual Operating Budget</p>
                <p className="text-3xl font-bold">$1.06M - $1.95M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 5: FUNDING REQUIREMENTS ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <Rocket className="h-6 w-6 text-purple-500" />
          Funding Requirements
        </h2>

        <Card className="bg-gradient-to-r from-purple-500/10 to-primary/10 border-purple-500/30">
          <CardContent className="pt-6 text-center">
            <p className="text-lg text-muted-foreground mb-2">Seed Round Target</p>
            <p className="text-4xl font-bold text-purple-500">$2.5M - $4M</p>
          </CardContent>
        </Card>

        <h3 className="text-xl font-semibold">Use of Funds Breakdown</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Engineering & Product Development</span>
                <Badge className="bg-blue-500">40%</Badge>
              </CardTitle>
              <CardDescription className="text-xl font-bold">$1M - $1.6M</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                <li>Mainnet deployment and security audits ($200K)</li>
                <li>Mobile app development (iOS + Android) ($300K)</li>
                <li>Additional oracle integrations (Chainlink, UMA) ($150K)</li>
                <li>Governance token smart contracts ($100K)</li>
                <li>Advanced trading features ($250K)</li>
                <li>Team expansion: 2-3 senior engineers ($600K/year)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Marketing & User Acquisition</span>
                <Badge className="bg-green-500">25%</Badge>
              </CardTitle>
              <CardDescription className="text-xl font-bold">$625K - $1M</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                <li>Influencer partnerships and KOL campaigns ($200K)</li>
                <li>Paid advertising (6-month runway) ($250K)</li>
                <li>Community building and events ($100K)</li>
                <li>Content creation and PR ($75K)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Operations & Infrastructure</span>
                <Badge className="bg-orange-500">20%</Badge>
              </CardTitle>
              <CardDescription className="text-xl font-bold">$500K - $800K</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                <li>Gas fee subsidies for user onboarding ($250K)</li>
                <li>Cloud infrastructure scaling ($100K)</li>
                <li>Legal and compliance ($100K)</li>
                <li>Insurance fund for platform stability ($150K)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Reserves & Contingency</span>
                <Badge variant="secondary">15%</Badge>
              </CardTitle>
              <CardDescription className="text-xl font-bold">$375K - $600K</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                <li>Emergency fund for market volatility</li>
                <li>Unexpected development costs</li>
                <li>Market maker liquidity backstop</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Key Milestones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Key Milestones Unlocked with Funding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Badge className="mb-2">Month 1-3</Badge>
                <ul className="text-sm text-muted-foreground space-y-1 text-left mt-3">
                  <li>Complete security audits (Trail of Bits / ConsenSys)</li>
                  <li>Deploy to Ethereum mainnet</li>
                  <li>Launch governance token (FLIP)</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Badge className="mb-2">Month 4-6</Badge>
                <ul className="text-sm text-muted-foreground space-y-1 text-left mt-3">
                  <li>Mobile app beta launch</li>
                  <li>Reach 10,000 active users</li>
                  <li>$5M daily trading volume</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Badge className="mb-2">Month 7-12</Badge>
                <ul className="text-sm text-muted-foreground space-y-1 text-left mt-3">
                  <li>Governance DAO transition</li>
                  <li>International expansion (EU, Asia)</li>
                  <li>$50M total volume locked (TVL)</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Badge className="mb-2">Month 13-18</Badge>
                <ul className="text-sm text-muted-foreground space-y-1 text-left mt-3">
                  <li>Series A fundraising ($10M-$15M)</li>
                  <li>Institutional partnerships</li>
                  <li>$100M+ TVL target</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Runway */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">Runway Projection</p>
                <p className="text-sm text-muted-foreground">With flexibility to extend through revenue generation starting Month 6-9</p>
              </div>
              <p className="text-3xl font-bold text-purple-500">18-24 months</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 6: CURRENT PHASE (Q1 2025) ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <Calendar className="h-6 w-6 text-blue-500" />
          Current Phase (Q1 2025)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Platform Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                <li>Performance improvements for order matching engine</li>
                <li>Database query optimization for faster page loads</li>
                <li>WebSocket reliability enhancements</li>
                <li>Mobile responsive design refinements</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">User Acquisition Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                <li>Launch referral program with token rewards</li>
                <li>Community-driven market creation campaigns</li>
                <li>Educational content series (prediction market basics)</li>
                <li>Partnership with crypto influencers (10K-100K followers)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Market Maker Partnerships</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                <li>Recruit 3-5 professional market makers for CLOB liquidity</li>
                <li>AMM pool seeding with initial liquidity ($100K-$500K)</li>
                <li>Volume-based fee rebates for high-frequency traders</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Security Preparation</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-4">
                <li>Internal security audit and code review</li>
                <li>Bug bounty program launch ($10K-$50K rewards)</li>
                <li>Smart contract test coverage to 95%+</li>
                <li>Incident response playbook development</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Q1 Target Metrics */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Target Metrics (End of Q1)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold">1,000+</p>
                <p className="text-sm text-muted-foreground">active users</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold">$500K+</p>
                <p className="text-sm text-muted-foreground">cumulative volume</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-muted-foreground">active markets daily</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-2xl font-bold">99.9%</p>
                <p className="text-sm text-muted-foreground">platform uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 7: FUTURE ROADMAP ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <TrendingUp className="h-6 w-6 text-indigo-500" />
          Future Development Roadmap
        </h2>

        {/* Q2 2025 */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Q2 2025: Mainnet Launch & Mobile</CardTitle>
                <CardDescription>April - June 2025</CardDescription>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Key Deliverables:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Smart contract security audit completion (Trail of Bits)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Ethereum mainnet deployment</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Mobile app beta (iOS + Android)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Governance token (FLIP) launch</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Enhanced market categories (politics, finance, entertainment)</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
              <div className="p-2 bg-muted/50 rounded"><strong>10,000</strong> users</div>
              <div className="p-2 bg-muted/50 rounded"><strong>$5M</strong> daily volume</div>
              <div className="p-2 bg-muted/50 rounded"><strong>$20M</strong> TVL</div>
              <div className="p-2 bg-muted/50 rounded"><strong>100+</strong> markets/day</div>
            </div>
            <p className="text-sm"><strong>Budget Required:</strong> $800K - $1.2M</p>
          </CardContent>
        </Card>

        {/* Q3 2025 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Q3 2025: Governance & Ecosystem Growth</CardTitle>
                <CardDescription>July - September 2025</CardDescription>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Key Deliverables:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Governance DAO implementation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> FLIP token staking for fee sharing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Additional oracle providers (Chainlink, UMA)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Market resolution insurance fund</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Advanced order types (iceberg, TWA)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> API v2 for third-party integrations</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Ecosystem Initiatives:</p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-6">
                <li>Developer grants program ($100K pool)</li>
                <li>Hackathons and bounties</li>
                <li>Integration partnerships (wallets, aggregators)</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
              <div className="p-2 bg-muted/50 rounded"><strong>50,000</strong> users</div>
              <div className="p-2 bg-muted/50 rounded"><strong>$25M</strong> daily volume</div>
              <div className="p-2 bg-muted/50 rounded"><strong>$100M</strong> TVL</div>
              <div className="p-2 bg-muted/50 rounded"><strong>500+</strong> markets/day</div>
            </div>
            <p className="text-sm"><strong>Budget Required:</strong> $1M - $1.5M</p>
          </CardContent>
        </Card>

        {/* Q4 2025 */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Q4 2025: International Expansion & Derivatives</CardTitle>
                <CardDescription>October - December 2025</CardDescription>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Key Deliverables:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Multi-language support (Spanish, Chinese, Japanese)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Localized marketing campaigns (EU, Asia, LATAM)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Derivatives markets (binary options on markets)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Cross-chain expansion (Arbitrum, Optimism, Base)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Institutional trading desk features</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Strategic Initiatives:</p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-6">
                <li>Fiat on-ramp integrations (MoonPay, Transak)</li>
                <li>Compliance framework for regulated markets</li>
                <li>Series A fundraising ($10M-$15M target)</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
              <div className="p-2 bg-muted/50 rounded"><strong>100,000+</strong> users</div>
              <div className="p-2 bg-muted/50 rounded"><strong>$50M</strong> daily volume</div>
              <div className="p-2 bg-muted/50 rounded"><strong>$250M+</strong> TVL</div>
              <div className="p-2 bg-muted/50 rounded">40% Americas, 30% Asia, 30% EU</div>
            </div>
            <p className="text-sm"><strong>Budget Required:</strong> $1.2M - $2M</p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 8: KEY METRICS & MARKET OPPORTUNITY ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <Globe className="h-6 w-6 text-teal-500" />
          Key Metrics & Market Opportunity
        </h2>

        {/* TAM */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Addressable Market (TAM)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-teal-500/10 rounded-lg border border-teal-500/30">
              <p className="text-sm text-muted-foreground">Global Prediction Markets</p>
              <p className="text-4xl font-bold text-teal-500">$10B+ by 2028</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">$200B+</p>
                <p className="text-xs text-muted-foreground">Sports betting (expanding to crypto)</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">$5B+</p>
                <p className="text-xs text-muted-foreground">Political forecasting</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">$50B+</p>
                <p className="text-xs text-muted-foreground">Financial derivatives (crypto-native)</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">$3B+</p>
                <p className="text-xs text-muted-foreground">Entertainment/pop culture</p>
              </div>
            </div>
            <p className="text-center text-sm">
              <strong>Crypto-Native Market Share Target:</strong> <span className="text-teal-500 font-semibold">5-10% ($500M - $1B)</span>
            </p>
          </CardContent>
        </Card>

        {/* Competitive Landscape */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Competitive Landscape</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-2 px-3 border-b">Platform</th>
                    <th className="text-left py-2 px-3 border-b">TVL</th>
                    <th className="text-left py-2 px-3 border-b">Daily Volume</th>
                    <th className="text-left py-2 px-3 border-b">Key Weakness</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 px-3">Polymarket</td>
                    <td className="py-2 px-3">$100M+</td>
                    <td className="py-2 px-3">$10M+</td>
                    <td className="py-2 px-3">Manual resolution, regulatory risks</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">Augur v2</td>
                    <td className="py-2 px-3">$5M</td>
                    <td className="py-2 px-3">$500K</td>
                    <td className="py-2 px-3">Poor UX, low liquidity</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">PredictIt</td>
                    <td className="py-2 px-3">$10M</td>
                    <td className="py-2 px-3">$1M</td>
                    <td className="py-2 px-3">US-only, political focus</td>
                  </tr>
                  <tr className="bg-primary/10">
                    <td className="py-2 px-3 font-bold text-primary">Flipside</td>
                    <td className="py-2 px-3">TBD</td>
                    <td className="py-2 px-3">TBD</td>
                    <td className="py-2 px-3 font-semibold text-primary">Automated resolution, dual liquidity, AI features</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Competitive Differentiation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Competitive Differentiation</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">1</span>
                <span><strong>Oracle Automation</strong> - Only platform with Pyth Network trustless resolution</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">2</span>
                <span><strong>Gasless UX</strong> - ProxyWallet removes friction for new users</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">3</span>
                <span><strong>Dual Liquidity</strong> - CLOB + AMM ensures liquidity at all price points</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">4</span>
                <span><strong>AI Intelligence</strong> - First platform with AI analysis and hedging</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">5</span>
                <span><strong>Mobile-First</strong> - Native mobile apps (Q2 2025)</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* User Growth Projections */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">User Growth Projections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Year 1 (Mainnet):</p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-6">
                <li>Month 1-3: 1,000 users → 10,000 users (10x growth)</li>
                <li>Month 4-6: 10,000 → 50,000 (5x growth)</li>
                <li>Month 7-12: 50,000 → 100,000 (2x growth)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Year 2:</p>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc ml-6">
                <li>Q1: 100,000 → 250,000 users</li>
                <li>Q2-Q4: 250,000 → 500,000+ users</li>
              </ul>
            </div>
            <p className="text-sm p-3 bg-muted/50 rounded-lg">
              <strong>Retention Target:</strong> <span className="text-primary font-semibold">40% monthly active users</span> (industry standard: 20-30%)
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 9: TECHNOLOGY MOAT ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <Shield className="h-6 w-6 text-indigo-500" />
          Technology Moat
        </h2>

        <div className="space-y-4">
          {/* Moat 1 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-bold">1</span>
                Oracle-Powered Automation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><strong>Unique Advantage:</strong> We're the first prediction market platform to integrate Pyth Network for fully automated, trustless resolution.</p>
              <div>
                <p className="text-sm font-semibold mb-1">Why It Matters:</p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>Eliminates human bias and manipulation</li>
                  <li>Instant settlement (no waiting for manual resolution)</li>
                  <li>Scales to thousands of markets without operational overhead</li>
                  <li>Builds trust through cryptographic proof</li>
                </ul>
              </div>
              <p className="text-sm p-2 bg-indigo-500/10 rounded"><strong>Competitive Barrier:</strong> Requires deep smart contract expertise and oracle integration knowledge. Competitors would need <span className="text-indigo-500 font-semibold">6-12 months</span> to replicate.</p>
            </CardContent>
          </Card>

          {/* Moat 2 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-bold">2</span>
                Gasless Trading Infrastructure (ProxyWallet)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><strong>Unique Advantage:</strong> Users sign EIP-712 messages instead of paying gas fees. Platform subsidizes all transaction costs.</p>
              <div>
                <p className="text-sm font-semibold mb-1">Why It Matters:</p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>Removes #1 barrier to entry for new users</li>
                  <li>Enables micro-transactions (&lt; $1 trades viable)</li>
                  <li>Superior UX vs competitors requiring gas for every trade</li>
                  <li>Non-custodial architecture maintains security</li>
                </ul>
              </div>
              <p className="text-sm p-2 bg-indigo-500/10 rounded"><strong>Competitive Barrier:</strong> Complex meta-transaction architecture. Patent-pending approach. Estimated <span className="text-indigo-500 font-semibold">$500K+</span> investment to build from scratch.</p>
            </CardContent>
          </Card>

          {/* Moat 3 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-bold">3</span>
                Dual Liquidity Systems (CLOB + AMM)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><strong>Unique Advantage:</strong> First platform offering both order book and automated market maker.</p>
              <div>
                <p className="text-sm font-semibold mb-1">Why It Matters:</p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>CLOB: Best prices for large trades, professional traders</li>
                  <li>AMM: Guaranteed liquidity for long-tail markets</li>
                  <li>Liquidity network effects (more traders → deeper liquidity → more traders)</li>
                  <li>Hedge against liquidity fragmentation</li>
                </ul>
              </div>
              <p className="text-sm p-2 bg-indigo-500/10 rounded"><strong>Competitive Barrier:</strong> Requires sophisticated smart contract design and significant capital for AMM seeding.</p>
            </CardContent>
          </Card>

          {/* Moat 4 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-bold">4</span>
                AI-Powered Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><strong>Unique Advantage:</strong> OpenAI GPT-4o integration for market analysis and portfolio hedging.</p>
              <div>
                <p className="text-sm font-semibold mb-1">Why It Matters:</p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>First-time users get expert-level insights</li>
                  <li>AI hedging reduces user losses (increases lifetime value)</li>
                  <li>Content generation for market discovery</li>
                  <li>Future: Predictive modeling for price movements</li>
                </ul>
              </div>
              <p className="text-sm p-2 bg-indigo-500/10 rounded"><strong>Competitive Barrier:</strong> Requires machine learning expertise, embedding databases, and significant API costs. <span className="text-indigo-500 font-semibold">12+ month</span> head start on competitors.</p>
            </CardContent>
          </Card>

          {/* Moat 5 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-bold">5</span>
                Real-Time Data Synchronization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm"><strong>Unique Advantage:</strong> WebSocket + Event Indexer architecture for sub-second updates.</p>
              <div>
                <p className="text-sm font-semibold mb-1">Why It Matters:</p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>Professional trader experience</li>
                  <li>Arbitrage opportunities visible instantly</li>
                  <li>Eliminates stale data issues on competitors</li>
                  <li>Scales to 10,000+ concurrent users</li>
                </ul>
              </div>
              <p className="text-sm p-2 bg-indigo-500/10 rounded"><strong>Competitive Barrier:</strong> Requires full-stack expertise and DevOps infrastructure. Most competitors rely on slow polling.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-8" />

      {/* ==================== SECTION 11: INVESTMENT HIGHLIGHTS ==================== */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-2">
          <Award className="h-6 w-6 text-primary" />
          Investment Highlights
        </h2>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Why Invest in Flipside?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Proven Technology</p>
                  <p className="text-sm text-muted-foreground">Fully functional platform on Sepolia testnet</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Market Timing</p>
                  <p className="text-sm text-muted-foreground">Prediction markets entering mainstream adoption phase</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Technology Moat</p>
                  <p className="text-sm text-muted-foreground">12-18 month lead on Oracle automation + gasless UX</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Experienced Team</p>
                  <p className="text-sm text-muted-foreground">[Add team credentials here]</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Clear Path to Revenue</p>
                  <p className="text-sm text-muted-foreground">Multiple revenue streams, validated business model</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Scalable Architecture</p>
                  <p className="text-sm text-muted-foreground">Built to handle 100K+ concurrent users</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg md:col-span-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Strong Unit Economics</p>
                  <p className="text-sm text-muted-foreground">High LTV:CAC ratio (projected 5:1)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exit Opportunities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Exit Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold mb-1">1</p>
                <p className="font-semibold">Acquisition</p>
                <p className="text-sm text-muted-foreground">Strategic buyers (Coinbase, Binance, Polymarket)</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold mb-1">2</p>
                <p className="font-semibold">Token Appreciation</p>
                <p className="text-sm text-muted-foreground">FLIP governance token with fee-sharing utility</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-2xl font-bold mb-1">3</p>
                <p className="font-semibold">Traditional IPO/SPAC</p>
                <p className="text-sm text-muted-foreground">If regulatory environment permits (2027+)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Terms */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Investment Terms (Example)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Round Size</p>
                <p className="text-lg font-bold">$2.5M - $4M</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Valuation</p>
                <p className="text-lg font-bold">$12M - $18M</p>
                <p className="text-xs text-muted-foreground">post-money</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Minimum Check</p>
                <p className="text-lg font-bold">$100K</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Lead Investor</p>
                <p className="text-lg font-bold">$1M+</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg md:col-span-1 col-span-2">
                <p className="text-xs text-muted-foreground">Investor Rights</p>
                <p className="text-sm font-semibold">Board observer, pro-rata, quarterly reporting</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <div className="text-center pt-8 pb-4 border-t">
        <p className="text-sm text-muted-foreground">Last Updated: November 2025</p>
        <p className="text-lg font-bold text-primary mt-2">Flipside - The Future of Decentralized Prediction Markets</p>
      </div>
    </div>
  );
}
