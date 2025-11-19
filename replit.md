# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet, inspired by Polymarket. It enables users to create, trade, and resolve prediction markets on crypto and real-world events. The platform combines trustless blockchain operations with a modern web interface (React, Express, PostgreSQL) to provide a robust and intuitive decentralized prediction market experience.

## Recent Updates

### November 19, 2025 - AMM Trading Interface Fix ✅

**Issue Fixed:** Pool markets incorrectly displayed both AMM swap panel AND order book interface
- **Problem:** Pool market pages showed "$10" prices and "no shares available" errors from the order book UI
- **Root Cause:** MarketPage component rendered both TradingPanel (CLOB) and AMMSwapPanel for pool markets
- **Solution:** Added conditional rendering to hide TradingPanel for POOL markets, enhanced pool info API
- **Changes Made:**
  1. MarketPage.tsx - Gate TradingPanel to only render for CLOB markets
  2. ammService.ts - Enhanced getPoolInfo() to fetch on-chain prices via getYesPrice() and calculate totalLiquidity
  3. abis.ts - Added missing getYesPrice() function to AMMPool ABI
- **Status:** ✅ Verified via E2E test - pool markets now show only AMM interface with correct pricing

**Testing Results:**
- Pool reserves display correctly ($20.00 YES, $20.00 NO for 50/50 pool)
- Prices show as percentages (50¢ each = 50%)
- No order book elements visible on pool markets
- API returns proper data: yesPrice, noPrice, totalLiquidity, lpTokenAddress

### November 19, 2025 - LP Pool Bug Fix & Deployment ✅

**Critical Bug Fixed:** AMMPool ERC1155Receiver Implementation
- **Issue:** LP Pool market creation failed at Step 4 (addLiquidity) with error code `0x57f447ce` ("execution reverted")
- **Root Cause:** AMMPool.sol missing `IERC1155Receiver` interface required to receive YES/NO tokens (ERC1155)
- **Solution:** Added complete ERC1155Receiver implementation with `onERC1155Received()`, `onERC1155BatchReceived()`, and `supportsInterface()` methods
- **Deployment:** New AMMPoolFactorySimple deployed to **0xAe14f8BC192306A891b172A3bc0e91132a4417EF**
- **Verification:**
  - Sourcify: [View Contract](https://repo.sourcify.dev/contracts/full_match/11155111/0xAe14f8BC192306A891b172A3bc0e91132a4417EF/)
  - Routescan: [Sepolia Explorer](https://sepolia.etherscan.io/address/0xAe14f8BC192306A891b172A3bc0e91132a4417EF)
- **Status:** Ready for testing - LP Pool markets can now be created successfully

**How to Test:**
1. Navigate to `/create` page
2. Select "LP Pool (AMM)" as market type
3. Fill in market details and initial liquidity (e.g., 10 USDT each for YES/NO)
4. Submit and watch console logs for 4-step liquidity process
5. Expected result: "✅ Liquidity addition completed successfully!" with no errors

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
-   **Dual Trading Systems:**
    -   **CLOB (Order Book):** Traditional order book with gasless limit/market orders via CTFExchange and ProxyWallet meta-transactions
    -   **AMM Pool:** Constant-sum AMM (x + y = k) for automated market making
        -   Factory: `AMMPoolFactorySimple` at `0xAe14f8BC192306A891b172A3bc0e91132a4417EF` (Sepolia)
        -   Individual AMMPool contracts with LP tokens (ERC20)
        -   Fee structure: 2.0% total (1.5% to LPs auto-compounding, 0.5% to protocol treasury)
        -   Constant-sum formula (x + y = k) chosen for better price discovery in binary markets
        -   ERC1155Receiver interface implemented for token handling
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

## Smart Contract Deployments (Sepolia Testnet)

### Core Infrastructure
- **ConditionalTokens:** `0xdC8CB01c328795C007879B2C030AbF1c1b580D84`
- **MockUSDT:** `0xAf24D4DDbA993F6b11372528C678edb718a097Aa`
- **MarketFactory:** (CLOB markets)
- **CTFExchange:** (Order book DEX)
- **ProxyWallet Factory:** `0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2`
- **ProxyWallet Implementation:** `0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7`

### AMM Pool System
- **AMMPoolFactorySimple:** `0xAe14f8BC192306A891b172A3bc0e91132a4417EF`
  - [View on Sourcify](https://repo.sourcify.dev/contracts/full_match/11155111/0xAe14f8BC192306A891b172A3bc0e91132a4417EF/)
  - [View on Routescan](https://sepolia.etherscan.io/address/0xAe14f8BC192306A891b172A3bc0e91132a4417EF)
  - Deployed: November 19, 2025
  - Status: Active ✅

### Oracle & Resolution
- **PythPriceResolver:** (Oracle-based market resolution)
- **Pyth Network:** Real-time price feeds on Sepolia

## Known Issues & Future Enhancements

### Security Improvements (High Priority)
- **AMM API Security:** Current AMM API routes accept raw private keys - must migrate to ProxyWallet/relayer pattern for gasless transactions (similar to CLOB markets)

### Technical Debt (Medium Priority)
- BigInt precision loss when converting to Number for fee calculations in AMM contracts
- Missing numeric validation/conversion in API routes
- Need to fully integrate AMM system with existing ProxyWallet gasless transaction infrastructure

### Future Enhancements (Low Priority)
- Enhanced slippage protection mechanisms for AMM swaps
- Advanced LP rewards tracking and analytics
- Multi-collateral support (currently USDT-only)
- Cross-chain deployment capabilities