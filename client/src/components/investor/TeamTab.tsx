import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Zap, ExternalLink } from "lucide-react";
import { SiX } from "react-icons/si";
import tauheedAvatar from "@assets/generated_images/crypto_punk_ceo_avatar.png";
import joeAvatar from "@assets/generated_images/crypto_punk_engineer_avatar.png";
import inoxxAvatar from "@assets/generated_images/crypto_punk_product_avatar.png";

export function TeamTab() {
  const team = [
    {
      name: "M. Tauheed",
      role: "Founder & CEO",
      xHandle: "@beingtauheedtk",
      xUrl: "https://x.com/beingtauheedtk",
      avatar: tauheedAvatar,
      bio: "Visionary entrepreneur driving Flipside's mission to revolutionize prediction markets through blockchain innovation and AI integration.",
      expertise: ["Strategy", "Blockchain", "Business Development"],
    },
    {
      name: "Joe Fill",
      role: "Lead Engineer",
      xHandle: "@joe_fill1",
      xUrl: "https://x.com/joe_fill1",
      avatar: joeAvatar,
      bio: "Full-stack architect with deep expertise in TypeScript, Solidity, and building high-performance trading systems.",
      expertise: ["React", "Node.js", "Solidity", "System Architecture"],
    },
    {
      name: "Inoxx Infra",
      role: "Head of Product",
      xHandle: "@InoxxProtocol",
      xUrl: "https://x.com/InoxxProtocol",
      avatar: inoxxAvatar,
      bio: "Product strategist focused on creating intuitive user experiences that bridge Web2 simplicity with Web3 innovation.",
      expertise: ["Product Strategy", "UX Design", "Market Research"],
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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-team-title">
          Meet Our Team
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-team-description">
          The passionate builders behind Flipside's vision to democratize prediction markets
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-12">
        {team.map((member, index) => (
          <Card 
            key={member.name} 
            className="hover-elevate overflow-hidden group"
            data-testid={`card-team-member-${index}`}
          >
            <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent overflow-hidden">
              <img 
                src={member.avatar} 
                alt={member.name}
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
            <CardHeader className="relative -mt-12 pb-2">
              <div className="flex items-end justify-between">
                <div>
                  <CardTitle className="text-xl" data-testid={`team-member-${index}-name`}>
                    {member.name}
                  </CardTitle>
                  <CardDescription className="text-primary font-medium" data-testid={`team-member-${index}-role`}>
                    {member.role}
                  </CardDescription>
                </div>
                <a 
                  href={member.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-2 py-1 rounded-full"
                  data-testid={`team-member-${index}-x-link`}
                >
                  <SiX className="h-3 w-3" />
                  {member.xHandle}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`team-member-${index}-bio`}>
                {member.bio}
              </p>
              <div className="flex flex-wrap gap-2">
                {member.expertise.map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="secondary" 
                    className="text-xs"
                    data-testid={`team-member-${index}-skill-${skill.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {vision.map((item) => (
          <Card 
            key={item.title} 
            className="bg-gradient-to-br from-card to-card/50 border-primary/10"
            data-testid={`card-vision-${item.title.toLowerCase()}`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20" data-testid="card-market-opportunity">
        <CardHeader>
          <CardTitle className="text-2xl">Market Opportunity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              The prediction markets industry is experiencing explosive growth, with total addressable market
              estimated at <span className="text-primary font-bold">$10B+ annually</span>. Traditional platforms like Polymarket have demonstrated massive
              user demand, but centralized solutions face regulatory challenges and lack transparency.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="text-lg font-semibold mb-4 text-foreground">Why Flipside Will Win</h4>
                <ul className="space-y-3 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <div>
                      <strong className="text-foreground">Fully Decentralized:</strong>
                      <span className="text-muted-foreground"> Self-custodial wallets and on-chain settlement eliminate regulatory risk</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <div>
                      <strong className="text-foreground">Superior UX:</strong>
                      <span className="text-muted-foreground"> Gasless trading makes DeFi feel like Web2</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <div>
                      <strong className="text-foreground">Dual Liquidity:</strong>
                      <span className="text-muted-foreground"> Order book + AMM pools provide deep liquidity</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4 text-foreground">Growth Strategy</h4>
                <ol className="space-y-3 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-primary">1</div>
                    <div>
                      <strong className="text-foreground">Community Building:</strong>
                      <span className="text-muted-foreground"> Crypto-native early adopters who value decentralization</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-primary">2</div>
                    <div>
                      <strong className="text-foreground">Sports Markets:</strong>
                      <span className="text-muted-foreground"> ESPN integration for mainstream audience</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-primary">3</div>
                    <div>
                      <strong className="text-foreground">Developer API:</strong>
                      <span className="text-muted-foreground"> Third-party apps and institutional traders</span>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
