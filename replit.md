# Prediction Market Platform

## Overview

This project is a full-stack prediction market platform, enabling users to create, trade, and resolve prediction markets on real-world events. Built on Ethereum's Sepolia testnet, it leverages seven deployed smart contracts and features a modern web interface inspired by Polymarket. The platform integrates blockchain technology for trustless market operations with a traditional web stack (React, Express, PostgreSQL) to offer a seamless user experience. The business vision is to provide a robust and intuitive platform for decentralized prediction markets, tapping into the growing interest in blockchain-based forecasting.

## Recent Updates (November 14, 2025)

### Production CLOB Infrastructure - Phase 1 Completed ✅

Successfully implemented off-chain CLOB foundation (7 major components):
1. On-chain market creation via MarketFactory
2. Nonce management for replay protection
3. Price-time priority matching engine
4. Market depth calculator with quality metrics
5. WebSocket real-time feeds
6. Event indexer and Pyth oracle integration
7. Database schema for orders, fills, positions

**Status:** Backend CLOB engine operational. Ready for smart contract upgrade.

### Smart Contract Deployment Plan - Phase 2 (In Progress)

**Decision:** Deploy full Polymarket-style contracts with Auth system for production CLOB.

**Current Issue:** Deployed CTFExchange (0x09E6D42eF37975968c892b60D631CFE08f299FEA) is simplified/permissionless version without Auth system needed for production operator-based trading.

**Solution:** Deploy complete Polymarket contract suite:
- **CTFExchange** (with AccessControl: admin/operator roles)
- **NegRiskAdapter** (automatic order settlement)
- **FeeController** (fee distribution)
- **ProxyFactory + ProxyWallet** (meta-transactions)
- **MarketRegistry** (auto-register markets)

**Goals:**
1. Clean CLOB execution matching Polymarket
2. Automatic on-chain order settlement
3. Operator authorization for relayer
4. Seamless market creation
5. Full production feature parity

**Next Steps:** Research Polymarket contracts → Create deployment scripts → Deploy & configure roles → Update backend integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state management, and Ethers.js v6 for Web3 integration. It uses shadcn/ui (Radix UI primitives) and Tailwind CSS with custom design tokens for a UI inspired by Polymarket and other trading platforms, supporting dark/light themes. Key design principles include a data-first hierarchy, mobile-first responsiveness, and financial trading UI patterns. State management utilizes React Query for API data and custom hooks for wallet and theme.

### Backend Architecture

The backend uses Node.js with Express and TypeScript, Drizzle ORM for PostgreSQL interactions, and a WebSocket server for real-time updates. It features RESTful APIs and WebSocket channels for live order book data. Background services include an `Event Indexer` for syncing blockchain events, a `Pyth Worker` for price feed updates and automated market resolution, and an `Order Matcher` for processing trades. The architecture follows a service layer pattern and uses shared schema definitions.

### Database Architecture

The database is PostgreSQL, accessed via Drizzle ORM. Core tables include `users`, `markets`, `orders`, `orderFills`, `positions`, and `pythPriceUpdates`. Indexing strategies are implemented for efficient querying of markets, user portfolios, and order relationships. The data model tracks both off-chain and on-chain market states, supporting real-time price calculation and position tracking.

### Blockchain Integration

The platform operates on the Ethereum Sepolia testnet with seven key smart contracts: ConditionalTokens, MarketFactory, CTFExchange (order book DEX), PythPriceResolver (oracle-based resolution), FeeDistributor, ProxyWallet (for gasless meta-transactions), and MockUSDT. Client-side Web3 integration uses Ethers.js, while the server uses a read-only provider for event listening. A gasless trading system is implemented via a ProxyWallet contract and a relayer service that executes EIP-712 signed meta-transactions. Event synchronization is handled by a background indexer broadcasting real-time updates.

## External Dependencies

### Third-Party Services

-   **Pyth Network Oracle:** Provides real-time price feeds for market resolution on Sepolia testnet.
-   **Ethereum Sepolia Testnet:** Public testnet for smart contract deployment and interaction.

### Database

-   **PostgreSQL via Neon:** Serverless PostgreSQL for data storage, using HTTP-based connections.

### NPM Packages (Key Dependencies)

-   **Frontend:** `@radix-ui/*`, `@tanstack/react-query`, `ethers`, `react-hook-form`, `zod`, `recharts`, `date-fns`.
-   **Backend:** `drizzle-orm`, `express`, `ws`, `bcryptjs`, `connect-pg-simple`.
-   **Build Tools:** `vite`, `esbuild`, `tsx`, `tailwindcss`.

### Environment Configuration

-   **Required:** `DATABASE_URL`, `NODE_ENV`, `SESSION_SECRET`.
-   **Optional:** `ALCHEMY_API_KEY` (for Alchemy RPC integration).