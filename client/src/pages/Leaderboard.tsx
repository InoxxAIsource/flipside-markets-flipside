import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Award, Medal } from "lucide-react";
import type { RewardsPoints } from "@shared/schema";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<RewardsPoints[]>({
    queryKey: ['/api/rewards/leaderboard'],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" data-testid="icon-rank-1" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" data-testid="icon-rank-2" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" data-testid="icon-rank-3" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number): "default" | "secondary" => {
    return rank <= 3 ? "default" : "secondary";
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold" data-testid="text-page-title">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Top traders ranked by liquidity mining points
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Traders</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-total-traders">
              {leaderboard?.length || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Points Awarded</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-total-points">
              {leaderboard?.reduce((sum, user) => sum + user.totalPoints, 0).toLocaleString(undefined, {
                maximumFractionDigits: 0
              }) || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Volume Traded</CardDescription>
            <CardTitle className="text-3xl" data-testid="text-total-volume">
              ${leaderboard?.reduce((sum, user) => sum + user.totalVolume, 0).toLocaleString(undefined, {
                maximumFractionDigits: 0
              }) || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((user) => (
            <Card
              key={user.userAddress}
              className={`hover-elevate transition-all ${
                user.rank && user.rank <= 3 ? 'border-primary/50' : ''
              }`}
              data-testid={`card-leaderboard-${user.rank}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Rank & Address */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {user.rank && getRankIcon(user.rank)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-mono text-sm truncate"
                          title={user.userAddress}
                          data-testid={`text-address-${user.rank}`}
                        >
                          {user.userAddress.slice(0, 6)}...{user.userAddress.slice(-4)}
                        </span>
                        {user.rank && user.rank <= 3 && (
                          <Badge variant={getRankBadgeVariant(user.rank)} data-testid={`badge-top-${user.rank}`}>
                            Top {user.rank}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span data-testid={`text-trades-${user.rank}`}>
                            {user.tradesCount} trades
                          </span>
                        </div>
                        <div data-testid={`text-volume-${user.rank}`}>
                          ${user.totalVolume.toLocaleString()} volume
                        </div>
                        {user.marketsCreated > 0 && (
                          <div data-testid={`text-markets-${user.rank}`}>
                            {user.marketsCreated} markets created
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-primary" data-testid={`text-points-${user.rank}`}>
                      {user.totalPoints.toLocaleString(undefined, {
                        maximumFractionDigits: 0
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground" data-testid="text-no-data">
                No traders yet. Start trading to earn points!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
