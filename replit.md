# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet. It allows users to create, trade, and resolve prediction markets on crypto and real-world events. Inspired by Polymarket, Flipside combines trustless blockchain operations with a modern web interface and a seamless traditional web stack (React, Express, PostgreSQL). The project aims to provide a robust and intuitive platform for decentralized prediction markets.

## Recent Changes

### November 17, 2025
- **WalletConnect Integration**: Added mobile wallet support for trading on any browser
  - **Hybrid Wallet System**: Auto-detects browser type and shows appropriate connection method
  - **Mobile Support**: Users on mobile browsers (Chrome, Safari) can now connect via WalletConnect QR code scanning
  - **Desktop Support**: Maintains MetaMask extension support, with WalletConnect as alternative option
  - **Event Synchronization**: Properly handles account changes, chain switches, and disconnections from both MetaMask and WalletConnect
  - **Implementation**: Uses `@walletconnect/ethereum-provider` with custom event bridge for unified state management
  - **Project ID**: Configured via `VITE_WALLETCONNECT_PROJECT_ID` environment variable
- **Liquidity Mining Rewards System**: Implemented comprehensive off-chain rewards program to incentivize trading and market creation
  - **Points System**: 1 point per $1 traded, 2x multiplier for market makers (limit orders), 10% bonus for market creators
  - **Leaderboard**: Public leaderboard showing top traders ranked by total points at `/leaderboard`
  - **Rewards Dashboard**: User profile now includes rewards tab showing total points, global rank, weekly points, and trading stats
  - **Database Schema**: Added `rewardsPoints` and `rewardsHistory` tables tracking user rewards and point history
  - **Automated Recalculation**: Hourly cron job recalculates all user points from order fills, weekly reset on Sundays
  - **API Endpoints**: `/api/rewards/leaderboard`, `/api/rewards/user/:address`, `/api/rewards/history/:address`
  - **Trophy Icon Navigation**: Added leaderboard link to top navigation bar

### November 16, 2025
- **Polymarket-Style Share Price Formatting**: Updated all share price displays to use cents (50¢) instead of decimals ($0.50)
  - MarketCard buy buttons now show "Buy Yes 50¢" instead of "Buy Yes 50%"
  - Order book displays share prices as "50¢" instead of "$0.50"
  - Trading interface, charts, and all portfolio/profile pages use cent formatting
  - Oracle markets continue to show full dollar prices (e.g., $95,432.18 for BTC)
  - Implemented via new `formatSharePrice()` utility function in `client/src/lib/priceParser.ts`
- **Oracle Price Display Enhancement**: Added Polymarket-style live price display for all oracle markets (crypto, gold, silver)
  - Market cards now show current asset price vs target price instead of YES/NO percentages for oracle markets
  - Detail pages display real-time prices with "PRICE TO BEAT" vs "CURRENT PRICE" layout
  - Charts show actual asset price history with target reference lines
  - Prices auto-refresh every 30 seconds on cards, 10 seconds on detail pages
- **New Pyth Price Feeds Added**:
  - XRP/USD: `0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8`
  - BNB/USD: `0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f`
  - Silver (XAG/USD): `0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e`

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The UI/UX is inspired by Polymarket and other trading platforms, utilizing shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design with dark/light theme support. Key features include:

-   **Market Cards:** Redesigned to be visually rich, featuring custom images, automatic crypto logo detection (BTC, ETH, SOL, XRP, BNB, DOGE, ADA, MATIC), prominent YES/NO percentages, and direct "Buy Yes/No" buttons.
-   **Market Detail Page:** Includes a real-time `CountdownTimer`, an enhanced `PriceChart` with a purple gradient and optional baseline reference for Pyth markets, `OracleInfo` display, and embedded `TradingView Widget` for live price charts of resolution sources.
-   **Image Upload:** Users can upload custom images for markets, which are automatically resized (800x450px), converted to WebP, and previewed live.
-   **AI-Powered Market Analysis:** An "Ask AI" button on market cards provides instant analysis including YES probability, confidence levels, and detailed reasoning, utilizing OpenAI's GPT-4o-mini.
-   **X (Twitter) Auto-Posting:** New markets are automatically posted to X with engaging tweet formats, market details, images, and smart hashtags.
-   **Trading Interface:** Features a `Buy/Sell Toggle` for clearer action selection, and a complete CLOB (Central Limit Order Book) functionality.
-   **Hybrid Gas Model:** User-pays-gas for deposits/withdrawals/splits/merges, and gasless (relayer-subsidized) operations for limit/market orders via ProxyWallet contracts.

### Technical Implementations

-   **Frontend:** Built with React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state management, and Ethers.js v6 for Web3 integration.
-   **Backend:** Node.js with Express and TypeScript, utilizing Drizzle ORM for PostgreSQL interactions. Includes a WebSocket server for real-time updates.
-   **Blockchain Integration:** Operates on the Ethereum Sepolia testnet, using ConditionalTokens, MarketFactory, CTFExchange (order book DEX), PythPriceResolver, FeeDistributor (code exists but not deployed), ProxyWallet (for gasless meta-transactions), and MockUSDT smart contracts. EIP-712 signed meta-transactions are used for gasless trading. **Note**: Fee collection is calculated but not enforced on testnet; FeeDistributor contract deployment pending for mainnet.
-   **Background Services:** Includes an `Event Indexer` for blockchain event syncing, a `Pyth Worker` for oracle updates and market resolution, an `Order Matcher` for trade processing, and a `Rewards Cron` for hourly points recalculation and weekly resets.
-   **Liquidity Mining:** Off-chain rewards system tracking user points based on trading volume, market making activity, and market creation. Points stored in PostgreSQL and calculated hourly from historical order fills.
-   **AI Integration:** Leverages Replit AI Integrations for OpenAI's GPT-4o-mini via a dedicated backend service (`server/services/aiAnalysis.ts`).
-   **Social Media Integration:** Uses `twitter-api-v2` library for X (Twitter) auto-posting, including image uploads and smart hashtag generation.
-   **Image Processing:** `Sharp` library is used on the backend for image resizing, format conversion (to WebP), and validation during uploads.

### System Design Choices

-   **Data-first Hierarchy:** Prioritizes efficient data management and retrieval.
-   **Mobile-first Responsiveness:** Ensures optimal viewing and interaction across various devices.
-   **PostgreSQL Database:** Managed via Drizzle ORM, storing core data for users, markets, orders, order fills, positions, Pyth price updates, and rewards (points, history, rankings), tracking both off-chain and on-chain states.
-   **Scalability:** Designed with distinct frontend and backend services for modularity and scalability.

## External Dependencies

### Third-Party Services

-   **Pyth Network Oracle:** For real-time price feeds and market resolution on Sepolia.
-   **Ethereum Sepolia Testnet:** The blockchain environment for smart contracts.
-   **OpenAI (via Replit AI Integrations):** Powers AI-driven market analysis.

### Database

-   **PostgreSQL via Neon:** Serverless PostgreSQL solution.

### Key NPM Packages

-   **Frontend:** `@radix-ui/*`, `@tanstack/react-query`, `ethers`, `react-hook-form`, `zod`, `recharts`, `date-fns`, `wouter`.
-   **Backend:** `drizzle-orm`, `express`, `ws`, `bcryptjs`, `connect-pg-simple`, `twitter-api-v2`, `multer`, `sharp`.

### Environment Configuration

-   `DATABASE_URL`
-   `NODE_ENV`
-   `SESSION_SECRET`
-   `ALCHEMY_API_KEY` (Optional)
-   `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` (For X/Twitter integration)