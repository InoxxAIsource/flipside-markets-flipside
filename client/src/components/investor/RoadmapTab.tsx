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
  AlertTriangle,
  Award
} from "lucide-react";

export function RoadmapTab() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-roadmap-title">
          Investor Roadmap & Financial Overview
        </h2>
        <p className="text-muted-foreground mt-2" data-testid="text-roadmap-description">
          Comprehensive development timeline, financial projections, and investment opportunity
        </p>
      </div>

      {/* Executive Summary */}
      <Card data-testid="card-executive-summary">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Executive Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            <strong>Flipside</strong> is a next-generation prediction market platform built on Ethereum, combining trustless blockchain infrastructure with AI-powered trading intelligence. We're positioning to capture significant market share in the rapidly growing prediction markets sector by solving critical UX and liquidity challenges that plague existing platforms.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-semibold">Oracle-Powered Automation</span>
              </div>
              <p className="text-sm text-muted-foreground">First prediction market with Pyth Network integration for trustless, automated resolution</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-semibold">Zero-Fee Trading UX</span>
              </div>
              <p className="text-sm text-muted-foreground">ProxyWallet infrastructure enables gasless transactions, removing barrier to entry</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-semibold">Dual Liquidity Systems</span>
              </div>
              <p className="text-sm text-muted-foreground">CLOB + AMM ensure deep liquidity across all market conditions</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="font-semibold">AI-Powered Intelligence</span>
              </div>
              <p className="text-sm text-muted-foreground">First platform offering AI market analysis and portfolio hedging recommendations</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mt-4">
            <p className="font-semibold text-primary">Market Opportunity</p>
            <p className="text-sm mt-1">The global prediction markets industry is projected to reach <strong>$10B+ by 2028</strong>, driven by crypto adoption, regulatory clarity, and proven utility in forecasting.</p>
          </div>
        </CardContent>
      </Card>

      {/* Completed Milestones */}
      <Card data-testid="card-completed-milestones">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>What We've Built (Completed Milestones)</CardTitle>
          </div>
          <CardDescription>Core infrastructure and features already deployed on Sepolia Testnet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Core Infrastructure */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Badge variant="default">Core Infrastructure</Badge>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Dual Trading Systems:</strong> CLOB with gasless limit/market orders + AMM Pools with 2% fee structure and LP token rewards</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>ProxyWallet System:</strong> EIP-712 meta-transaction framework, gasless trading, non-custodial architecture</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Smart Contracts:</strong> ConditionalTokens, CTFExchange, AMMPoolFactory, ProxyWallet Factory deployed</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Automated Resolution */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Badge variant="default">Automated Resolution System</Badge>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Pyth Network Oracle:</strong> Real-time price feeds, automated settlement, sub-second updates</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* AI & ML */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Badge variant="default">AI & Machine Learning</Badge>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>OpenAI GPT-4o:</strong> AI-powered market analysis, natural language event understanding</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Portfolio Hedging Engine:</strong> Vector embeddings, cosine similarity matching, automated inverse position recommendations</span>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Additional Features */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Badge variant="default">Additional Features</Badge>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>ESPN Sports Markets with live sportsbook odds (NFL, NBA, MLB, NHL, Soccer)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Advanced Order Types: Fill-or-Kill, Stop-Loss, Good-til-Cancelled</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>WalletConnect mobile wallet integration</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Professional UI/UX with React 18, TypeScript, dark/light themes</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Model */}
      <Card data-testid="card-revenue-model">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <CardTitle>Revenue Model & Platform Economics</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trading Fees */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">Trading Fees</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>AMM Swaps:</strong> 2.0% (50% to LPs, 50% to treasury)</li>
                <li><strong>CLOB Maker:</strong> 0.1% on limit orders</li>
                <li><strong>CLOB Taker:</strong> 0.2% on market orders</li>
              </ul>
            </div>

            {/* Market Creation */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">Market Creation Fees</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>Standard:</strong> $10-50 per market</li>
                <li><strong>Premium:</strong> $100+ for high-visibility events</li>
                <li><strong>Institutional:</strong> Custom pricing</li>
              </ul>
            </div>
          </div>

          <div className="overflow-x-auto">
            <h4 className="font-semibold mb-3">Projected Revenue at Scale</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Daily Volume</th>
                  <th className="text-left py-2">Monthly Revenue</th>
                  <th className="text-left py-2">Annual Revenue</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2">$100K</td>
                  <td className="py-2">$60,000</td>
                  <td className="py-2">$720,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">$500K</td>
                  <td className="py-2">$300,000</td>
                  <td className="py-2">$3,600,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">$1M</td>
                  <td className="py-2">$600,000</td>
                  <td className="py-2">$7,200,000</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">$5M</td>
                  <td className="py-2 font-semibold">$3,000,000</td>
                  <td className="py-2 font-semibold text-green-600">$36,000,000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-2">Total Revenue Projection (Year 2)</h4>
            <div className="grid grid-cols-3 gap-4 text-center mt-3">
              <div>
                <p className="text-sm text-muted-foreground">Conservative</p>
                <p className="text-lg font-bold">$5-8M</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moderate</p>
                <p className="text-lg font-bold">$12-18M</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Optimistic</p>
                <p className="text-lg font-bold text-green-600">$25-40M</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Costs */}
      <Card data-testid="card-operational-costs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-orange-500" />
            <CardTitle>Current Operational Costs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Infrastructure (Monthly)</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex justify-between"><span>Blockchain Gas Fees</span><span>$5,000-$10,000</span></li>
                <li className="flex justify-between"><span>Cloud Infrastructure</span><span>$2,000-$4,000</span></li>
                <li className="flex justify-between"><span>Oracle Fees</span><span>$500-$1,500</span></li>
                <li className="flex justify-between"><span>Third-Party Services</span><span>$1,000-$2,000</span></li>
                <li className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total Infrastructure</span><span>$8,500-$17,500</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Team (Monthly)</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex justify-between"><span>Engineering (3-4 FTE)</span><span>$40,000-$60,000</span></li>
                <li className="flex justify-between"><span>Product/Design (1-2 FTE)</span><span>$15,000-$25,000</span></li>
                <li className="flex justify-between"><span>Marketing/Growth (1-2 FTE)</span><span>$10,000-$20,000</span></li>
                <li className="flex justify-between font-semibold border-t pt-2 mt-2"><span>Total Team</span><span>$65,000-$105,000</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Monthly Operating Costs</span>
              <span className="text-lg font-bold">$88,500 - $162,500</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold">Annual Operating Budget</span>
              <span className="text-lg font-bold">$1.06M - $1.95M</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Requirements */}
      <Card data-testid="card-funding-requirements">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-purple-500" />
            <CardTitle>Funding Requirements</CardTitle>
          </div>
          <CardDescription>Seed Round Target: $2.5M - $4M</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-semibold">Engineering & Product (40%)</span>
              </div>
              <p className="text-lg font-bold">$1M - $1.6M</p>
              <p className="text-xs text-muted-foreground mt-1">Mainnet, mobile apps, audits, team expansion</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-semibold">Marketing & Acquisition (25%)</span>
              </div>
              <p className="text-lg font-bold">$625K - $1M</p>
              <p className="text-xs text-muted-foreground mt-1">Influencers, paid ads, community, PR</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="font-semibold">Operations & Infrastructure (20%)</span>
              </div>
              <p className="text-lg font-bold">$500K - $800K</p>
              <p className="text-xs text-muted-foreground mt-1">Gas subsidies, cloud, legal, insurance</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="font-semibold">Reserves & Contingency (15%)</span>
              </div>
              <p className="text-lg font-bold">$375K - $600K</p>
              <p className="text-xs text-muted-foreground mt-1">Emergency fund, market maker backstop</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <h4 className="font-semibold mb-3">Key Milestones Unlocked with Funding</h4>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Badge variant="outline">Month 1-3</Badge>
                <span className="text-muted-foreground">Security audits, Ethereum mainnet, FLIP token launch</span>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline">Month 4-6</Badge>
                <span className="text-muted-foreground">Mobile app beta, 10K active users, $5M daily volume</span>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline">Month 7-12</Badge>
                <span className="text-muted-foreground">Governance DAO, international expansion, $50M TVL</span>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline">Month 13-18</Badge>
                <span className="text-muted-foreground">Series A ($10M-$15M), institutional partnerships, $100M+ TVL</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Timeline */}
      <Card data-testid="card-development-timeline">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <CardTitle>Future Development Roadmap</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Q1 2025 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Q1 2025 - Current Phase</h4>
              <Badge>In Progress</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Platform Optimization & User Acquisition</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-bold">1,000+</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-bold">$500K+</p>
                <p className="text-xs text-muted-foreground">Cumulative Volume</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-bold">50+</p>
                <p className="text-xs text-muted-foreground">Daily Markets</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-bold">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime Target</p>
              </div>
            </div>
          </div>

          {/* Q2 2025 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Q2 2025 - Mainnet Launch & Mobile</h4>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Security audit completion (Trail of Bits)</li>
              <li>Ethereum mainnet deployment</li>
              <li>Mobile app beta (iOS + Android)</li>
              <li>FLIP governance token launch</li>
            </ul>
            <p className="text-xs mt-2 font-semibold">Targets: 10K users, $5M daily volume, $20M TVL</p>
            <p className="text-xs text-muted-foreground">Budget: $800K - $1.2M</p>
          </div>

          {/* Q3 2025 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Q3 2025 - Governance & Ecosystem</h4>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Governance DAO implementation</li>
              <li>FLIP token staking for fee sharing</li>
              <li>Additional oracles (Chainlink, UMA)</li>
              <li>Developer grants program ($100K pool)</li>
            </ul>
            <p className="text-xs mt-2 font-semibold">Targets: 50K users, $25M daily volume, $100M TVL</p>
            <p className="text-xs text-muted-foreground">Budget: $1M - $1.5M</p>
          </div>

          {/* Q4 2025 */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Q4 2025 - International Expansion</h4>
              <Badge variant="secondary">Planned</Badge>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Multi-language support (Spanish, Chinese, Japanese)</li>
              <li>Cross-chain expansion (Arbitrum, Optimism, Base)</li>
              <li>Derivatives markets (binary options)</li>
              <li>Series A fundraising ($10M-$15M target)</li>
            </ul>
            <p className="text-xs mt-2 font-semibold">Targets: 100K+ users, $50M daily volume, $250M+ TVL</p>
            <p className="text-xs text-muted-foreground">Budget: $1.2M - $2M</p>
          </div>
        </CardContent>
      </Card>

      {/* Technology Moat */}
      <Card data-testid="card-technology-moat">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            <CardTitle>Technology Moat</CardTitle>
          </div>
          <CardDescription>Competitive barriers and unique advantages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-indigo-500">1. Oracle-Powered Automation</h4>
              <p className="text-sm text-muted-foreground mt-2">First platform with Pyth Network for fully automated, trustless resolution. Eliminates human bias, instant settlement.</p>
              <p className="text-xs mt-2"><strong>Barrier:</strong> 6-12 months to replicate</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-indigo-500">2. Gasless Trading (ProxyWallet)</h4>
              <p className="text-sm text-muted-foreground mt-2">EIP-712 meta-transactions, platform subsidizes all gas. Removes #1 barrier for new users.</p>
              <p className="text-xs mt-2"><strong>Barrier:</strong> $500K+ to build from scratch</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-indigo-500">3. Dual Liquidity Systems</h4>
              <p className="text-sm text-muted-foreground mt-2">CLOB for large trades + AMM for long-tail markets. Network effects compound over time.</p>
              <p className="text-xs mt-2"><strong>Barrier:</strong> Sophisticated contracts + capital</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-indigo-500">4. AI-Powered Intelligence</h4>
              <p className="text-sm text-muted-foreground mt-2">GPT-4o integration for market analysis and portfolio hedging. First-time users get expert insights.</p>
              <p className="text-xs mt-2"><strong>Barrier:</strong> 12+ month head start</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Landscape */}
      <Card data-testid="card-competitive-landscape">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-teal-500" />
            <CardTitle>Competitive Landscape</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Platform</th>
                  <th className="text-left py-2">TVL</th>
                  <th className="text-left py-2">Daily Volume</th>
                  <th className="text-left py-2">Key Weakness</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2">Polymarket</td>
                  <td className="py-2">$100M+</td>
                  <td className="py-2">$10M+</td>
                  <td className="py-2">Manual resolution, regulatory risks</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Augur v2</td>
                  <td className="py-2">$5M</td>
                  <td className="py-2">$500K</td>
                  <td className="py-2">Poor UX, low liquidity</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">PredictIt</td>
                  <td className="py-2">$10M</td>
                  <td className="py-2">$1M</td>
                  <td className="py-2">US-only, political focus</td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="py-2 font-semibold text-primary">Flipside</td>
                  <td className="py-2">TBD</td>
                  <td className="py-2">TBD</td>
                  <td className="py-2 font-semibold text-primary">Automated resolution, dual liquidity, AI features</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk Mitigation */}
      <Card data-testid="card-risk-mitigation">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle>Risk Mitigation & Contingency</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-yellow-600 mb-2">Technical Risks</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Smart contract audits + bug bounty</li>
                <li>Multi-oracle strategy for failover</li>
                <li>Layer 2 expansion for scalability</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-yellow-600 mb-2">Market Risks</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Legal counsel for compliance</li>
                <li>Market maker partnerships</li>
                <li>Referral + viral mechanics</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-yellow-600 mb-2">Competitive Risks</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Technology moat (12-18 months)</li>
                <li>Geographic diversification</li>
                <li>Decentralized governance transition</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Highlights */}
      <Card data-testid="card-investment-highlights">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>Investment Highlights</CardTitle>
          </div>
          <CardDescription>Why invest in Flipside?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Proven Technology</p>
                <p className="text-sm text-muted-foreground">Fully functional platform on Sepolia testnet</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Market Timing</p>
                <p className="text-sm text-muted-foreground">Prediction markets entering mainstream adoption</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Technology Moat</p>
                <p className="text-sm text-muted-foreground">12-18 month lead on Oracle + gasless UX</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Clear Path to Revenue</p>
                <p className="text-sm text-muted-foreground">Multiple revenue streams, validated model</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Scalable Architecture</p>
                <p className="text-sm text-muted-foreground">Built for 100K+ concurrent users</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Strong Unit Economics</p>
                <p className="text-sm text-muted-foreground">Projected LTV:CAC ratio of 5:1</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">Investment Terms</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Round Size</p>
                <p className="font-bold">$2.5M - $4M</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Valuation</p>
                <p className="font-bold">$12M - $18M</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Min Check</p>
                <p className="font-bold">$100K</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Lead Investor</p>
                <p className="font-bold">$1M+</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="font-semibold">Runway Projection</p>
            <p className="text-2xl font-bold text-primary mt-1">18-24 months</p>
            <p className="text-sm text-muted-foreground mt-1">With flexibility to extend through revenue generation starting Month 6-9</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Last Updated: November 2024</p>
        <p className="font-semibold mt-1">Flipside - The Future of Decentralized Prediction Markets</p>
      </div>
    </div>
  );
}
