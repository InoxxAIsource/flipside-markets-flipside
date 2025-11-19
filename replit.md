# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet, inspired by Polymarket. It enables users to create, trade, and resolve prediction markets on crypto and real-world events. The platform combines trustless blockchain operations with a modern web interface (React, Express, PostgreSQL) to provide a robust and intuitive decentralized prediction market experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The UI/UX is inspired by Polymarket, utilizing shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design with dark/light theme support. Key elements include:
-   **Home Page:** Features a FilterSidebar for filtering by time and categories, a SearchAndSort component, and an optimized 3-column responsive market grid.
-   **Market Cards:** Visually rich, with custom images, automatic crypto logo detection, prominent YES/NO percentages, direct "Buy Yes/No" buttons, and smooth hover effects. Oracle markets display current asset price vs. target price. Each card displays a badge showing market type ([Order Book] or [LP Pool]).
-   **Market Detail Page:** Includes a real-time `CountdownTimer`, an enhanced `PriceChart` with a purple gradient, `OracleInfo` display, and an embedded `TradingView Widget` for live resolution source charts. Conditionally renders either CLOB `OrderBook` interface or AMM `AMMSwapPanel` based on market type.
-   **Image Upload:** Users can upload custom images which are automatically resized, converted to WebP, and previewed.
-   **AI-Powered Analysis:** An "Ask AI" button provides instant market analysis using OpenAI's GPT-4o-mini.
-   **X (Twitter) Auto-Posting:** New markets are automatically posted to X with engaging formats and details.
-   **Trading Interface:** 
    -   **CLOB Markets:** Features a `Buy/Sell Toggle` and full Central Limit Order Book functionality
    -   **AMM Pool Markets:** `AMMSwapPanel` with tabbed interface (Swap/Liquidity):
        -   **Swap Tab:** Real-time quote calculations, slippage protection (0.1%-5% presets), price impact warnings (visual alerts at >5%), constant-sum pricing display (x + y = k), and fee breakdown (2% total: 1.5% LP + 0.5% protocol)
        -   **Liquidity Tab:** Add/remove liquidity panels with percentage quick-select buttons (25%/50%/75%/100%), LP token balance display, pool share percentage, proportional token distribution preview, and informative tips about earning auto-compounded fees
-   **Hybrid Gas Model:** User-pays-gas for deposits/withdrawals/splits/merges, while limit/market orders use gasless (relayer-subsidized) operations via ProxyWallet contracts.
-   **Professional Gitbook-Style Documentation:** A comprehensive technical documentation page with interactive sidebar navigation, scrollspy effect, smooth scrolling, and mobile responsiveness.
-   **Mobile-First Responsive Design:** Complete optimization for mobile (0-639px), tablet (640-1023px), and desktop (1024px+) with adaptive layouts, touch targets, and enhanced category navigation (snap scrolling with gradient hints).

### Technical Implementations

-   **Frontend:** React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state, Ethers.js v6 for Web3.
-   **Backend:** Node.js with Express and TypeScript, Drizzle ORM for PostgreSQL. Includes a WebSocket server for real-time updates.
-   **Blockchain Integration:** Ethereum Sepolia testnet, using ConditionalTokens, MarketFactory, CTFExchange (order book DEX), PythPriceResolver, ProxyWallet (for gasless meta-transactions), and MockUSDT contracts. EIP-712 signed meta-transactions enable gasless trading.
-   **Dual Trading Systems (November 19, 2025):**
    -   **CLOB (Order Book):** Existing system with gasless limit/market orders via CTFExchange and ProxyWallet
    -   **AMM Pool (FIXED):** Constant-sum AMM (x + y = k) for automated market making:
        -   Deployed factory: `AMMPoolFactorySimple` at **0xAe14f8BC192306A891b172A3bc0e91132a4417EF** ✅
        -   Individual AMMPool contracts with LP tokens (ERC20)
        -   Fee structure: 2.0% total (1.5% to LPs auto-compounding, 0.5% to protocol treasury)
        -   Constant-sum formula chosen for better price discovery in binary markets
    -   **✅ CRITICAL BUG FIXED (November 19, 2025):**
        -   **ROOT CAUSE:** AMMPool contract was missing `IERC1155Receiver` interface implementation
        -   **SYMPTOM:** LP Pool creation failed at Step 4 (addLiquidity) with "execution reverted" error code `0x57f447ce`
        -   **FIX APPLIED:** Added `onERC1155Received()`, `onERC1155BatchReceived()`, and `supportsInterface()` to AMMPool.sol
        -   **STATUS:** Contract fixed, compiled, and deployed ✅
        -   **VERIFICATION:** Verified on Sourcify and Routescan
    -   **⚠️ KNOWN ISSUES (Lower priority):**
        -   **SECURITY:** API routes accept raw private keys - must migrate to ProxyWallet/relayer pattern
        -   BigInt precision loss when converting to Number for fee calculations
        -   Missing numeric validation/conversion in API routes
        -   Need to integrate with existing ProxyWallet gasless transaction system
-   **Background Services:** Includes an `Event Indexer` for blockchain sync, a `Pyth Worker` for oracle updates, an `Order Matcher` for trade processing, and a `Rewards Cron` for hourly points recalculation and weekly resets.
-   **Liquidity Mining:** Off-chain rewards system tracks user points for trading volume, market making, and market creation, stored in PostgreSQL and calculated hourly.
-   **AI Integration:** Leverages Replit AI Integrations for OpenAI's GPT-4o-mini via a dedicated backend service.
-   **Social Media Integration:** Uses `twitter-api-v2` for X (Twitter) auto-posting, including image uploads and smart hashtag generation.
-   **Image Processing:** `Sharp` library on the backend for image resizing, WebP conversion, and validation.
-   **WalletConnect Integration:** Supports mobile wallets via WalletConnect alongside MetaMask for desktop.

### System Design Choices

-   **Data-first Hierarchy:** Emphasizes efficient data management and retrieval.
-   **Mobile-first Responsiveness:** Ensures optimal experience across devices.
-   **PostgreSQL Database:** Managed via Drizzle ORM, storing user, market, order, and rewards data, tracking both off-chain and on-chain states.
-   **Scalability:** Designed with distinct frontend and backend services for modularity.

## External Dependencies

### Third-Party Services

-   **Pyth Network Oracle:** For real-time price feeds and market resolution on Sepolia.
-   **Ethereum Sepolia Testnet:** The blockchain environment for smart contracts.
-   **OpenAI (via Replit AI Integrations):** Powers AI-driven market analysis.
-   **WalletConnect:** For mobile wallet integration.

### Database

-   **PostgreSQL via Neon:** Serverless PostgreSQL solution.

### Key NPM Packages

-   **Frontend:** `@radix-ui/*`, `@tanstack/react-query`, `ethers`, `react-hook-form`, `zod`, `recharts`, `date-fns`, `wouter`.
-   **Backend:** `drizzle-orm`, `express`, `ws`, `bcryptjs`, `connect-pg-simple`, `twitter-api-v2`, `multer`, `sharp`.

### Environment Configuration (Examples)

-   `DATABASE_URL`
-   `NODE_ENV`
-   `SESSION_SECRET`
-   `ALCHEMY_API_KEY`
-   `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`
-   `VITE_WALLETCONNECT_PROJECT_ID`