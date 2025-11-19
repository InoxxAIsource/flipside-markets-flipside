import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, bigint, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with secure password storage
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  passwordHash: text("password_hash"), // Hashed password for optional email/password login
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Markets table - prediction market definitions
export const markets = pgTable("markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  description: text("description"),
  imageUrl: text("image_url"), // Optional market image URL
  category: text("category").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  outcome: boolean("outcome"), // true = YES, false = NO, null = unresolved
  
  // Market type - CLOB or AMM Pool
  marketType: text("market_type").notNull().default('CLOB'), // 'CLOB' or 'POOL'
  
  // Current market prices (derived from order book or AMM pool)
  yesPrice: real("yes_price").notNull().default(0.5),
  noPrice: real("no_price").notNull().default(0.5),
  
  // Market statistics
  volume: real("volume").notNull().default(0), // Total trading volume in USDT
  liquidity: real("liquidity").notNull().default(0), // Total liquidity pool
  
  // Creator and contract info
  creatorAddress: text("creator_address").notNull(),
  conditionId: text("condition_id"), // ConditionalTokens condition ID
  yesTokenId: text("yes_token_id"), // Token ID for YES outcome
  noTokenId: text("no_token_id"), // Token ID for NO outcome
  creationTxHash: text("creation_tx_hash"), // Transaction hash of market creation
  
  // AMM Pool specific fields
  poolAddress: text("pool_address"), // AMM Pool contract address (only for POOL markets)
  
  // On-chain metadata (from ConditionPreparation event)
  questionId: text("question_id"), // Keccak256 hash of question + timestamp
  questionTimestamp: text("question_timestamp"), // Timestamp used to generate questionId (stored as string for precision)
  oracle: text("oracle"), // Oracle address for market resolution
  outcomeSlotCount: integer("outcome_slot_count").default(2), // Number of outcomes (always 2 for binary)
  
  // Pyth integration for automated resolution
  pythPriceFeedId: text("pyth_price_feed_id"), // Pyth price feed identifier
  baselinePrice: real("baseline_price"), // Reference price for resolution
  targetPrice: real("target_price"), // Target price threshold extracted from question (e.g., 97000 for "Will BTC hit $97,000?")
  
  // Social media integration
  tweetUrl: text("tweet_url"), // URL of auto-posted tweet on X (Twitter)
  
  // AI analysis
  aiAnalysis: text("ai_analysis"), // JSON string containing AI analysis results
  
  // Status
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  categoryIdx: index("markets_category_idx").on(table.category),
  expiresAtIdx: index("markets_expires_at_idx").on(table.expiresAt),
  resolvedIdx: index("markets_resolved_idx").on(table.resolved),
  marketTypeIdx: index("markets_market_type_idx").on(table.marketType),
}));

// Orders table - limit orders for trading
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id, { onDelete: 'cascade' }),
  tokenId: text("token_id").notNull(), // ConditionalTokens token ID (YES or NO outcome)
  
  // Order details
  makerAddress: text("maker_address").notNull(), // User placing the order
  side: text("side").notNull(), // 'buy' or 'sell'
  outcome: boolean("outcome").notNull(), // true = YES, false = NO
  price: real("price").notNull(), // Price per share (0-1)
  size: real("size").notNull(), // Number of shares
  filled: real("filled").notNull().default(0), // Amount filled
  
  // EIP-712 signature data
  signature: text("signature").notNull(), // Maker's signature
  salt: text("salt").notNull(), // Random salt for uniqueness
  nonce: bigint("nonce", { mode: 'bigint' }).notNull(),
  expiration: timestamp("expiration").notNull(),
  
  // Order status
  status: text("status").notNull().default('open'), // 'open', 'filled', 'cancelled', 'expired'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  marketIdx: index("orders_market_idx").on(table.marketId),
  makerIdx: index("orders_maker_idx").on(table.makerAddress),
  statusIdx: index("orders_status_idx").on(table.status),
}));

