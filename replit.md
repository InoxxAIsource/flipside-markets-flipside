# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet, inspired by Polymarket. It enables users to create, trade, and resolve prediction markets on crypto and real-world events. The platform combines trustless blockchain operations with a modern web interface to provide a robust and intuitive decentralized prediction market experience. Its purpose is to offer a comprehensive prediction market solution with features like dual trading systems (CLOB and AMM), AI-powered analysis, and social media integration, aiming for a significant presence in the decentralized finance space.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### November 20, 2025 - Position Merge & Redemption Tracking ✅

**Feature Built:** Complete transaction history tracking for position merges and redemptions

**What Was Built:**
1. **Database Schema:** Created `position_merges` table to track all merge and redeem transactions with columns for marketId, userAddress, conditionId, yesAmount, noAmount, collateralReceived, txHash, and blockNumber
2. **Event Indexer Integration:** Added blockchain event listeners for `PositionsMerge` and `PayoutRedemption` events from ConditionalTokens contract (0xdC8CB01c328795C007879B2C030AbF1c1b580D84)
3. **Storage Layer Methods:** Implemented `createPositionMerge()`, `getUserPositionMerges()`, and `getMarketPositionMerges()` for data persistence and retrieval
4. **API Endpoint:** Created `GET /api/positions/merges/:userAddress` to fetch complete merge/redeem history by wallet address
5. **Portfolio UI Enhancement:** Updated Portfolio page History tab with "Position Merges & Redemptions" section showing chronological list of all merge/redeem transactions

**Transaction Types Tracked:**
- **Position Merges:** When users combine equal amounts of YES and NO tokens back into USDT collateral (via "Sell All" feature)
- **Payout Redemptions:** When users redeem winning positions after market resolution to claim their USDT winnings

**Technical Implementation:**
- EventIndexer subscribes to both PositionsMerge and PayoutRedemption events and normalizes amounts
- Database schema uses yesAmount, noAmount, and collateralReceived to track all transaction details
- Frontend differentiates between merge and redeem operations based on token amounts
- Full blockchain-to-UI pipeline ensures complete transaction visibility

**Files Modified:**
- `shared/schema.ts` - Added position_merges table schema
- `server/storage.ts` - Added storage methods for merge tracking
- `server/services/eventIndexer.ts` - Added event listeners for merge/redeem events
- `server/contracts/web3Service.ts` - Added ConditionalTokens ABI with merge events
- `server/routes.ts` - Added API endpoint for fetching merge history
- `client/src/pages/Portfolio.tsx` - Enhanced History tab with merge/redeem section

### November 20, 2025 - Mobile Wallet Connection & Wallet Selector ✅

**Feature Built:** Complete mobile wallet integration with intelligent wallet selection

**What Was Built:**
1. **Mobile Detection System:** Automatic device detection that adapts connection flow (QR modal on desktop, deep links on mobile)
2. **Wallet Selector Dialog:** Beautiful modal with popular wallet options including MetaMask, WalletConnect, Trust Wallet, Rainbow, and Coinbase Wallet
3. **Smart Deep Linking:** Mobile wallets open directly via deep links (`trust://wc`, `rainbow://wc`, `cbwallet://wc`) instead of showing confusing QR codes
4. **Universal Support:** Works seamlessly on desktop browser extensions and mobile wallet apps
5. **Improved UX:** Clear wallet icons, descriptions, and connection status with proper error handling

**Technical Implementation:**
- Device detection utilities (`isMobile()`, `isIOS()`, `isAndroid()`, `canUseMetaMask()`)
- WalletConnect configuration auto-adapts based on device type
- Explicit wallet selection via `connectWalletById()` function
- Web3Provider extended with `setProvider()` for external wallet connections
- WalletConnect Project ID properly configured from environment secrets

**Connection Flow:**
- **Desktop**: Click "Connect" → Choose wallet → Browser extension opens → Approve
- **Mobile**: Click "Connect" → Choose wallet → Redirects to wallet app → Approve → Returns to site

**Files Modified:**
- `client/src/lib/device.ts` - Device detection utilities (new)
- `client/src/lib/web3modal.ts` - Mobile-optimized WalletConnect config
- `client/src/lib/web3.ts` - Wallet-specific connection functions with deep linking
- `client/src/components/WalletSelector.tsx` - Wallet selection modal UI (new)
- `client/src/components/WalletButton.tsx` - Integration with wallet selector
- `client/src/contexts/Web3Provider.tsx` - Extended context with setProvider method

### November 20, 2025 - Optional Twitter Posting & Custom Domain URLs ✅

**Feature Built:** User-controlled Twitter/X posting with custom domain integration

**What Was Built:**
1. **Optional Twitter Toggle:** Added Switch component to market creation form allowing users to choose whether to post new markets to Twitter/X
2. **Consistent Behavior:** Both CLOB and AMM Pool market types respect the postToTwitter flag
3. **Custom Domain URLs:** Changed tweet URLs from Replit domain to flipside.exchange custom domain for professional branding
4. **Default Behavior:** Toggle defaults to OFF (unchecked), putting users in control of social media sharing

