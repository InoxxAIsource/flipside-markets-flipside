import { eq, and, desc, sql as sqlOperator } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import {
  users,
  markets,
  orders,
  orderFills,
  ammSwaps,
  positionMerges,
  positions,
  pythPriceUpdates,
  userNonces,
  type User,
  type InsertUser,
  type Market,
  type InsertMarket,
  type Order,
  type InsertOrder,
  type OrderFill,
  type InsertOrderFill,
  type AmmSwap,
  type InsertAmmSwap,
  type PositionMerge,
  type InsertPositionMerge,
  type Position,
  type InsertPosition,
  type PythPriceUpdate,
  type InsertPythPriceUpdate,
  type UserNonce,
} from "@shared/schema";

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(walletAddress: string, passwordHash: string): Promise<void>;
  
  // Market methods
  getMarket(id: string): Promise<Market | undefined>;
  getAllMarkets(): Promise<Market[]>;
  getMarketsByCategory(category: string): Promise<Market[]>;
  createMarket(market: InsertMarket): Promise<Market>;
  updateMarket(id: string, updates: Partial<Market>): Promise<Market | undefined>;
  updateMarketAIAnalysis(id: string, aiAnalysis: string): Promise<Market | undefined>;
  incrementMarketVolume(id: string, amount: number): Promise<Market | undefined>;
  resolveMarket(id: string, outcome: boolean): Promise<Market | undefined>;
  
  // Order methods
  getOrder(id: string): Promise<Order | undefined>;
  getMarketOrders(marketId: string, status?: string): Promise<Order[]>;
  getUserOrders(userAddress: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  cancelOrder(id: string): Promise<void>;
  
  // Order fill methods
  createOrderFill(fill: InsertOrderFill): Promise<OrderFill>;
  getOrderFills(orderId: string): Promise<OrderFill[]>;
  getMarketFills(marketId: string): Promise<OrderFill[]>;
  
  // AMM swap methods
  createAmmSwap(swap: InsertAmmSwap): Promise<AmmSwap>;
  getUserAmmSwaps(userAddress: string): Promise<AmmSwap[]>;
  getMarketAmmSwaps(marketId: string): Promise<AmmSwap[]>;
  getPoolAmmSwaps(poolAddress: string): Promise<AmmSwap[]>;
  getAllAmmSwaps(): Promise<AmmSwap[]>;
  
  // Position merge methods
  createPositionMerge(merge: InsertPositionMerge): Promise<PositionMerge>;
  getUserPositionMerges(userAddress: string): Promise<PositionMerge[]>;
  getMarketPositionMerges(marketId: string): Promise<PositionMerge[]>;
  
  // Position methods
  getUserPosition(userAddress: string, marketId: string): Promise<Position | undefined>;
  getUserPositions(userAddress: string): Promise<Position[]>;
  upsertPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: string, updates: Partial<Position>): Promise<Position | undefined>;
  
  // Pyth price update methods
  createPriceUpdate(update: InsertPythPriceUpdate): Promise<PythPriceUpdate>;
  getLatestPriceUpdate(priceFeedId: string): Promise<PythPriceUpdate | undefined>;
  getPriceUpdates(priceFeedId: string, limit?: number): Promise<PythPriceUpdate[]>;
  
  // Nonce management methods
  getUserNonce(userAddress: string): Promise<bigint>;
  validateAndUpdateNonce(userAddress: string, nonce: bigint): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password if provided
    let passwordHash = insertUser.passwordHash;
    if (passwordHash && !passwordHash.startsWith('$2')) {
      passwordHash = await bcrypt.hash(passwordHash, 10);
    }

    const result = await db
      .insert(users)
      .values({ ...insertUser, passwordHash })
      .returning();
    return result[0];
  }

  async updateUserPassword(walletAddress: string, passwordHash: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(passwordHash, 10);
    await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.walletAddress, walletAddress));
  }

  // Market methods
  async getMarket(id: string): Promise<Market | undefined> {
    const result = await db
      .select()
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);
    return result[0];
  }

  async getAllMarkets(): Promise<Market[]> {
    return await db
      .select()
      .from(markets)
      .orderBy(desc(markets.createdAt));
  }

  async getMarketsByCategory(category: string): Promise<Market[]> {
    return await db
      .select()
      .from(markets)
      .where(eq(markets.category, category))
      .orderBy(desc(markets.createdAt));
  }

  async createMarket(market: InsertMarket): Promise<Market> {
    const result = await db
      .insert(markets)
      .values(market)
      .returning();
    return result[0];
  }

  async updateMarket(id: string, updates: Partial<Market>): Promise<Market | undefined> {
    const result = await db
      .update(markets)
      .set(updates)
      .where(eq(markets.id, id))
      .returning();
    return result[0];
  }

  async updateMarketAIAnalysis(id: string, aiAnalysis: string): Promise<Market | undefined> {
    const result = await db
      .update(markets)
      .set({ aiAnalysis })
      .where(eq(markets.id, id))
      .returning();
    return result[0];
  }

  async incrementMarketVolume(id: string, amount: number): Promise<Market | undefined> {
    const result = await db
      .update(markets)
      .set({ volume: sqlOperator`${markets.volume} + ${amount}` })
      .where(eq(markets.id, id))
      .returning();
    return result[0];
  }

  async resolveMarket(id: string, outcome: boolean): Promise<Market | undefined> {
    const result = await db
      .update(markets)
      .set({
        outcome,
        resolved: true,
        resolvedAt: new Date(),
      })
      .where(eq(markets.id, id))
      .returning();
    return result[0];
  }

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return result[0];
  }

  async getMarketOrders(marketId: string, status?: string): Promise<Order[]> {
    if (status) {
      return await db
        .select()
        .from(orders)
        .where(and(eq(orders.marketId, marketId), eq(orders.status, status)))
        .orderBy(desc(orders.createdAt));
    }
    
    return await db
      .select()
      .from(orders)
      .where(eq(orders.marketId, marketId))
      .orderBy(desc(orders.createdAt));
  }

  async getUserOrders(userAddress: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.makerAddress, userAddress))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db
      .insert(orders)
      .values(order)
      .returning();
    return result[0];
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const result = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async cancelOrder(id: string): Promise<void> {
    await db
      .update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  // Order fill methods
  async createOrderFill(fill: InsertOrderFill): Promise<OrderFill> {
    const result = await db
      .insert(orderFills)
      .values(fill)
      .returning();
    return result[0];
  }

  async getOrderFills(orderId: string): Promise<OrderFill[]> {
    return await db
      .select()
      .from(orderFills)
      .where(eq(orderFills.orderId, orderId))
      .orderBy(desc(orderFills.createdAt));
  }

  async getMarketFills(marketId: string): Promise<OrderFill[]> {
    return await db
      .select()
      .from(orderFills)
      .where(eq(orderFills.marketId, marketId))
      .orderBy(desc(orderFills.createdAt));
  }

  // AMM swap methods
  async createAmmSwap(swap: InsertAmmSwap): Promise<AmmSwap> {
    const result = await db
      .insert(ammSwaps)
      .values(swap)
      .returning();
    return result[0];
  }

  async getUserAmmSwaps(userAddress: string): Promise<AmmSwap[]> {
    return await db
      .select()
      .from(ammSwaps)
      .where(eq(ammSwaps.userAddress, userAddress))
      .orderBy(desc(ammSwaps.createdAt));
  }

  async getMarketAmmSwaps(marketId: string): Promise<AmmSwap[]> {
    return await db
      .select()
      .from(ammSwaps)
      .where(eq(ammSwaps.marketId, marketId))
      .orderBy(desc(ammSwaps.createdAt));
  }

  async getPoolAmmSwaps(poolAddress: string): Promise<AmmSwap[]> {
    return await db
      .select()
      .from(ammSwaps)
      .where(eq(ammSwaps.poolAddress, poolAddress))
      .orderBy(desc(ammSwaps.createdAt));
  }

  async getAllAmmSwaps(): Promise<AmmSwap[]> {
    return await db
      .select()
      .from(ammSwaps)
      .orderBy(desc(ammSwaps.createdAt));
  }

  // Position merge methods
  async createPositionMerge(merge: InsertPositionMerge): Promise<PositionMerge> {
    const result = await db
      .insert(positionMerges)
      .values(merge)
      .returning();
    return result[0];
  }

  async getUserPositionMerges(userAddress: string): Promise<PositionMerge[]> {
    return await db
      .select()
      .from(positionMerges)
      .where(eq(positionMerges.userAddress, userAddress))
      .orderBy(desc(positionMerges.createdAt));
  }

  async getMarketPositionMerges(marketId: string): Promise<PositionMerge[]> {
    return await db
      .select()
      .from(positionMerges)
      .where(eq(positionMerges.marketId, marketId))
      .orderBy(desc(positionMerges.createdAt));
  }

  // Position methods
  async getUserPosition(userAddress: string, marketId: string): Promise<Position | undefined> {
    const result = await db
      .select()
      .from(positions)
      .where(and(eq(positions.userAddress, userAddress), eq(positions.marketId, marketId)))
      .limit(1);
    return result[0];
  }

  async getUserPositions(userAddress: string): Promise<Position[]> {
    return await db
      .select()
      .from(positions)
      .where(eq(positions.userAddress, userAddress));
  }

  async upsertPosition(position: InsertPosition): Promise<Position> {
    // Check if position exists
    const existing = await this.getUserPosition(position.userAddress, position.marketId);
    
    if (existing) {
      const result = await db
        .update(positions)
        .set({ ...position, updatedAt: new Date() })
        .where(and(eq(positions.userAddress, position.userAddress), eq(positions.marketId, position.marketId)))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(positions)
        .values(position)
        .returning();
      return result[0];
    }
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<Position | undefined> {
    const result = await db
      .update(positions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(positions.id, id))
      .returning();
    return result[0];
  }

  // Pyth price update methods
  async createPriceUpdate(update: InsertPythPriceUpdate): Promise<PythPriceUpdate> {
    const result = await db
      .insert(pythPriceUpdates)
      .values(update)
      .returning();
    return result[0];
  }

  async getLatestPriceUpdate(priceFeedId: string): Promise<PythPriceUpdate | undefined> {
    const result = await db
      .select()
      .from(pythPriceUpdates)
      .where(eq(pythPriceUpdates.priceFeedId, priceFeedId))
      .orderBy(desc(pythPriceUpdates.publishTime))
      .limit(1);
    return result[0];
  }

  async getPriceUpdates(priceFeedId: string, limit: number = 100): Promise<PythPriceUpdate[]> {
    return await db
      .select()
      .from(pythPriceUpdates)
      .where(eq(pythPriceUpdates.priceFeedId, priceFeedId))
      .orderBy(desc(pythPriceUpdates.publishTime))
      .limit(limit);
  }

  // Nonce management methods
  async getUserNonce(userAddress: string): Promise<bigint> {
    const result = await db
      .select()
      .from(userNonces)
      .where(eq(userNonces.userAddress, userAddress))
      .limit(1);
    
    return result[0]?.highestNonce ?? 0n;
  }

  async validateAndUpdateNonce(userAddress: string, nonce: bigint): Promise<boolean> {
    const currentNonce = await this.getUserNonce(userAddress);
    
    // Nonce must be strictly greater than current highest nonce
    if (nonce <= currentNonce) {
      return false;
    }
    
    // Update or insert the new highest nonce
    const existing = await db
      .select()
      .from(userNonces)
      .where(eq(userNonces.userAddress, userAddress))
      .limit(1);
    
    if (existing[0]) {
      await db
        .update(userNonces)
        .set({ 
          highestNonce: nonce,
          updatedAt: new Date()
        })
        .where(eq(userNonces.userAddress, userAddress));
    } else {
      await db
        .insert(userNonces)
        .values({
          userAddress,
          highestNonce: nonce,
        });
    }
    
    return true;
  }
}

export const storage = new DatabaseStorage();
