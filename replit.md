# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet. Users can create, trade, and resolve prediction markets on crypto and real-world events. With a modern web interface inspired by Polymarket and crypto-native UX patterns, Flipside combines trustless blockchain operations with a seamless traditional web stack (React, Express, PostgreSQL). The name "Flipside" captures the essence of trading - every market has two sides, and users profit by picking the right one.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### November 16, 2025

#### ✅ X (Twitter) Auto-Posting for New Markets

**New Features:**
- **Automatic Social Sharing**: Every new market is automatically posted to X (Twitter)
- **Engaging Tweet Format**: Includes market question, YES/NO percentages, and direct link to trade
- **Image Support**: Automatically uploads and attaches market images to tweets
- **Smart Hashtags**: Category-based hashtag generation (#Crypto, #Sports, #Politics, etc.)
- **Non-Blocking**: Market creation succeeds even if tweet posting fails

**Technical Implementation:**
- **Twitter Service** (`server/services/twitter.ts`):
  - Twitter API v2 client using official twitter-api-v2 library
  - Credential validation with graceful degradation when not configured
  - Smart MIME type detection for WebP/PNG/JPEG images
  - Fetches and uploads market images to Twitter
  - Formats engaging tweets with emojis and structured data
- **Database**:
  - Added `tweet_url` column to markets table to store posted tweet URLs
  - Updated via `ALTER TABLE markets ADD COLUMN tweet_url TEXT`
- **Integration**:
  - Asynchronous posting in POST /api/markets route
  - Updates market with tweet URL after successful post
  - Robust error handling - never blocks market creation

**Tweet Format:**
```
🔮 New market on Flipside!

[Market Question]

Current odds:
✅ YES [X]%
❌ NO [X]%

Trade now: [URL]

#PredictionMarket [category hashtags]
```

**Environment Variables:**
- `TWITTER_API_KEY`: X API key (Consumer Key)
- `TWITTER_API_SECRET`: X API secret (Consumer Secret)
- `TWITTER_ACCESS_TOKEN`: Access token for posting
- `TWITTER_ACCESS_TOKEN_SECRET`: Access token secret

**User Experience:**
- Zero manual work - every market gets instant visibility on X
- Professional-looking tweets with images
- Direct traffic from social media to markets
- Tweet URL stored with market for reference

#### ✅ Image Upload Feature with Automatic Resizing

**New Features:**
- **File Upload System**: Users can now upload custom images directly from their device
- **Automatic Image Processing**: All uploaded images are automatically resized to 800x450px (16:9 aspect ratio)
- **Image Preview**: Live preview of uploaded images before creating market
- **Format Optimization**: Images automatically converted to WebP format for optimal performance

**Technical Implementation:**
- **Backend**: 
  - POST /api/markets/upload-image endpoint with multer middleware
  - Sharp library for high-quality image resizing and format conversion
  - File validation: 5MB max, JPG/PNG/WebP accepted
  - Unique filename generation with timestamp and random suffix
  - Stored in attached_assets/market_images/ directory
- **Frontend**:
  - File upload UI with clear size/format guidance
  - Real-time image preview at 192px height (matches card display)
  - Upload progress indicator with loading states
  - Error handling with toast notifications for invalid files
  - Form schema updated to accept both absolute URLs and relative paths

**User Experience:**
- Click "Upload Image" button to select file from device
- Instant preview after successful upload
- Clear "Remove" button to change selection
- Automatic form field population after upload
- No manual URL entry needed for uploaded images

#### ✅ CallMyBluff-Style Market Cards with Featured Images

**New Features:**
- **Featured Image Support**: Markets now support custom featured images via `imageUrl` field
- **Crypto Logo Auto-Detection**: Automatically detects and displays crypto logos for markets mentioning BTC, ETH, SOL, XRP, BNB, DOGE, ADA, or MATIC
- **Enhanced Card Design**: Redesigned market cards matching CallMyBluff.io's visual style with larger percentages and direct trading buttons

**Database Changes:**
- Added `image_url` column to markets table (optional text field)
- Updated via `ALTER TABLE markets ADD COLUMN image_url TEXT`

**UI Components:**
- Created `cryptoLogos.ts` utility for automatic crypto token detection from market questions
- Supports 8 major cryptocurrencies with react-icons/si logos
- **MarketCard Redesign**:
  - Large featured image area (h-48): Custom image → Crypto logo → Fallback gradient
  - Bold, prominent YES/NO percentages (text-3xl font size)
  - Direct "Buy Yes" and "Buy No" buttons on each card
  - Smart fallback: If custom image fails to load, automatically shows crypto logo or default gradient
  - Buy buttons navigate to market detail with pre-configured action and outcome

**User Experience:**
- Users can upload custom images when creating markets OR paste image URLs
- Crypto-related markets automatically get brand logos without manual configuration
- One-click trading directly from market cards
- Cleaner, more visual market browsing experience

### November 15, 2025

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

### ✅ Polymarket-Inspired UI/UX Enhancements

**New Components:**
- **CountdownTimer**: Real-time expiry countdown in HH:MM:SS format, turns red when < 1 hour remaining
- **Enhanced PriceChart**: Purple gradient line chart (Polymarket style) with optional baseline reference for Pyth markets
- **OracleInfo**: Displays Pyth oracle details (feed ID, baseline price, resolver link) similar to Polymarket's Binance resolver
- **Enhanced MarketCard**: Cleaner layout with countdown timer, volume display, oracle badge, and improved price display
- **TradingView Widget**: Embedded live price chart showing real-time Binance prices for oracle resolution sources

**Integration:**
- Market detail page now shows countdown timer in header
- Price chart displays baseline reference line for Pyth oracle markets
- Oracle information prominently displayed in sidebar with embedded TradingView chart
- Market cards show live countdown, volume, and oracle status badges
- Resolution Source displays live Binance price chart (ETH/USD, BTC/USD, SOL/USD) instead of simple link

**Design Impact:**
- Matches Polymarket's clean, professional aesthetic
- Better information hierarchy and readability
- Real-time updates improve user engagement
- Oracle transparency builds trust in automated resolution
- Live price charts provide context for market resolution criteria

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

## Planned Features

### 🚰 MockUSDT Faucet System (To Be Implemented)

**Overview:**
A smart faucet system to help new users test the platform by automatically offering free test USDT when they need it.

**Smart UX Flow:**
```
User clicks "Buy YES/NO" on market card
  ↓
Is wallet connected? → NO → Show "Connect Wallet" message
  ↓ YES
Check MockUSDT balance in ProxyWallet
  ↓
Balance < 10 USDT? → YES → Show faucet claim dialog
  ↓ NO
Proceed directly to trading panel (no popup)
```

**Key Features:**
- ✅ Only users with **connected wallets** see faucet option
- ✅ Only users with **low/zero MockUSDT** see faucet popup (balance < 10 USDT)
- ✅ Users with **sufficient balance** skip directly to trading
- ✅ Smart blockchain balance detection from ProxyWallet
- ✅ After claiming, balance refreshes and trading continues seamlessly

**Technical Implementation:**

**Smart Contract:** (`contracts/MockUSDTFaucet.sol`)
- ✅ **Completed**: Contract created with 24-hour rate limiting
- Rate limiting: Each wallet can claim **10 USDT every 24 hours**
- Lifetime limit: 100 USDT per wallet maximum
- Security: ReentrancyGuard, CEI pattern, owner controls
- Functions:
  - `requestTokens()`: Main claim function
  - `getTimeUntilNextRequest(address)`: Check cooldown remaining
  - `canRequest(address)`: Check if user is eligible now
  - `getRemainingAllowance(address)`: Check lifetime remaining

**Contract Configuration:**
- Withdrawal amount: 10 USDT (10_000_000 with 6 decimals)
- Lock time: 24 hours (86400 seconds)
- Max total withdrawal: 100 USDT per address
- Connected to: MockUSDT at `0xAf24D4DDbA993F6b11372528C678edb718a097Aa`

**Deployment Steps (Pending):**
1. Deploy `MockUSDTFaucet.sol` to Sepolia testnet
   - Script ready: `deployment/scripts/deployFaucet.ts`
   - Run: `tsx deployment/scripts/deployFaucet.ts`
2. Verify contract on Etherscan
3. Fund faucet with MockUSDT from deployer wallet
4. Add faucet address to `server/config/contracts.ts`

**Frontend Integration (Pending):**
1. Create `useMockUSDTBalance` hook to check ProxyWallet USDT balance
2. Create `FaucetDialog` component with:
   - Claim button
   - Countdown timer showing time until next claim
   - Current balance display
   - Transaction status handling
3. Integrate balance check into `MarketCard.tsx`:
   - Before opening trade panel, check balance
   - If balance < 10 USDT, show faucet dialog
   - If balance >= 10 USDT, open trade panel directly
4. Auto-refresh balance after successful claim

**User Experience:**
- Zero friction for users with tokens
- One-click claim for new users
- No separate faucet page needed
- Contextual help exactly when needed
- Clear countdown timer prevents spam

**Files Created:**
- `contracts/MockUSDTFaucet.sol` - Faucet smart contract
- `deployment/scripts/deployFaucet.ts` - Deployment script

**Next Steps When Resuming:**
1. Deploy faucet contract to Sepolia
2. Fund it with initial MockUSDT supply
3. Build frontend balance detection hook
4. Create faucet dialog UI component
5. Integrate into market card click flow
6. Test end-to-end user experience

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