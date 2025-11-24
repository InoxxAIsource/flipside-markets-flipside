import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Code, Book, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" data-testid="text-docs-title">
          Platform Documentation
        </h2>
        <p className="text-muted-foreground" data-testid="text-docs-description">
          Technical documentation, whitepapers, and API guides
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate" data-testid="card-whitepaper">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Whitepaper</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardDescription>
              Comprehensive overview of Flipside's architecture and vision
            </CardDescription>
            <Button variant="outline" className="w-full" data-testid="button-view-whitepaper">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Whitepaper
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-technical-docs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Technical Docs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardDescription>
              Smart contract documentation and integration guides
            </CardDescription>
            <Button variant="outline" className="w-full" data-testid="button-view-tech-docs">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Documentation
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-api-docs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">API Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <CardDescription>
              Developer API reference and authentication guides
            </CardDescription>
            <Button variant="outline" className="w-full" asChild data-testid="button-view-api-docs">
              <a href="/api-docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View API Docs
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <Card data-testid="card-platform-overview">
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>Understanding Flipside Prediction Markets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              Flipside is a decentralized prediction market platform built on Ethereum that combines
              traditional order book trading (CLOB) with automated market maker (AMM) pools to provide
              deep liquidity and efficient price discovery.
            </p>
            
            <h3 className="text-lg font-semibold mt-4">Key Features</h3>
            <ul className="space-y-2">
              <li><strong>Dual Trading Systems:</strong> Order book for advanced traders, AMM pools for instant liquidity</li>
              <li><strong>Gasless Trading:</strong> Meta-transactions via ProxyWallet for zero-gas limit orders</li>
              <li><strong>Oracle Integration:</strong> Pyth Network for automated, trustless market resolution</li>
              <li><strong>Real-time Data:</strong> ESPN integration for sports markets with live odds comparison</li>
              <li><strong>Developer API:</strong> RESTful API with tiered pricing for institutional adoption</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Smart Contract Architecture</h3>
            <p className="text-muted-foreground">
              Our platform leverages battle-tested smart contracts from Gnosis for conditional token
              framework, with custom implementations for gasless trading and AMM pools.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card data-testid="card-faq">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is-flipside" data-testid="faq-what-is-flipside">
              <AccordionTrigger>What is Flipside?</AccordionTrigger>
              <AccordionContent>
                Flipside is a decentralized prediction market platform on Ethereum that allows users
                to create and trade on binary outcome markets. Users can speculate on real-world events,
                crypto prices, sports outcomes, and more.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-it-works" data-testid="faq-how-it-works">
              <AccordionTrigger>How does the dual trading system work?</AccordionTrigger>
              <AccordionContent>
                Flipside offers two trading mechanisms: (1) Central Limit Order Book (CLOB) for advanced
                traders who want to place limit orders with precise pricing, and (2) Automated Market Maker
                (AMM) pools for instant trades with guaranteed liquidity. Both systems share the same
                conditional tokens for seamless arbitrage.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gasless-trading" data-testid="faq-gasless-trading">
              <AccordionTrigger>What is gasless trading?</AccordionTrigger>
              <AccordionContent>
                Our ProxyWallet system enables users to sign limit orders off-chain using EIP-712 signatures.
                A relayer service submits these orders on-chain, paying the gas fees. This makes trading
                free for users while maintaining full decentralization and self-custody.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="market-resolution" data-testid="faq-market-resolution">
              <AccordionTrigger>How are markets resolved?</AccordionTrigger>
              <AccordionContent>
                Markets are resolved using oracle data from Pyth Network for price-based outcomes (e.g.,
                "Will BTC hit $100k?"). For sports markets, we integrate with ESPN for official game results.
                All resolution is trustless and automated, ensuring fair and timely settlement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="revenue-model" data-testid="faq-revenue-model">
              <AccordionTrigger>What is the revenue model?</AccordionTrigger>
              <AccordionContent>
                Flipside generates revenue through: (1) 2% trading fees on all AMM swaps, (2) Market creation
                fees, and (3) Developer API subscriptions with tiered pricing ($99/mo Pro, $500+/mo Enterprise).
                This creates multiple revenue streams while keeping the platform accessible.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security" data-testid="faq-security">
              <AccordionTrigger>How secure is the platform?</AccordionTrigger>
              <AccordionContent>
                Security is our top priority. We use audited smart contracts from Gnosis for conditional
                tokens, implement meta-transaction security via EIP-712 signatures, store user funds in
                self-custodial wallets, and have comprehensive testing coverage. All code is open-source
                and available for audit.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
