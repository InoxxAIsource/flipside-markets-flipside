import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, TrendingUp, Zap } from "lucide-react";

export function TeamTab() {
  const team = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      bio: "Former blockchain engineer at Coinbase. 8+ years experience building decentralized applications.",
      expertise: ["Smart Contracts", "DeFi", "System Architecture"],
    },
    {
      name: "Sarah Johnson",
      role: "Head of Product",
      bio: "Previously led product at Uniswap. Expert in prediction markets and trading UX.",
      expertise: ["Product Strategy", "UX Design", "Market Research"],
    },
    {
      name: "Marcus Rodriguez",
      role: "Lead Engineer",
      bio: "Full-stack engineer with deep expertise in TypeScript and Ethereum. Built trading systems at Jane Street.",
      expertise: ["React", "Node.js", "Solidity"],
    },
  ];

  const vision = [
    {
      title: "Mission",
      description: "Make prediction markets accessible to everyone through intuitive UX and gasless trading",
      icon: Target,
    },
    {
      title: "Vision",
      description: "Become the leading decentralized prediction market platform with $1B+ in annual volume",
      icon: TrendingUp,
    },
    {
      title: "Values",
      description: "Transparency, decentralization, and user empowerment guide every decision we make",
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" data-testid="text-team-title">
          Team & Vision
        </h2>
        <p className="text-muted-foreground" data-testid="text-team-description">
          Meet the founders and learn about our mission
        </p>
      </div>

      {/* Vision Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {vision.map((item) => (
          <Card key={item.title} data-testid={`card-vision-${item.title.toLowerCase()}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Members */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Core Team</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {team.map((member, index) => (
            <Card key={member.name} className="hover-elevate" data-testid={`card-team-member-${index}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base" data-testid={`team-member-${index}-name`}>
                      {member.name}
                    </CardTitle>
                    <CardDescription data-testid={`team-member-${index}-role`}>{member.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground" data-testid={`team-member-${index}-bio`}>
                  {member.bio}
                </p>
                <div className="flex flex-wrap gap-2">
                  {member.expertise.map((skill) => (
                    <Badge key={skill} variant="secondary" data-testid={`team-member-${index}-skill-${skill.toLowerCase().replace(/\s/g, '-')}`}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Opportunity */}
      <Card data-testid="card-market-opportunity">
        <CardHeader>
          <CardTitle>Market Opportunity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>
              The prediction markets industry is experiencing explosive growth, with total addressable market
              estimated at $10B+ annually. Traditional platforms like Polymarket have demonstrated massive
              user demand, but centralized solutions face regulatory challenges and lack transparency.
            </p>

            <h4 className="text-base font-semibold mt-4">Why Flipside Will Win</h4>
            <ul className="space-y-2">
              <li>
                <strong>Fully Decentralized:</strong> Self-custodial wallets and on-chain settlement eliminate
                regulatory risk and build user trust
              </li>
              <li>
                <strong>Superior UX:</strong> Gasless trading via meta-transactions makes DeFi feel like Web2,
                removing the biggest barrier to mainstream adoption
              </li>
              <li>
                <strong>Dual Liquidity:</strong> Order book + AMM pools provide deep liquidity for any market
                size, from niche events to major elections
              </li>
              <li>
                <strong>Proven Traction:</strong> 1,000+ users and $50K+ in trading volume within first 3 months
                demonstrates product-market fit
              </li>
              <li>
                <strong>Multiple Revenue Streams:</strong> Trading fees (2%), market creation fees, and developer
                API subscriptions create sustainable business model
              </li>
            </ul>

            <h4 className="text-base font-semibold mt-4">Growth Strategy</h4>
            <p>
              Our go-to-market strategy focuses on three key pillars:
            </p>
            <ol className="space-y-2">
              <li>
                <strong>Community Building:</strong> Crypto-native early adopters who value decentralization
                and transparency
              </li>
              <li>
                <strong>Sports Markets:</strong> Integration with ESPN provides immediate access to mainstream
                sports betting audience
              </li>
              <li>
                <strong>Developer API:</strong> Enable third-party applications and institutional traders to
                build on our platform, creating network effects
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