// Order fills - tracks executed trades
export const orderFills = pgTable("order_fills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  marketId: varchar("market_id").notNull().references(() => markets.id, { onDelete: 'cascade' }),
  
  // Trade participants
  makerAddress: text("maker_address").notNull(),
  takerAddress: text("taker_address").notNull(),
  
  // Trade details
  outcome: boolean("outcome").notNull(),
  price: real("price").notNull(),
  size: real("size").notNull(),
  
  // Blockchain transaction
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  orderIdx: index("fills_order_idx").on(table.orderId),
  marketIdx: index("fills_market_idx").on(table.marketId),
  makerIdx: index("fills_maker_idx").on(table.makerAddress),
  takerIdx: index("fills_taker_idx").on(table.takerAddress),
}));

// AMM Swaps - tracks all swap transactions in AMM pools
export const ammSwaps = pgTable("amm_swaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id, { onDelete: 'cascade' }),
  poolAddress: text("pool_address").notNull(), // AMM pool contract address
  
  // Swap participant
  userAddress: text("user_address").notNull(),
  
  // Swap details
  buyYes: boolean("buy_yes").notNull(), // true = buying YES, false = buying NO
  amountIn: real("amount_in").notNull(), // Amount of tokens sent
  amountOut: real("amount_out").notNull(), // Amount of tokens received
  lpFee: real("lp_fee").notNull(), // Fee paid to LPs
  protocolFee: real("protocol_fee").notNull(), // Fee paid to protocol
  
  // Blockchain transaction (optional - not all events include these)
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  marketIdx: index("amm_swaps_market_idx").on(table.marketId),
  poolIdx: index("amm_swaps_pool_idx").on(table.poolAddress),
  userIdx: index("amm_swaps_user_idx").on(table.userAddress),
  txHashIdx: index("amm_swaps_tx_hash_idx").on(table.txHash),
}));

// LP Positions - tracks liquidity provider holdings in AMM pools
export const lpPositions = pgTable("lp_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id, { onDelete: 'cascade' }),
  userAddress: text("user_address").notNull(),
  
  // LP token holdings
  lpTokenBalance: real("lp_token_balance").notNull().default(0), // Amount of LP tokens owned
  
  // Position statistics
  sharePercent: real("share_percent").notNull().default(0), // Percentage of total pool
  yesReserveShare: real("yes_reserve_share").notNull().default(0), // User's share of YES reserves
  noReserveShare: real("no_reserve_share").notNull().default(0), // User's share of NO reserves
  
  // Tracking
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  marketIdx: index("lp_positions_market_idx").on(table.marketId),
  userIdx: index("lp_positions_user_idx").on(table.userAddress),
}));

// User positions - tracks user's holdings in each market
export const positions = pgTable("positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAddress: text("user_address").notNull(),
  marketId: varchar("market_id").notNull().references(() => markets.id, { onDelete: 'cascade' }),
  
  // Position details
  yesShares: real("yes_shares").notNull().default(0),
  noShares: real("no_shares").notNull().default(0),
  totalInvested: real("total_invested").notNull().default(0),
  realizedPnl: real("realized_pnl").notNull().default(0), // Profit/loss from closed positions
  
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdx: index("positions_user_idx").on(table.userAddress),
  marketIdx: index("positions_market_idx").on(table.marketId),
  userMarketIdx: index("positions_user_market_idx").on(table.userAddress, table.marketId),
}));

// Pyth price updates - logs price feed updates for resolution
export const pythPriceUpdates = pgTable("pyth_price_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  priceFeedId: text("price_feed_id").notNull(),
  
  // Price data
  price: real("price").notNull(),
  confidence: real("confidence").notNull(),
  exponent: integer("exponent").notNull(),
  publishTime: timestamp("publish_time").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  feedIdx: index("pyth_feed_idx").on(table.priceFeedId),
  publishTimeIdx: index("pyth_publish_time_idx").on(table.publishTime),
}));

// User nonces - tracks highest nonce per user to prevent replay attacks
export const userNonces = pgTable("user_nonces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAddress: text("user_address").notNull().unique(),
  highestNonce: bigint("highest_nonce", { mode: 'bigint' }).notNull().default(sql`'0'::bigint`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdx: index("user_nonces_user_idx").on(table.userAddress),
}));

