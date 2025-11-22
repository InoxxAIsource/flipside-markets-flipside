# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet, inspired by Polymarket. It enables users to create, trade, and resolve prediction markets on crypto and real-world events. The platform offers a comprehensive prediction market solution with features like dual trading systems (CLOB and AMM), AI-powered analysis, and social media integration. Its purpose is to combine trustless blockchain operations with a modern web interface to provide a robust and intuitive decentralized prediction market experience, aiming for a significant presence in the decentralized finance space.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The UI/UX, inspired by Polymarket, utilizes shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design with dark/light theme support. Key elements include: a Home Page with a FilterSidebar, SearchAndSort, and an optimized 3-column market grid; visually rich Market Cards with custom images, crypto logo detection, and direct trading buttons; a Market Detail Page with a real-time CountdownTimer, enhanced PriceChart, OracleInfo, and an embedded TradingView Widget, conditionally rendering CLOB OrderBook or AMM AMMSwapPanel. Other features include an "Ask AI" button for market analysis, optional X (Twitter) posting for market creation, a Hybrid Gas Model using gasless operations for orders, and professional Gitbook-style documentation. The design is mobile-first responsive.

### Technical Implementations

The frontend uses React 18, TypeScript, Vite, Wouter for routing, TanStack Query, and Ethers.js v6. The backend is Node.js with Express and TypeScript, utilizing Drizzle ORM for PostgreSQL and including a WebSocket server for real-time updates. Blockchain integration is on Ethereum Sepolia testnet, using ConditionalTokens, MarketFactory, CTFExchange, PythPriceResolver, ProxyWallet, and MockUSDT contracts, with EIP-712 signed meta-transactions for gasless trading. Dual trading systems include CLOB (Order Book) with gasless limit/market orders and AMM Pool (x + y = k) via `AMMPoolFactorySimple` with LP tokens and a 2.0% fee structure. Background services include an Event Indexer, Pyth Worker, Order Matcher, and Rewards Cron. AI integration leverages OpenAI's GPT-4o-mini, social media integration uses `twitter-api-v2`, and image processing uses the `Sharp` library. WalletConnect is integrated for mobile wallet support. Advanced order types (Fill-or-Kill, Stop-Loss, Good-til-Cancelled) are implemented with backend services for monitoring and validation, and a WebSocket real-time update system with polling fallback ensures data freshness. A "Quick Sell" feature allows one-click position selling with instant balance display from Profile and Portfolio pages. Comprehensive SEO optimization includes Google Search Console integration, dynamic sitemap.xml, robots.txt, and dynamic meta tags for market pages.

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