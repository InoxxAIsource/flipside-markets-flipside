# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet, inspired by Polymarket. It enables users to create, trade, and resolve prediction markets on crypto and real-world events. The platform offers a comprehensive prediction market solution with features like dual trading systems (CLOB and AMM), AI-powered analysis, and social media integration. Its purpose is to combine trustless blockchain operations with a modern web interface to provide a robust and intuitive decentralized prediction market experience, aiming for a significant presence in the decentralized finance space.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### November 21, 2025 - WebSocket Real-Time Updates with Polling Fallback ✅

**Feature Built:** Production-ready WebSocket implementation with intelligent polling fallback

**What Was Built:**
1. **WebSocket Hook (`useMarketWebSocket.ts`):** Frontend hook for real-time order book updates
   - Auto-connects to `/ws` endpoint (no authentication required)
   - Subscribes to market-specific updates via JSON messages
   - Auto-reconnects on disconnect (3s delay)
   - Returns connection state (boolean) for components to check status
   - Invalidates React Query caches when orders match/fill using predicate matching

2. **Intelligent Polling Fallback:**
   - 5-second polling activates ONLY when WebSocket disconnected
   - When WebSocket connected → Real-time updates only, no polling
   - Uses connection state to dynamically control `refetchInterval`
   - Ensures data freshness even if WebSocket fails

3. **Query Invalidation Strategy:**
   - Market queries: Predicate matches all `['/api/markets', marketId, ...]` queries
   - User queries: Predicate matches any query key containing `/api/users`, `/api/portfolio`, `/api/proxy`, `/api/positions`
   - Triggers automatic React Query refetch across all relevant pages

4. **Order Matching Behavior (CTF mechanics):**
   - **Buy YES** matches with **Sell YES** (same outcome, opposite side)
   - **Buy NO** matches with **Sell NO** (same outcome, opposite side)
   - **Buy YES** and **Buy NO** do NOT match (different outcomes)

**Technical Implementation:**
- `client/src/hooks/useMarketWebSocket.ts` - WebSocket hook with connection state
- `client/src/components/TradingPanel.tsx` - Integrated WebSocket + polling fallback
- `server/routes.ts` - Backend broadcasts via `broadcastOrderBookUpdate`
- Connection state tracked with `useState` (not `useRef`) to trigger re-renders

**How It Works:**
1. Component calls `useMarketWebSocket(marketId)` → Returns boolean connection state
2. WebSocket connects → Sets `isConnected = true` → Polling disabled
3. Order placed/filled → Backend broadcasts → Frontend invalidates queries → UI updates instantly
4. WebSocket disconnects → Sets `isConnected = false` → Polling activates
5. Auto-reconnect attempts every 3s until connection restored

**Files Modified:**
- `client/src/hooks/useMarketWebSocket.ts` - Created WebSocket hook with state management
- `client/src/components/TradingPanel.tsx` - Added WebSocket integration with polling fallback

### November 21, 2025 - Quick Sell Feature with Instant Balance Display ✅

**Feature Built:** One-click position selling from Profile and Portfolio pages with instant balance feedback (Polymarket-style UX)

**What Was Built:**
1. **URL Parameter System:** Market pages accept query parameters to pre-fill trading form
   - Format: `/market/{id}?action=sell&outcome=yes&size=100&balance=100`
   - Strict validation: Only accepts valid `action` (buy|sell), `outcome` (yes|no), positive numeric `size`, and positive numeric `balance`
   - Invalid parameters are coerced to `null` and ignored for security

2. **Trading Panel Pre-Fill with Instant Balance:**
   - Accepts optional props: `prefillAction`, `prefillOutcome`, `prefillSize`, `prefillBalance`
   - Auto-populates form fields on component mount
   - **Shows balance immediately** from URL param (no "0 shares" flicker)
   - Blockchain data fetches in background and updates balance within 1-2 seconds
   - Shows "Quick Sell" badge ONLY when all required parameters are valid
   - Badge prevents user confusion about form state

3. **Profile Page Sell Buttons:**
   - Each position card displays "Sell" button for YES/NO shares (if > 0)
   - Button navigates to market with pre-filled sell form including balance
   - Clicking button routes to: `/market/{marketId}?action=sell&outcome={yes|no}&size={shares}&balance={shares}`

4. **Portfolio Page Sell Buttons:**
   - Separate "Sell YES" and "Sell NO" buttons on each position card
   - Uses `e.stopPropagation()` to prevent card click navigation
   - Same URL parameter logic as Profile page
   - Only shows buttons for outcomes where user has shares > 0

**User Flow:**
1. User navigates to Profile or Portfolio page
2. Sees position with 217 YES shares
3. Clicks "Sell YES" button
4. Instantly routes to `/market/{id}?action=sell&outcome=yes&size=217&balance=217`
5. Trading panel opens with:
   - "Sell" side pre-selected
   - "YES" outcome pre-selected
   - Size: "217" pre-filled
   - **Balance: "217" shown immediately** (no loading delay)
   - "Quick Sell" badge visible (orange background)
6. Blockchain validates balance in background (~1-2s)
7. User sets price and executes trade immediately

**Security Features:**
- URL parameter validation prevents injection attacks
- Only accepts whitelisted values for action/outcome
- Size and balance must be positive numeric values
- Malformed URLs gracefully fall back to default form state
- Balance prefill is display-only; actual trades require blockchain signature (cannot be spoofed)

**Technical Implementation:**
- `client/src/pages/MarketPage.tsx` - URL param parsing with validation for balance
- `client/src/components/TradingPanel.tsx` - Pre-fill logic, instant balance display, and badge
- `client/src/pages/Profile.tsx` - Added "Sell" buttons with balance param
- `client/src/pages/Portfolio.tsx` - Added "Sell YES/NO" buttons with balance param

