# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet. It allows users to create, trade, and resolve prediction markets on crypto and real-world events. Inspired by Polymarket, Flipside combines trustless blockchain operations with a modern web interface and a seamless traditional web stack (React, Express, PostgreSQL). The project aims to provide a robust and intuitive platform for decentralized prediction markets.

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
-   **Blockchain Integration:** Operates on the Ethereum Sepolia testnet, using ConditionalTokens, MarketFactory, CTFExchange (order book DEX), PythPriceResolver, FeeDistributor, ProxyWallet (for gasless meta-transactions), and MockUSDT smart contracts. EIP-712 signed meta-transactions are used for gasless trading.
-   **Background Services:** Includes an `Event Indexer` for blockchain event syncing, a `Pyth Worker` for oracle updates and market resolution, and an `Order Matcher` for trade processing.
-   **AI Integration:** Leverages Replit AI Integrations for OpenAI's GPT-4o-mini via a dedicated backend service (`server/services/aiAnalysis.ts`).
-   **Social Media Integration:** Uses `twitter-api-v2` library for X (Twitter) auto-posting, including image uploads and smart hashtag generation.
-   **Image Processing:** `Sharp` library is used on the backend for image resizing, format conversion (to WebP), and validation during uploads.

### System Design Choices

-   **Data-first Hierarchy:** Prioritizes efficient data management and retrieval.
-   **Mobile-first Responsiveness:** Ensures optimal viewing and interaction across various devices.
-   **PostgreSQL Database:** Managed via Drizzle ORM, storing core data for users, markets, orders, order fills, positions, and Pyth price updates, tracking both off-chain and on-chain states.
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