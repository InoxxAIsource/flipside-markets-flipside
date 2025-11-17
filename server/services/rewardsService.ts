import { db } from "../storage";
import { rewardsPoints, rewardsHistory, orderFills, markets, orders } from "@shared/schema";
import { eq, sql, desc, and, gte, inArray } from "drizzle-orm";

/**
 * RewardsService - Calculates and manages liquidity mining rewards
 * 
 * Points System:
 * - 1 point per $1 traded (based on order fill volume)
 * - 2x multiplier for market makers (limit orders that get filled)
 * - Bonus points for market creators with high volume
 * - Daily trading streak bonuses
 */
export class RewardsService {
  /**
   * Calculate and award points for a single trade
   */
  async awardTradePoints(
    makerAddress: string,
    takerAddress: string,
    volume: number,
    isMakerOrder: boolean = false
  ): Promise<void> {
    try {
      // Calculate base points (1 point per $1)
      const basePoints = volume;
      
      // Apply multipliers
      const makerPoints = isMakerOrder ? basePoints * 2 : basePoints; // 2x for market makers
      const takerPoints = basePoints;

      // Award points to maker
      if (makerPoints > 0) {
        await this.addPoints(makerAddress, makerPoints, 'market_making', {
          volume,
          multiplier: isMakerOrder ? 2 : 1,
        });
      }

      // Award points to taker
      if (takerPoints > 0) {
        await this.addPoints(takerAddress, takerPoints, 'trade_volume', {
          volume,
          multiplier: 1,
        });
      }
    } catch (error) {
      console.error('Error awarding trade points:', error);
    }
  }

