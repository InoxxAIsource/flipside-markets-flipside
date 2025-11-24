# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet, inspired by Polymarket. It enables users to create, trade, and resolve prediction markets on crypto and real-world events. The platform offers a comprehensive prediction market solution with features like dual trading systems (CLOB and AMM), AI-powered analysis, and social media integration. Its purpose is to combine trustless blockchain operations with a modern web interface to provide a robust and intuitive decentralized prediction market experience, aiming for a significant presence in the decentralized finance space.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The UI/UX, inspired by Polymarket, utilizes shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design with dark/light theme support. Key elements include: a Home Page with a FilterSidebar, SearchAndSort, and an optimized 3-column market grid displaying only active markets; an Archived Markets page (`/archived`) with custom sort options ("Most Volume" and "Recently Expired") for browsing expired markets; visually rich Market Cards with custom images, crypto logo detection, direct trading buttons, and **prominent sportsbook odds display** for ESPN sports markets showing real-time spread and over/under betting lines; a Market Detail Page with a real-time CountdownTimer, enhanced PriceChart, OracleInfo, and an embedded TradingView Widget, conditionally rendering CLOB OrderBook or AMM AMMSwapPanel. Other features include an "Ask AI" button for market analysis, optional X (Twitter) posting for market creation, a Hybrid Gas Model using gasless operations for orders, and professional Gitbook-style documentation. The design is mobile-first responsive.

### Technical Implementations

The frontend uses React 18, TypeScript, Vite, Wouter for routing, TanStack Query, and Ethers.js v6. The backend is Node.js with Express and TypeScript, utilizing Drizzle ORM for PostgreSQL and including a WebSocket server for real-time updates. Blockchain integration is on Ethereum Sepolia testnet, using ConditionalTokens, MarketFactory, CTFExchange, PythPriceResolver, ProxyWallet, and MockUSDT contracts, with EIP-712 signed meta-transactions for gasless trading. Dual trading systems include CLOB (Order Book) with gasless limit/market orders and AMM Pool (x + y = k) via `AMMPoolFactorySimple` with LP tokens and a 2.0% fee structure. Background services include an Event Indexer, Pyth Worker, Order Matcher, and Rewards Cron. **ESPN Sports Markets Integration** provides real-time sportsbook odds (spread and over/under) from ESPN BET for NFL, NBA, MLB, NHL, and Soccer events, displaying them prominently on market cards for direct comparison with prediction market prices. AI integration leverages OpenAI's GPT-4o-mini, social media integration uses `twitter-api-v2`, and image processing uses the `Sharp` library. WalletConnect is integrated for mobile wallet support. Advanced order types (Fill-or-Kill, Stop-Loss, Good-til-Cancelled) are implemented with backend services for monitoring and validation, and a WebSocket real-time update system with polling fallback ensures data freshness. A "Quick Sell" feature allows one-click position selling with instant balance display from Profile and Portfolio pages. Comprehensive SEO optimization includes Google Search Console integration, dynamic sitemap.xml, robots.txt, and dynamic meta tags for market pages. **Real Statistics System**: All market metrics (traders count, 24h trades, volume, liquidity) are calculated from actual database queries via `/api/markets/:id/stats` endpoint—no mock or dummy data is used anywhere in the application. **Developer API System**: Monetizable REST API v1 with three-tier pricing (Free: 100 req/hr, Pro $99/mo: 1000 req/hr, Enterprise $500+/mo: unlimited) enabling third-party integrations and institutional adoption. Features bcrypt-hashed API keys with keyPrefix optimization, server-side rate limiting middleware, comprehensive API documentation with Mermaid architecture diagrams, JavaScript/Python/cURL code samples, and SDK examples. Public endpoints provide market data and orderbook access, while authenticated endpoints enable programmatic trading (place/cancel orders, query positions). API Keys management page allows users to generate, view, and revoke keys with usage tracking. Annual revenue potential: $180K-$1.2M based on tier adoption rates. **Automated Market Seeding System**: One-click production deployment via `/admin/seed` protected admin endpoint with wallet-based authentication (configured via `ADMIN_WALLET_ADDRESSES` environment variable), seed data management in `server/seeds/markets.ts`, automatic duplicate prevention, and comprehensive documentation in `MARKET_SEEDING_GUIDE.md`. This eliminates manual SQL execution for deploying new markets to production—admins simply update the seed file, publish the app, and click "Seed Markets" to safely migrate development markets to the live database.

### System Design Choices

The architecture follows a data-first hierarchy, ensuring efficient data management. It emphasizes mobile-first responsiveness for optimal cross-device experience. PostgreSQL, managed via Drizzle ORM, stores all critical data. The system is designed for scalability with distinct frontend and backend services.

## External Dependencies

### Third-Party Services

-   **Pyth Network Oracle:** For real-time price feeds and market resolution on Sepolia.
-   **Ethereum Sepolia Testnet:** The blockchain environment for smart contracts.
-   **OpenAI (via Replit AI Integrations):** Powers AI-driven market analysis.
-   **WalletConnect:** For mobile wallet integration.
-   **ESPN API:** For live sports event data and ESPN BET sportsbook odds (spread, over/under).

### Database

-   **PostgreSQL via Neon:** Serverless PostgreSQL solution.

### Smart Contract Deployments (Sepolia Testnet)

-   **ConditionalTokens:** `0xdC8CB01c328795C007879B2C030AbF1c1b580D84`
-   **MockUSDT:** `0xAf24D4DDbA993F6b11372528C678edb718a097Aa`
-   **ProxyWallet Factory:** `0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2`
-   **AMMPoolFactorySimple:** `0xAe14f8BC192306A891b172A3bc0e91132a4417EF`