**Files Modified:**
- `client/src/pages/MarketPage.tsx` - Added balance parameter parsing and validation
- `client/src/components/TradingPanel.tsx` - Added prefillBalance prop and instant balance initialization
- `client/src/pages/Profile.tsx` - Added sell buttons with balance parameter
- `client/src/pages/Portfolio.tsx` - Added sell buttons with balance parameter and stopPropagation

### November 20, 2025 - Google Search Console Integration & SEO Enhancement ✅

**Feature Built:** Complete Google Search Console integration with comprehensive SEO optimization

**What Was Built:**
1. **Google Verification System:** Environment variable-based meta tag system (`VITE_GOOGLE_SITE_VERIFICATION`) in index.html for Search Console ownership verification
2. **Dynamic Sitemap.xml:** Auto-generated XML sitemap at `/sitemap.xml` listing all active markets and key pages with proper priorities, change frequencies, and last modified dates
3. **Robots.txt:** Search engine crawler guidance at `/robots.txt` with sitemap reference and crawl rules
4. **Market Page SEO:** Comprehensive meta tags for each market page using react-helmet-async:
   - Title tags with market question
   - Meta descriptions with market details
   - Open Graph tags for Facebook/LinkedIn sharing (og:image only if market has custom image)
   - Twitter Card tags for Twitter sharing (twitter:image only if market has custom image)
   - JSON-LD structured data (schema.org Product type) for rich search results
5. **Custom Domain URLs:** All SEO URLs use production domain `https://flipside.exchange` for consistency

**Technical Implementation:**
- `client/index.html` - Google verification meta tag with environment variable placeholder
- `server/routes.ts` - Added `/sitemap.xml` and `/robots.txt` endpoints
- `client/src/pages/MarketPage.tsx` - Dynamic SEO meta tags with Helmet (renders even during loading state)
- `client/src/App.tsx` - Wrapped app with HelmetProvider for meta tag management
- Sitemap includes static pages (home, create, portfolio, leaderboard, docs) and all active markets
- Markets have highest priority (0.9) with hourly change frequency for freshness
- JSON-LD structured data helps Google display rich snippets in search results
- og:image and twitter:image conditionally rendered only when markets have custom images (prevents 404s)

**Setup Instructions:**
1. Visit [Google Search Console](https://search.google.com/search-console/welcome)
2. Add property for `https://flipside.exchange`
3. Choose "HTML tag" verification method
4. Copy the verification code (content value from meta tag)
5. **REQUIRED:** Add to Replit Secrets: `VITE_GOOGLE_SITE_VERIFICATION=your_code_here`
   - Without this, verification meta tag will show as `%VITE_GOOGLE_SITE_VERIFICATION%` in HTML
   - Required for Google to verify domain ownership
   - Must be prefixed with `VITE_` to be accessible in frontend build
6. Deploy and click "Verify" in Search Console
7. Submit sitemap URL: `https://flipside.exchange/sitemap.xml`

**Important Notes:**
- SEO meta tags render in initial HTML during loading state (crawler-friendly)
- Markets with custom images include og:image tags; markets without images omit og:image to prevent 404s
- JSON-LD structured data uses schema.org Product type for enhanced search results
- Sitemap auto-updates as new markets are created (no manual regeneration needed)

**Files Modified:**
- `client/index.html` - Added Google verification meta tag placeholder
- `server/routes.ts` - Added sitemap.xml and robots.txt endpoints
- `client/src/App.tsx` - Wrapped with HelmetProvider
- `client/src/pages/MarketPage.tsx` - Added comprehensive SEO meta tags with conditional rendering

## System Architecture

### UI/UX Decisions

The UI/UX, inspired by Polymarket, utilizes shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design with dark/light theme support. Key elements include: a Home Page with a FilterSidebar, SearchAndSort, and an optimized 3-column market grid; visually rich Market Cards with custom images, crypto logo detection, and direct trading buttons; a Market Detail Page with a real-time CountdownTimer, enhanced PriceChart, OracleInfo, and an embedded TradingView Widget, conditionally rendering CLOB OrderBook or AMM AMMSwapPanel. Other features include an "Ask AI" button for market analysis, optional X (Twitter) posting for market creation, a Hybrid Gas Model using gasless operations for orders, and professional Gitbook-style documentation. The design is mobile-first responsive.

### Technical Implementations

The frontend uses React 18, TypeScript, Vite, Wouter for routing, TanStack Query, and Ethers.js v6. The backend is Node.js with Express and TypeScript, utilizing Drizzle ORM for PostgreSQL and including a WebSocket server for real-time updates. Blockchain integration is on Ethereum Sepolia testnet, using ConditionalTokens, MarketFactory, CTFExchange, PythPriceResolver, ProxyWallet, and MockUSDT contracts, with EIP-712 signed meta-transactions for gasless trading. Dual trading systems include CLOB (Order Book) with gasless limit/market orders and AMM Pool (x + y = k) via `AMMPoolFactorySimple` with LP tokens and a 2.0% fee structure. Background services include an Event Indexer, Pyth Worker, Order Matcher, and Rewards Cron. AI integration leverages OpenAI's GPT-4o-mini, social media integration uses `twitter-api-v2`, and image processing uses the `Sharp` library. WalletConnect is integrated for mobile wallet support.

### System Design Choices

The architecture follows a data-first hierarchy, ensuring efficient data management. It emphasizes mobile-first responsiveness for optimal cross-device experience. PostgreSQL, managed via Drizzle ORM, stores all critical data. The system is designed for scalability with distinct frontend and backend services.

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