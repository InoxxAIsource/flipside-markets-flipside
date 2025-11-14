# Prediction Market Platform

## Overview

This project is a full-stack prediction market platform, enabling users to create, trade, and resolve prediction markets on real-world events. Built on Ethereum's Sepolia testnet, it leverages seven deployed smart contracts and features a modern web interface inspired by Polymarket. The platform integrates blockchain technology for trustless market operations with a traditional web stack (React, Express, PostgreSQL) to offer a seamless user experience. The business vision is to provide a robust and intuitive platform for decentralized prediction markets, tapping into the growing interest in blockchain-based forecasting.

## Recent Updates (November 14, 2025)

### Smart Contract Deployment - Phase 2 Completed ✅

Successfully deployed complete Polymarket-style contract suite to Sepolia testnet:

**Deployed Contracts:**
- **MockUSDT:** 0xAf24D4DDbA993F6b11372528C678edb718a097Aa (6-decimal collateral token)
- **ConditionalTokens:** 0xdC8CB01c328795C007879B2C030AbF1c1b580D84 (Gnosis CTF for YES/NO tokens)
- **ProxyWallet Impl:** 0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7 (Gasless trading template)
- **ProxyWalletFactory:** 0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2 (CREATE2 deterministic wallets)
- **CTFExchange:** 0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3 (CLOB with OPERATOR_ROLE)

**Technical Achievements:**
1. ✅ Minimal Solidity contracts (MockUSDT, ConditionalTokens, ProxyWallet, ProxyWalletFactory, CTFExchange)
2. ✅ Hardhat v3 configuration with Node.js 22 compatibility
3. ✅ Successful Sepolia deployment via hardhat-toolbox-mocha-ethers
4. ✅ ProxyWalletFactory implementation configured
5. ✅ Contract addresses exported to `server/config/contracts.ts`

**Status:** Production CLOB infrastructure complete. Backend integration pending.

**Next Steps:**
1. Grant OPERATOR_ROLE to relayer (0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0)
2. Integrate deployed addresses into backend services
3. Test split/merge operations with live contracts
4. Enable frontend trading with proxy wallet system

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