  /**
   * Add points to a user's balance and log to history
   */
  async addPoints(
    userAddress: string,
    points: number,
    reason: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Upsert user points record
      const existingPoints = await db
        .select()
        .from(rewardsPoints)
        .where(eq(rewardsPoints.userAddress, userAddress))
        .limit(1);

      if (existingPoints.length > 0) {
        // Update existing record
        await db
          .update(rewardsPoints)
          .set({
            totalPoints: sql`${rewardsPoints.totalPoints} + ${points}`,
            weeklyPoints: sql`${rewardsPoints.weeklyPoints} + ${points}`,
            updatedAt: new Date(),
          })
          .where(eq(rewardsPoints.userAddress, userAddress));
      } else {
        // Create new record
        await db.insert(rewardsPoints).values({
          userAddress,
          totalPoints: points,
          weeklyPoints: points,
          totalVolume: 0,
          tradesCount: 0,
          marketsCreated: 0,
        });
      }

      // Log to history
      await db.insert(rewardsHistory).values({
        userAddress,
        points,
        reason,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    } catch (error) {
      console.error('Error adding points:', error);
      throw error;
    }
  }

  /**
   * Recalculate all user points from scratch based on order fills
   */
  async recalculateAllPoints(): Promise<void> {
    try {
      console.log('[RewardsService] Starting full points recalculation...');

      // Get all order fills
      const fills = await db
        .select({
          makerAddress: orderFills.makerAddress,
          takerAddress: orderFills.takerAddress,
          price: orderFills.price,
          size: orderFills.size,
          orderId: orderFills.orderId,
          createdAt: orderFills.createdAt,
        })
        .from(orderFills);

      console.log(`[RewardsService] Processing ${fills.length} order fills...`);

      // Clear existing points
      await db.delete(rewardsPoints);
      await db.delete(rewardsHistory);

      // Group fills by user to calculate totals
      const userStats = new Map<string, {
        volume: number;
        tradesCount: number;
        makerVolume: number;
        takerVolume: number;
        weeklyMakerVolume: number;
        weeklyTakerVolume: number;
        lastTradeAt: Date;
      }>();

      // Get all order IDs to check which are maker orders and get market IDs
      const orderIds = fills.map((f: any) => f.orderId);
      const ordersData = orderIds.length > 0 ? await db
        .select({ id: orders.id, makerAddress: orders.makerAddress, marketId: orders.marketId })
        .from(orders)
        .where(inArray(orders.id, orderIds)) : [];

      const makerOrders = new Set(ordersData.map((o: any) => o.id));
      const orderMarketMap = new Map<string, string>(); // orderId -> marketId
      ordersData.forEach((o: any) => orderMarketMap.set(o.id, o.marketId));

      // Calculate weekly cutoff (7 days ago)
      const weeklyStartDate = new Date();
      weeklyStartDate.setDate(weeklyStartDate.getDate() - 7);

      // Track weekly market volumes for creator bonuses
      const weeklyMarketVolumes = new Map<string, number>(); // marketId -> weekly volume

      for (const fill of fills) {
        const volume = fill.price * fill.size;
        const isMakerOrder = makerOrders.has(fill.orderId);
        const isThisWeek = new Date(fill.createdAt) >= weeklyStartDate;
        const marketId = orderMarketMap.get(fill.orderId);

        // Track weekly market volumes for creator bonuses
        if (isThisWeek && marketId) {
          const currentMarketVolume = weeklyMarketVolumes.get(marketId) || 0;
          weeklyMarketVolumes.set(marketId, currentMarketVolume + volume);
        }

        // Track maker stats
        const makerStats = userStats.get(fill.makerAddress) || {
          volume: 0,
          tradesCount: 0,
          makerVolume: 0,
          takerVolume: 0,
          weeklyMakerVolume: 0,
          weeklyTakerVolume: 0,
          lastTradeAt: new Date(fill.createdAt),
        };
        makerStats.volume += volume;
        makerStats.tradesCount += 1;
        makerStats.makerVolume += volume;
        if (isThisWeek) makerStats.weeklyMakerVolume += volume;
        if (new Date(fill.createdAt) > makerStats.lastTradeAt) {
          makerStats.lastTradeAt = new Date(fill.createdAt);
        }
        userStats.set(fill.makerAddress, makerStats);

        // Track taker stats
        const takerStats = userStats.get(fill.takerAddress) || {
          volume: 0,
          tradesCount: 0,
          makerVolume: 0,
          takerVolume: 0,
          weeklyMakerVolume: 0,
          weeklyTakerVolume: 0,
          lastTradeAt: new Date(fill.createdAt),
        };
        takerStats.volume += volume;
        takerStats.tradesCount += 1;
        takerStats.takerVolume += volume;
        if (isThisWeek) takerStats.weeklyTakerVolume += volume;
        if (new Date(fill.createdAt) > takerStats.lastTradeAt) {
          takerStats.lastTradeAt = new Date(fill.createdAt);
        }
        userStats.set(fill.takerAddress, takerStats);
      }

      // Get market creator data for bonuses
      const marketData = await db
        .select({
          id: markets.id,
          creatorAddress: markets.creatorAddress,
          volume: markets.volume,
        })
        .from(markets);

      // Group by creator and calculate total volume + weekly volume
      const creatorBonuses = new Map<string, { volume: number; marketCount: number; weeklyVolume: number }>();
      const marketCreators = new Map<string, string>(); // marketId -> creatorAddress
      
      for (const market of marketData) {
        marketCreators.set(market.id, market.creatorAddress);
        const current = creatorBonuses.get(market.creatorAddress) || { volume: 0, marketCount: 0, weeklyVolume: 0 };
        current.volume += market.volume;
        current.marketCount += 1;
        creatorBonuses.set(market.creatorAddress, current);
      }

      // Calculate weekly creator bonuses based on weekly market volumes
      for (const [marketId, weeklyVolume] of weeklyMarketVolumes.entries()) {
        const creatorAddress = marketCreators.get(marketId);
        if (creatorAddress && creatorBonuses.has(creatorAddress)) {
          creatorBonuses.get(creatorAddress)!.weeklyVolume += weeklyVolume;
        }
      }

      // Ensure all market creators are in userStats even if they haven't traded
      for (const [creatorAddress, bonusData] of creatorBonuses.entries()) {
        if (!userStats.has(creatorAddress)) {
          // Creator has markets but hasn't traded themselves
          userStats.set(creatorAddress, {
            volume: 0,
            tradesCount: 0,
            makerVolume: 0,
            takerVolume: 0,
            weeklyMakerVolume: 0,
            weeklyTakerVolume: 0,
            lastTradeAt: new Date(), // Use current time if never traded
          });
        }
      }

      // Calculate points for each user
      for (const [userAddress, stats] of Array.from(userStats.entries())) {
        // Total points (all time)
        const makerPoints = stats.makerVolume * 2; // 2x for market making
        const takerPoints = stats.takerVolume * 1; // 1x for taking
        const creatorBonus = creatorBonuses.has(userAddress) ? creatorBonuses.get(userAddress)!.volume * 0.1 : 0; // 10% bonus for market creators
        const totalPoints = makerPoints + takerPoints + creatorBonus;

        // Weekly points (last 7 days with same multipliers)
        const weeklyMakerPoints = stats.weeklyMakerVolume * 2; // 2x for market making
        const weeklyTakerPoints = stats.weeklyTakerVolume * 1; // 1x for taking
        // Weekly creator bonus: 10% of user's weekly trading volume
        const weeklyCreatorBonus = creatorBonuses.has(userAddress) 
          ? creatorBonuses.get(userAddress)!.weeklyVolume * 0.1 
          : 0;
        const weeklyPoints = weeklyMakerPoints + weeklyTakerPoints + weeklyCreatorBonus;

        // Get market count for this user
        const marketCount = creatorBonuses.get(userAddress)?.marketCount || 0;

        // Insert points record with all stats
        await db.insert(rewardsPoints).values({
          userAddress,
          totalPoints,
          weeklyPoints,
          totalVolume: stats.volume,
          tradesCount: stats.tradesCount,
          marketsCreated: marketCount,
          lastTradeAt: stats.lastTradeAt,
        });

        // Log history for trading points
        if (makerPoints > 0) {
          await db.insert(rewardsHistory).values({
            userAddress,
            points: makerPoints,
            reason: 'market_making',
            metadata: JSON.stringify({ volume: stats.makerVolume }),
          });
        }

        if (takerPoints > 0) {
          await db.insert(rewardsHistory).values({
            userAddress,
            points: takerPoints,
            reason: 'trade_volume',
            metadata: JSON.stringify({ volume: stats.takerVolume }),
          });
        }

        // Log history for market creation bonus
        if (creatorBonus > 0) {
          await db.insert(rewardsHistory).values({
            userAddress,
            points: creatorBonus,
            reason: 'market_creation',
            metadata: JSON.stringify({ 
              totalVolume: creatorBonuses.get(userAddress)!.volume,
              marketCount: creatorBonuses.get(userAddress)!.marketCount 
            }),
          });
        }
      }

      // Update rankings
      await this.updateRankings();

      console.log(`[RewardsService] Recalculation complete. Processed ${userStats.size} users.`);
    } catch (error) {
      console.error('Error recalculating points:', error);
      throw error;
    }
  }


  /**
   * Update user rankings based on total points
   */
  async updateRankings(): Promise<void> {
    try {
      // Get all users sorted by points
      const users = await db
        .select({
          userAddress: rewardsPoints.userAddress,
          totalPoints: rewardsPoints.totalPoints,
        })
        .from(rewardsPoints)
        .orderBy(desc(rewardsPoints.totalPoints));

      // Update ranks
      for (let i = 0; i < users.length; i++) {
        await db
          .update(rewardsPoints)
          .set({ rank: i + 1 })
          .where(eq(rewardsPoints.userAddress, users[i].userAddress));
      }

      console.log(`[RewardsService] Updated rankings for ${users.length} users`);
    } catch (error) {
      console.error('Error updating rankings:', error);
    }
  }

  /**
   * Reset weekly points for all users
   */
  async resetWeeklyPoints(): Promise<void> {
    try {
      console.log('[RewardsService] Triggering weekly recalculation...');
      
      // Weekly points are now calculated dynamically based on the last 7 days
      // during recalculateAllPoints, so we just trigger a full recalculation
      await this.recalculateAllPoints();

      console.log('[RewardsService] Weekly recalculation complete');
    } catch (error) {
      console.error('Error during weekly reset:', error);
    }
  }

  /**
   * Get leaderboard (top users by total points)
   */
  async getLeaderboard(limit: number = 100) {
    try {
      return await db
        .select()
        .from(rewardsPoints)
        .orderBy(desc(rewardsPoints.totalPoints))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user rewards data
   */
  async getUserRewards(userAddress: string) {
    try {
      const points = await db
        .select()
        .from(rewardsPoints)
        .where(eq(rewardsPoints.userAddress, userAddress))
        .limit(1);

      return points[0] || null;
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      return null;
    }
  }

  /**
   * Get user rewards history
   */
  async getUserRewardsHistory(userAddress: string, limit: number = 50) {
    try {
      return await db
        .select()
        .from(rewardsHistory)
        .where(eq(rewardsHistory.userAddress, userAddress))
        .orderBy(desc(rewardsHistory.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching rewards history:', error);
      return [];
    }
  }
}

// Singleton instance
export const rewardsService = new RewardsService();
