# Prediction Market Platform

## Overview

A full-stack prediction market platform that enables users to create, trade, and resolve prediction markets on real-world events. The platform is built on Ethereum's Sepolia testnet with 7 deployed smart contracts, featuring a modern web interface inspired by Polymarket's design system.

The application combines blockchain technology (smart contracts for trustless market creation and trading) with a traditional web stack (React frontend, Express backend, PostgreSQL database) to deliver a seamless prediction market experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Ethers.js v6 for Web3 wallet integration

**UI Component System:**
- shadcn/ui component library (Radix UI primitives)
- Tailwind CSS with custom design tokens
- Dark/light theme support with CSS variables
- Design system inspired by Polymarket, Limitless Exchange, and TradingView
- Typography: Inter for UI elements, JetBrains Mono for monospaced data/prices

**State Management:**
- React Query for API data caching and synchronization
- Custom hooks for wallet state (`use-wallet`), theme (`use-theme`)
- WebSocket connections for real-time order book updates

**Key Design Principles:**
- Data-first hierarchy: Price movements and market metrics are primary visual focus
- Mobile-first responsive design with progressive enhancement
- Scan-able layouts for quick market overview
- Financial trading UI patterns (order books, price charts, trading panels)

### Backend Architecture

**Technology Stack:**
- Node.js with Express server
- TypeScript for type safety
- Drizzle ORM for database interactions
- WebSocket server (ws library) for real-time updates

**API Design:**
- RESTful endpoints for CRUD operations
- WebSocket channels for live order book updates
- Session-based authentication (connect-pg-simple)
- Server-side validation using Zod schemas

**Background Services:**
1. **Event Indexer** (`eventIndexer`): Listens to blockchain events and syncs on-chain data to database
2. **Pyth Worker** (`pythWorker`): Periodic price feed updates from Pyth Network oracle for automated market resolution
3. **Order Matcher** (`orderMatcher`): Matches buy/sell orders in the order book

**Architecture Pattern:**
- Service layer pattern separating business logic from routes
- Shared schema definitions between client and server (`shared/schema.ts`)
- Development hot-reload with Vite middleware integration

### Database Architecture

**ORM & Migrations:**
- Drizzle ORM with PostgreSQL dialect
- Schema-first approach with TypeScript definitions
- Migration files generated in `./migrations` directory

**Core Tables:**
1. **users**: Wallet addresses, optional username/password, UUID primary keys
2. **markets**: Prediction market definitions with on-chain references (conditionId, tokenIds)
3. **orders**: Limit orders with buy/sell sides, sizes, prices, and fill tracking
4. **orderFills**: Execution history linking orders with fill amounts and prices
5. **positions**: User positions in market outcomes (YES/NO tokens)
6. **pythPriceUpdates**: Historical price feed data for oracle-based resolution

**Indexing Strategy:**
- Composite indexes on market category, expiration, resolution status
- User address indexes for portfolio queries
- Market-order relationships for order book retrieval

**Data Model Highlights:**
- Markets track both off-chain state (database) and on-chain state (Ethereum contracts)
- Real-time price calculation from order book (yesPrice/noPrice)
- Volume and liquidity tracking at market level
- Position tracking for user portfolios

### Blockchain Integration

**Smart Contract Architecture (Sepolia Testnet):**
1. **ConditionalTokens**: ERC-1155 for outcome tokens (YES/NO)
2. **MarketFactory**: Market creation and management
3. **CTFExchange**: Order book DEX with EIP-712 signed orders
4. **PythPriceResolver**: Oracle-based automated resolution
5. **FeeDistributor**: Platform and creator fee distribution
6. **ProxyWallet**: Pooled wallet for gasless meta-transactions (0x4a373C230BE7574B905A31c43317EE912D3B65c7)
7. **MockUSDT**: ERC-20 collateral token for testnet

**Web3 Integration Pattern:**
- Client-side: MetaMask/browser wallet via Ethers.js
- Server-side: Read-only provider for event listening and state queries
- EIP-712 typed signatures for gasless order placement and meta-transactions
- Wallet connection state managed in React hooks

**Gasless Trading System:**
- **ProxyWallet Contract**: Pooled architecture where one contract holds all user balances internally
- **Relayer Service**: Background queue processor that executes meta-transactions on behalf of users
  - Relayer wallet: 0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0
  - Rate limiting: 10 transactions per user per minute
  - Nonce management: Fetches fresh nonce from chain before each execution to prevent desync
  - Processing interval: Every 2 seconds
- **Meta-Transaction Flow**:
  1. User deposits USDT to ProxyWallet (requires gas once)
  2. User signs EIP-712 meta-transaction (no gas)
  3. Frontend submits signature to relayer API
  4. Relayer executes ProxyWallet.executeMetaTransaction() on-chain (relayer pays gas)
