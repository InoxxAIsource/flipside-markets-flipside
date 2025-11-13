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
  category: text("category").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  outcome: boolean("outcome"), // true = YES, false = NO, null = unresolved
  
  // Current market prices (derived from order book)
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
  
  // Pyth integration for automated resolution
  pythPriceFeedId: text("pyth_price_feed_id"), // Pyth price feed identifier
  baselinePrice: real("baseline_price"), // Reference price for resolution
  
  // Status
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  categoryIdx: index("markets_category_idx").on(table.category),
  expiresAtIdx: index("markets_expires_at_idx").on(table.expiresAt),
  resolvedIdx: index("markets_resolved_idx").on(table.resolved),
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

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  updatedAt: true,
});

export const insertPythPriceUpdateSchema = createInsertSchema(pythPriceUpdates).omit({
  id: true,
  createdAt: true,
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

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type PythPriceUpdate = typeof pythPriceUpdates.$inferSelect;
export type InsertPythPriceUpdate = z.infer<typeof insertPythPriceUpdateSchema>;