// Rewards points - tracks user rewards from liquidity mining
export const rewardsPoints = pgTable("rewards_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAddress: text("user_address").notNull().unique(),
  
  // Points data
  totalPoints: real("total_points").notNull().default(0),
  weeklyPoints: real("weekly_points").notNull().default(0),
  rank: integer("rank"),
  
  // Trading stats
  totalVolume: real("total_volume").notNull().default(0),
  tradesCount: integer("trades_count").notNull().default(0),
  marketsCreated: integer("markets_created").notNull().default(0),
  
  // Metadata
  lastTradeAt: timestamp("last_trade_at"),
  weekStartsAt: timestamp("week_starts_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdx: index("rewards_points_user_idx").on(table.userAddress),
  rankIdx: index("rewards_points_rank_idx").on(table.rank),
  totalPointsIdx: index("rewards_points_total_idx").on(table.totalPoints),
}));

// Rewards history - logs individual reward events
export const rewardsHistory = pgTable("rewards_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAddress: text("user_address").notNull(),
  
  // Reward details
  points: real("points").notNull(),
  reason: text("reason").notNull(), // 'trade_volume', 'market_making', 'market_creation', 'streak_bonus'
  metadata: text("metadata"), // JSON string with additional context
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  userIdx: index("rewards_history_user_idx").on(table.userAddress),
  createdAtIdx: index("rewards_history_created_at_idx").on(table.createdAt),
  reasonIdx: index("rewards_history_reason_idx").on(table.reason),
}));

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMarketSchema = createInsertSchema(markets).omit({
  id: true,
  createdAt: true,
  volume: true,
  liquidity: true,
  yesPrice: true,
  noPrice: true,
  resolved: true,
  resolvedAt: true,
  outcome: true,
}).extend({
  expiresAt: z.coerce.date(),
  questionTimestamp: z.string().optional(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  filled: true,
  status: true,
}).extend({
  price: z.coerce.number().min(0.01).max(0.99),
  size: z.coerce.number().positive(),
  side: z.enum(['buy', 'sell']),
  nonce: z.coerce.bigint(),
  expiration: z.coerce.date(),
});

export const insertOrderFillSchema = createInsertSchema(orderFills).omit({
  id: true,
  createdAt: true,
});

export const insertAmmSwapSchema = createInsertSchema(ammSwaps).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  updatedAt: true,
});

export const insertPythPriceUpdateSchema = createInsertSchema(pythPriceUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertUserNonceSchema = createInsertSchema(userNonces).omit({
  id: true,
  updatedAt: true,
});

export const insertRewardsPointsSchema = createInsertSchema(rewardsPoints).omit({
  id: true,
  updatedAt: true,
  rank: true,
});

export const insertRewardsHistorySchema = createInsertSchema(rewardsHistory).omit({
  id: true,
  createdAt: true,
});

export const insertLPPositionSchema = createInsertSchema(lpPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Market = typeof markets.$inferSelect;
export type InsertMarket = z.infer<typeof insertMarketSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderFill = typeof orderFills.$inferSelect;
export type InsertOrderFill = z.infer<typeof insertOrderFillSchema>;

export type AmmSwap = typeof ammSwaps.$inferSelect;
export type InsertAmmSwap = z.infer<typeof insertAmmSwapSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type LPPosition = typeof lpPositions.$inferSelect;
export type InsertLPPosition = z.infer<typeof insertLPPositionSchema>;

export type PythPriceUpdate = typeof pythPriceUpdates.$inferSelect;
export type InsertPythPriceUpdate = z.infer<typeof insertPythPriceUpdateSchema>;

export type UserNonce = typeof userNonces.$inferSelect;
export type InsertUserNonce = z.infer<typeof insertUserNonceSchema>;

export type RewardsPoints = typeof rewardsPoints.$inferSelect;
export type InsertRewardsPoints = z.infer<typeof insertRewardsPointsSchema>;

export type RewardsHistory = typeof rewardsHistory.$inferSelect;
export type InsertRewardsHistory = z.infer<typeof insertRewardsHistorySchema>;
