# Prediction Market Platform

## Overview

This project is a full-stack prediction market platform, enabling users to create, trade, and resolve prediction markets on real-world events. Built on Ethereum's Sepolia testnet, it leverages seven deployed smart contracts and features a modern web interface inspired by Polymarket. The platform integrates blockchain technology for trustless market operations with a traditional web stack (React, Express, PostgreSQL) to offer a seamless user experience. The business vision is to provide a robust and intuitive platform for decentralized prediction markets, tapping into the growing interest in blockchain-based forecasting.

## Recent Updates (November 14, 2025)

### Backend Integration - Phase 1 & 2 Completed ✅

Successfully integrated deployed Sepolia contracts with backend services:

**Deployed Contracts:**
- **MockUSDT:** 0xAf24D4DDbA993F6b11372528C678edb718a097Aa (6-decimal collateral token)
- **ConditionalTokens:** 0xdC8CB01c328795C007879B2C030AbF1c1b580D84 (Gnosis CTF for YES/NO tokens)
- **ProxyWallet Impl:** 0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7 (Gasless trading template)
- **ProxyWalletFactory:** 0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2 (CREATE2 deterministic wallets)
- **CTFExchange:** 0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3 (CLOB with OPERATOR_ROLE)
- **Relayer:** 0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0 (OPERATOR_ROLE granted)

**Phase 1 - Contract Integration (✅ Complete):**
1. ✅ Centralized contract addresses in `server/config/contracts.ts`
2. ✅ Refactored web3Service to use deployed contracts only
3. ✅ Removed obsolete contracts (MarketFactory, PythPriceResolver, FeeDistributor)
4. ✅ Updated market creation to use ConditionalTokens.prepareCondition directly
5. ✅ EventIndexer listening to ConditionalTokens events
6. ✅ PythWorker implemented as guarded no-op (pending oracle deployment)

**Phase 2 - ExecutionContext Refactoring (✅ Complete):**
1. ✅ Implemented ExecutionProfile pattern for three contexts:
   - **USER_PROXY**: Gasless meta-transactions via proxy wallet
   - **RELAYER**: Backend relayer executes directly
   - **DIRECT**: User's EOA executes directly
2. ✅ Fixed critical balance check bug (token IDs vs amounts)
3. ✅ Wired up service dependencies (splitMergeService, proxyWalletService, relayerService)
4. ✅ Added getRelayerAddress() to relayerService

**Status:** Backend running successfully with deployed contracts. Ready for frontend integration.

**Next Steps:**
1. Frontend: Market creation form
2. Frontend: Order book trading UI (limit/market orders)
3. Frontend: Wallet connection with proxy wallet system
4. Frontend: User portfolio/positions dashboard
5. End-to-end testing on Sepolia

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