**User Experience:**
- Market creators see "Post to X (Twitter)" switch on the creation form
- Toggling ON automatically posts market to connected Twitter account upon successful creation
- Toggling OFF skips Twitter posting entirely
- Works for both Order Book (CLOB) and LP Pool (AMM) market types

**Technical Implementation:**
- Frontend: `postToTwitter` boolean field in CreateMarketForm schema with Switch UI component
- Data flow: Form field → CreateMarket mutation → Backend API via spread operator
- Backend: Both `/api/markets` and `/api/markets/pool` routes extract flag and conditionally call `postMarketToTwitter()`
- URL handling: Hardcoded `https://flipside.exchange` base URL for all tweet links
- Database: Tweet URLs saved to market records for tracking

**Files Modified:**
- `client/src/components/CreateMarketForm.tsx` - Added postToTwitter field and Switch UI
- `server/routes.ts` - Updated both market creation routes with conditional Twitter posting logic

## System Architecture

### UI/UX Decisions

The UI/UX is inspired by Polymarket, utilizing shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design with dark/light theme support. Key elements include:
-   **Home Page:** Features a FilterSidebar, SearchAndSort, and an optimized 3-column responsive market grid.
-   **Market Cards:** Visually rich, with custom images, automatic crypto logo detection, prominent YES/NO percentages, direct "Buy Yes/No" buttons, and smooth hover effects. Displays market type ([Order Book] or [LP Pool]).
-   **Market Detail Page:** Includes a real-time `CountdownTimer`, an enhanced `PriceChart`, `OracleInfo` display, and an embedded `TradingView Widget`. Conditionally renders either CLOB `OrderBook` interface or AMM `AMMSwapPanel` based on market type.
-   **Image Upload:** Users can upload custom images which are automatically resized, converted to WebP, and previewed.
-   **AI-Powered Analysis:** An "Ask AI" button provides instant market analysis using OpenAI's GPT-4o-mini.
-   **X (Twitter) Optional Posting:** Market creators can optionally share new markets to X via a toggle switch on the creation form. Tweet URLs use the custom domain flipside.exchange.
-   **Trading Interface:**
    -   **CLOB Markets:** Features a `Buy/Sell Toggle` and full Central Limit Order Book functionality.
    -   **AMM Pool Markets:** `AMMSwapPanel` with tabbed interface (Swap/Liquidity) offering real-time quote calculations, slippage protection, price impact warnings, constant-sum pricing display, and fee breakdown. Liquidity tab includes add/remove panels, LP token balance, pool share, and proportional token distribution preview.
-   **Hybrid Gas Model:** User-pays-gas for deposits/withdrawals/splits/merges, while limit/market orders use gasless (relayer-subsidized) operations via ProxyWallet contracts.
-   **Professional Gitbook-Style Documentation:** A comprehensive technical documentation page with interactive sidebar navigation.
-   **Mobile-First Responsive Design:** Complete optimization for mobile, tablet, and desktop with adaptive layouts.

### Technical Implementations

-   **Frontend:** React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state, Ethers.js v6 for Web3.
-   **Backend:** Node.js with Express and TypeScript, Drizzle ORM for PostgreSQL. Includes a WebSocket server for real-time updates.
-   **Blockchain Integration:** Ethereum Sepolia testnet, using ConditionalTokens, MarketFactory, CTFExchange (order book DEX), PythPriceResolver, ProxyWallet, and MockUSDT contracts. EIP-712 signed meta-transactions enable gasless trading.
-   **Dual Trading Systems:**
    -   **CLOB (Order Book):** Traditional order book with gasless limit/market orders via CTFExchange and ProxyWallet meta-transactions.
    -   **AMM Pool:** Constant-sum AMM (x + y = k) for automated market making via `AMMPoolFactorySimple` (0xAe14f8BC192306A891b172A3bc0e91132a4417EF). Features individual AMMPool contracts with LP tokens (ERC20), a 2.0% total fee (1.5% to LPs, 0.5% to protocol treasury), and ERC1155Receiver implementation for token handling.
-   **Background Services:** Includes an `Event Indexer` for blockchain sync, a `Pyth Worker` for oracle updates, an `Order Matcher` for trade processing, and a `Rewards Cron` for hourly points recalculation.
-   **Liquidity Mining:** Off-chain rewards system tracks user points for trading volume, market making, and market creation, stored in PostgreSQL.
-   **AI Integration:** Leverages Replit AI Integrations for OpenAI's GPT-4o-mini via a dedicated backend service.
-   **Social Media Integration:** Uses `twitter-api-v2` for X (Twitter) auto-posting.
-   **Image Processing:** `Sharp` library on the backend for image resizing, WebP conversion, and validation.
-   **WalletConnect Integration:** Supports mobile wallets via WalletConnect alongside MetaMask.

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

### Smart Contract Deployments (Sepolia Testnet)

-   **ConditionalTokens:** `0xdC8CB01c328795C007879B2C030AbF1c1b580D84`
-   **MockUSDT:** `0xAf24D4DDbA993F6b11372528C678edb718a097Aa`
-   **ProxyWallet Factory:** `0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2`
-   **AMMPoolFactorySimple:** `0xAe14f8BC192306A891b172A3bc0e91132a4417EF`