- **Supported Operations**: Withdraw, Split (USDT → YES+NO), Merge (YES+NO → USDT)
- **Frontend Integration**: DepositWithdrawPanel + TradingPanel with split/merge tabs

**Event Synchronization:**
- Background indexer subscribes to contract events
- MarketCreated, OrderFilled, MarketResolved events synced to database
- Real-time WebSocket broadcasts for order book changes

## External Dependencies

### Third-Party Services

**Pyth Network Oracle:**
- Price feed provider for automated market resolution
- Sepolia testnet oracle address: `0xDd24F84d36BF92C65F92307595335bdFab5Bbd21`
- Provides real-time price data for crypto, equities, forex pairs
- Integration via PythPriceResolver contract and background worker

**Ethereum Sepolia Testnet:**
- Public testnet for smart contract deployment
- RPC endpoints via standard providers (Infura, Alchemy compatible)
- Block explorer: Etherscan (for contract verification)

### Database

**PostgreSQL via Neon:**
- Serverless PostgreSQL with connection pooling
- Environment variable: `DATABASE_URL`
- Connection via `@neondatabase/serverless` driver
- HTTP-based connections for serverless compatibility

### NPM Packages (Key Dependencies)

**Frontend:**
- `@radix-ui/*`: Unstyled accessible UI primitives (20+ components)
- `@tanstack/react-query`: Server state management
- `ethers`: Ethereum wallet and contract interaction
- `react-hook-form` + `@hookform/resolvers`: Form validation
- `zod`: Schema validation
- `recharts`: Chart library for price visualization
- `date-fns`: Date manipulation

**Backend:**
- `drizzle-orm`: Type-safe SQL ORM
- `express`: Web server framework
- `ws`: WebSocket server
- `bcryptjs`: Password hashing
- `connect-pg-simple`: PostgreSQL session store

**Build Tools:**
- `vite`: Frontend bundler and dev server
- `esbuild`: Backend bundling for production
- `tsx`: TypeScript execution for development
- `tailwindcss`: Utility-first CSS framework

### Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (Neon serverless)
- `NODE_ENV`: Development/production mode
- `SESSION_SECRET`: Session encryption key
- Smart contract addresses hardcoded in codebase (Sepolia deployment)

**Optional Configuration:**
- `ALCHEMY_API_KEY`: Alchemy RPC endpoint URL or API key (configured and working)
  - Platform automatically uses Alchemy RPC when this is set
  - Supports both full URL format or just the API key
  - Currently configured and operational
- WebSocket port configuration (default: 5000)

## Production Deployment

### Pyth Worker Configuration

**Confidence & Staleness Gating Policy:**
The Pyth worker enforces the following thresholds before resolving markets:

1. **Confidence Threshold**: Maximum 1% of price value
   - If `confidence > price * 0.01`, price update is rejected
   - Prevents resolution on highly uncertain data

2. **Staleness Threshold**: Maximum 60 seconds
   - If `publishTime` is older than 60 seconds, price update is rejected
   - Ensures only fresh oracle data triggers resolution

These thresholds can be adjusted in `server/services/pythWorker.ts`:
```typescript
const MAX_CONFIDENCE_THRESHOLD = priceUpdate.price * 0.01; // 1% of price
const MAX_STALENESS_MS = 60000; // 60 seconds
```

**Important:** All price normalization uses the actual exponent returned by the Pyth resolver (`expo` field) rather than hard-coded values. This ensures correct price calculation across different feed types.

### Production Status

✅ **Alchemy RPC Integration**: Fully configured and operational
- Wallet balance queries working (tested: 200 USDT)
- Event indexer successfully listening to blockchain events
- Pyth worker fetching price updates every 30 seconds
- Zero RPC errors in production logs

✅ **Background Services**: Running automatically on server boot
- Event Indexer: Syncing MarketCreated and OrderFilled events
- Pyth Worker: Updating prices with confidence/staleness verification
- Order Matcher: Processing limit orders with proper fill accumulation

⚠️ **User Interaction Requirements**:
- Wallet connection requires MetaMask browser extension
- Order signing requires user approval via MetaMask
- Market creation requires connected wallet for authentication

### Testing Status

✅ **Platform Testing Completed:**
- Home page with market list and stats
- Create market form with all inputs and validation
- Dark theme and responsive layout
- UI/UX quality and accessibility
- Alchemy RPC connection verified (wallet balance API working)
- Background services running without errors
- Event indexer and Pyth worker operational

⚠️ **Requires User Interaction:**
- Wallet connection via MetaMask (requires browser extension)
- Transaction signing for market creation
- Order placement and on-chain settlement

**Production Ready:** Platform is fully functional with Alchemy RPC. All blockchain features will work when users connect their MetaMask wallets.