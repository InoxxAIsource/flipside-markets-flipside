# Prediction Market Platform

## Overview

This project is a full-stack prediction market platform on the Ethereum Sepolia testnet, enabling users to create, trade, and resolve prediction markets on real-world events. It features a modern web interface inspired by Polymarket, integrated with a blockchain backend. The platform's purpose is to offer a robust and intuitive decentralized prediction market experience, combining trustless blockchain operations with a seamless traditional web stack (React, Express, PostgreSQL).

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates (November 15, 2025)

### ✅ Sell Order EIP-712 Signature Bug Fixed

**Critical Bug:**
- Sell orders were failing with "Invalid order signature" error
- Root cause: EIP-712 signature hardcoded `side: 0` (buy) on line 218 of TradingPanel.tsx
- When placing sell orders, signature was signed with `side: 0` but backend expected `side: 1`
- Backend signature verification failed due to mismatch

**Fix Applied:**
- Changed line 221: `side: orderSide === 'buy' ? 0 : 1`
- Now correctly signs:
  - Buy orders with `side: 0`
  - Sell orders with `side: 1`
- EIP-712 signature now matches backend validation expectations

**Impact:**
- Users can now successfully place both buy AND sell limit orders
- Order matching fully functional: Buy YES + Sell YES can match at same price
- Complete CLOB (Central Limit Order Book) functionality restored

### ✅ Buy/Sell Toggle UI Added

**Enhancement:**
- Added two-button toggle for Buy/Sell action selection
- Logical two-tier selection: Action (Buy/Sell) → Outcome (YES/NO)
- Submit button dynamically updates: "Buy YES", "Sell NO", etc.
- Matches Polymarket's UX pattern for improved clarity

## System Architecture

### Frontend Architecture

The frontend is built with React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state management, and Ethers.js v6 for Web3 integration. It uses shadcn/ui (Radix UI primitives) and Tailwind CSS with custom design tokens for a UI inspired by Polymarket, supporting dark/light themes. Key design principles include a data-first hierarchy, mobile-first responsiveness, and financial trading UI patterns.

### Backend Architecture

The backend uses Node.js with Express and TypeScript, Drizzle ORM for PostgreSQL interactions, and a WebSocket server for real-time updates. It provides RESTful APIs and WebSocket channels for live order book data. Background services include an `Event Indexer` for blockchain event syncing, a `Pyth Worker` for oracle updates and market resolution, and an `Order Matcher` for trade processing.

### Database Architecture

The database is PostgreSQL, managed via Drizzle ORM. It includes core tables for `users`, `markets`, `orders`, `orderFills`, `positions`, and `pythPriceUpdates`. The data model tracks both off-chain and on-chain market states to support real-time pricing and position tracking.

### Blockchain Integration

The platform operates on the Ethereum Sepolia testnet, utilizing seven key smart contracts: ConditionalTokens, MarketFactory, CTFExchange (order book DEX), PythPriceResolver, FeeDistributor, ProxyWallet (for gasless meta-transactions), and MockUSDT. Client-side Web3 integration uses Ethers.js, while the server uses a read-only provider for event listening. A gasless trading system is implemented via ProxyWallet contracts and a relayer service for EIP-712 signed meta-transactions.

### UI/UX Decisions

The UI/UX is inspired by Polymarket and other trading platforms, utilizing shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design. Features include a market browse page with filtering, a comprehensive trading interface with order books and price charts, a market creation form, and a portfolio dashboard with order history and position tracking. A hybrid gas model is implemented for transactions, with user-pays-gas for deposits/withdrawals/splits/merges and gasless (relayer-subsidized) operations for limit/market orders.

## External Dependencies

### Third-Party Services

-   **Pyth Network Oracle:** Provides real-time price feeds for market resolution on Sepolia.
-   **Ethereum Sepolia Testnet:** Public testnet for smart contract deployment and interaction.

### Database

-   **PostgreSQL via Neon:** Serverless PostgreSQL for data storage.

### Key NPM Packages

-   **Frontend:** `@radix-ui/*`, `@tanstack/react-query`, `ethers`, `react-hook-form`, `zod`, `recharts`, `date-fns`.
-   **Backend:** `drizzle-orm`, `express`, `ws`, `bcryptjs`, `connect-pg-simple`.

### Environment Configuration

-   **Required:** `DATABASE_URL`, `NODE_ENV`, `SESSION_SECRET`.
-   **Optional:** `ALCHEMY_API_KEY`.