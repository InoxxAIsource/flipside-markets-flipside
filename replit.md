# Flipside

## Overview

Flipside is a full-stack prediction market platform on the Ethereum Sepolia testnet, inspired by Polymarket. It enables users to create, trade, and resolve prediction markets on crypto and real-world events. The platform combines trustless blockchain operations with a modern web interface to provide a robust and intuitive decentralized prediction market experience. Its purpose is to offer a comprehensive prediction market solution with features like dual trading systems (CLOB and AMM), AI-powered analysis, and social media integration, aiming for a significant presence in the decentralized finance space.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The UI/UX is inspired by Polymarket, utilizing shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design with dark/light theme support. Key elements include:
-   **Home Page:** Features a FilterSidebar, SearchAndSort, and an optimized 3-column responsive market grid.
-   **Market Cards:** Visually rich, with custom images, automatic crypto logo detection, prominent YES/NO percentages, direct "Buy Yes/No" buttons, and smooth hover effects. Displays market type ([Order Book] or [LP Pool]).
-   **Market Detail Page:** Includes a real-time `CountdownTimer`, an enhanced `PriceChart`, `OracleInfo` display, and an embedded `TradingView Widget`. Conditionally renders either CLOB `OrderBook` interface or AMM `AMMSwapPanel` based on market type.
-   **Image Upload:** Users can upload custom images which are automatically resized, converted to WebP, and previewed.
-   **AI-Powered Analysis:** An "Ask AI" button provides instant market analysis using OpenAI's GPT-4o-mini.
-   **X (Twitter) Auto-Posting:** New markets are automatically posted to X with engaging formats and details.
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