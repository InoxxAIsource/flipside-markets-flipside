CREATE TABLE "amm_swaps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" varchar NOT NULL,
	"pool_address" text NOT NULL,
	"user_address" text NOT NULL,
	"buy_yes" boolean NOT NULL,
	"amount_in" real NOT NULL,
	"amount_out" real NOT NULL,
	"lp_fee" real NOT NULL,
	"protocol_fee" real NOT NULL,
	"tx_hash" text,
	"block_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lp_positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" varchar NOT NULL,
	"user_address" text NOT NULL,
	"lp_token_balance" real DEFAULT 0 NOT NULL,
	"share_percent" real DEFAULT 0 NOT NULL,
	"yes_reserve_share" real DEFAULT 0 NOT NULL,
	"no_reserve_share" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"description" text,
	"image_url" text,
	"category" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"outcome" boolean,
	"market_type" text DEFAULT 'CLOB' NOT NULL,
	"yes_price" real DEFAULT 0.5 NOT NULL,
	"no_price" real DEFAULT 0.5 NOT NULL,
	"volume" real DEFAULT 0 NOT NULL,
	"liquidity" real DEFAULT 0 NOT NULL,
	"creator_address" text NOT NULL,
	"condition_id" text,
	"yes_token_id" text,
	"no_token_id" text,
	"creation_tx_hash" text,
	"pool_address" text,
	"question_id" text,
	"question_timestamp" text,
	"oracle" text,
	"outcome_slot_count" integer DEFAULT 2,
	"pyth_price_feed_id" text,
	"baseline_price" real,
	"target_price" real,
	"tweet_url" text,
	"ai_analysis" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_fills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"market_id" varchar NOT NULL,
	"maker_address" text NOT NULL,
	"taker_address" text NOT NULL,
	"outcome" boolean NOT NULL,
	"price" real NOT NULL,
	"size" real NOT NULL,
	"tx_hash" text,
	"block_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" varchar NOT NULL,
	"token_id" text NOT NULL,
	"maker_address" text NOT NULL,
	"side" text NOT NULL,
	"outcome" boolean NOT NULL,
	"price" real NOT NULL,
	"size" real NOT NULL,
	"filled" real DEFAULT 0 NOT NULL,
	"signature" text NOT NULL,
	"salt" text NOT NULL,
	"nonce" bigint NOT NULL,
	"expiration" timestamp NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_merges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" varchar NOT NULL,
	"user_address" text NOT NULL,
	"condition_id" text NOT NULL,
	"yes_amount" real DEFAULT 0 NOT NULL,
	"no_amount" real DEFAULT 0 NOT NULL,
	"collateral_received" real NOT NULL,
	"tx_hash" text NOT NULL,
	"block_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"market_id" varchar NOT NULL,
	"yes_shares" real DEFAULT 0 NOT NULL,
	"no_shares" real DEFAULT 0 NOT NULL,
	"total_invested" real DEFAULT 0 NOT NULL,
	"realized_pnl" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pyth_price_updates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_feed_id" text NOT NULL,
	"price" real NOT NULL,
	"confidence" real NOT NULL,
	"exponent" integer NOT NULL,
	"publish_time" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"points" real NOT NULL,
	"reason" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards_points" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"total_points" real DEFAULT 0 NOT NULL,
	"weekly_points" real DEFAULT 0 NOT NULL,
	"rank" integer,
	"total_volume" real DEFAULT 0 NOT NULL,
	"trades_count" integer DEFAULT 0 NOT NULL,
	"markets_created" integer DEFAULT 0 NOT NULL,
	"last_trade_at" timestamp,
	"week_starts_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rewards_points_user_address_unique" UNIQUE("user_address")
);
--> statement-breakpoint
CREATE TABLE "user_nonces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" text NOT NULL,
	"highest_nonce" bigint DEFAULT '0'::bigint NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_nonces_user_address_unique" UNIQUE("user_address")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"username" text,
	"password_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "amm_swaps" ADD CONSTRAINT "amm_swaps_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lp_positions" ADD CONSTRAINT "lp_positions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_fills" ADD CONSTRAINT "order_fills_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_fills" ADD CONSTRAINT "order_fills_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_merges" ADD CONSTRAINT "position_merges_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "amm_swaps_market_idx" ON "amm_swaps" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "amm_swaps_pool_idx" ON "amm_swaps" USING btree ("pool_address");--> statement-breakpoint
CREATE INDEX "amm_swaps_user_idx" ON "amm_swaps" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "amm_swaps_tx_hash_idx" ON "amm_swaps" USING btree ("tx_hash");--> statement-breakpoint
CREATE INDEX "lp_positions_market_idx" ON "lp_positions" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "lp_positions_user_idx" ON "lp_positions" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "markets_category_idx" ON "markets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "markets_expires_at_idx" ON "markets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "markets_resolved_idx" ON "markets" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "markets_market_type_idx" ON "markets" USING btree ("market_type");--> statement-breakpoint
CREATE INDEX "fills_order_idx" ON "order_fills" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "fills_market_idx" ON "order_fills" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "fills_maker_idx" ON "order_fills" USING btree ("maker_address");--> statement-breakpoint
CREATE INDEX "fills_taker_idx" ON "order_fills" USING btree ("taker_address");--> statement-breakpoint
CREATE INDEX "orders_market_idx" ON "orders" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "orders_maker_idx" ON "orders" USING btree ("maker_address");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "position_merges_market_idx" ON "position_merges" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "position_merges_user_idx" ON "position_merges" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "position_merges_tx_hash_idx" ON "position_merges" USING btree ("tx_hash");--> statement-breakpoint
CREATE INDEX "positions_user_idx" ON "positions" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "positions_market_idx" ON "positions" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "positions_user_market_idx" ON "positions" USING btree ("user_address","market_id");--> statement-breakpoint
CREATE INDEX "pyth_feed_idx" ON "pyth_price_updates" USING btree ("price_feed_id");--> statement-breakpoint
CREATE INDEX "pyth_publish_time_idx" ON "pyth_price_updates" USING btree ("publish_time");--> statement-breakpoint
CREATE INDEX "rewards_history_user_idx" ON "rewards_history" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "rewards_history_created_at_idx" ON "rewards_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rewards_history_reason_idx" ON "rewards_history" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "rewards_points_user_idx" ON "rewards_points" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "rewards_points_rank_idx" ON "rewards_points" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "rewards_points_total_idx" ON "rewards_points" USING btree ("total_points");--> statement-breakpoint
CREATE INDEX "user_nonces_user_idx" ON "user_nonces" USING btree ("user_address");