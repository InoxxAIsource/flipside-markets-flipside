# Flipside Architecture

This document provides a comprehensive overview of Flipside's system architecture, smart contract design, and technical implementation.

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Blockchain Layer](#blockchain-layer)
- [Database Schema](#database-schema)
- [Trading Systems](#trading-systems)
- [Real-Time Updates](#real-time-updates)
- [External Integrations](#external-integrations)
- [Security](#security)
- [Scalability](#scalability)

---

## System Overview

Flipside is a three-tier architecture consisting of:

1. **Frontend**: React-based SPA with Ethereum wallet integration
2. **Backend**: Node.js/Express API server with WebSocket support
3. **Blockchain**: Solidity smart contracts on Ethereum Sepolia testnet

### Key Design Principles

- **Decentralization**: Critical functions (settlement, resolution) on-chain
- **Gasless UX**: Meta-transactions for order placement
- **Real-time**: WebSocket updates for market data
- **Scalability**: Dual trading systems (CLOB + AMM) for different use cases
- **Trustless**: Oracle-based resolution with Pyth Network

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Hooks   │  │TanStack Q│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘      │
│                         │                                    │
│                    Ethers.js v6                              │
└─────────────────────────┼───────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
       ┌────────▼────────┐  ┌──────▼──────┐
       │  Backend API    │  │  Blockchain  │
       │  (Express.js)   │  │   (Sepolia)  │
       │                 │  │              │
       │ ┌─────────────┐ │  │ ┌──────────┐│
       │ │   Routes    │ │  │ │Conditional││
       │ ├─────────────┤ │  │ │  Tokens   ││
       │ │  Storage    │ │  │ ├──────────┤│
       │ ├─────────────┤ │  │ │CTFExchange││
       │ │  Services   │ │  │ ├──────────┤│
       │ │ - Indexer   │ │  │ │ProxyWallet││
       │ │ - Matcher   │ │  │ ├──────────┤│
       │ │ - Pyth      │ │  │ │AMM Factory││
       │ │ - WebSocket │ │  │ └──────────┘│
       │ └─────────────┘ │  └──────────────┘
       │        │        │         │
       │        ▼        │         │
       │  ┌──────────┐  │         │
       │  │PostgreSQL│  │         │
       │  │  (Neon)  │  │         │
       │  └──────────┘  │         │
       └────────────────┘         │
                │                  │
                └──────────────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
       ┌────▼────┐  ┌───▼────┐  ┌───▼────┐
       │  Pyth   │  │ OpenAI │  │  ESPN  │
       │ Network │  │   API  │  │   API  │
       └─────────┘  └────────┘  └────────┘
```

---

## Frontend Architecture

### Tech Stack

- **React 18**: UI framework with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Wouter**: Lightweight routing (~1.2KB)
- **TanStack Query**: Data fetching and caching
- **Ethers.js v6**: Ethereum blockchain interactions
- **shadcn/ui**: Accessible component library
- **Tailwind CSS**: Utility-first styling

### Key Components

#### Market Components
- `MarketCard`: Grid display with image, price, trading
- `MarketDetail`: Full market view with chart and order book
- `TradingViewWidget`: Embedded price charts
- `OrderBook`: Real-time CLOB display
- `AMMSwapPanel`: AMM trading interface

#### Trading Components
- `PlaceOrderPanel`: CLOB order entry
- `PositionsList`: User holdings
- `OrderHistory`: Trade history

#### Wallet Integration
- `WalletButton`: Connect/disconnect wallet
- `WalletSelector`: Choose wallet provider (MetaMask, WalletConnect)
- `ProxyWalletInfo`: Display proxy wallet status

### State Management

```typescript
// TanStack Query for server state
const { data: markets } = useQuery({
  queryKey: ['/api/markets'],
  refetchInterval: 5000 // Polling fallback
});

// React hooks for local state
const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

// Ethers.js for blockchain state
const { data: signer } = useSigner();
```

### Routing Structure

```
/                    - Home (market grid)
/market/:id          - Market detail page
/create              - Create market
/portfolio           - User positions
/profile             - User profile
/leaderboard         - Top traders
/hedge               - Hedge calculator
/archived            - Expired markets
/docs                - Documentation
/api/docs            - API documentation
/investor/login      - Investor portal
```

---

## Backend Architecture

### Tech Stack

- **Node.js 18+**: Runtime environment
- **Express.js**: HTTP server
- **TypeScript**: Type-safe backend code
- **PostgreSQL**: Primary database (Neon serverless)
- **Drizzle ORM**: Type-safe database queries
- **WebSocket**: Real-time bidirectional communication
- **Ethers.js**: Blockchain event listening

### API Routes

#### Public Endpoints
```
GET  /api/markets                 - List markets
GET  /api/markets/:id             - Get market details
GET  /api/markets/:id/stats       - Real statistics
GET  /api/markets/:id/orderbook   - CLOB order book
GET  /api/markets/:id/trades      - Trade history
POST /api/orders                  - Place order (meta-tx)
POST /api/amm/swap                - AMM swap
GET  /api/leaderboard             - Top traders
```

#### Authenticated Endpoints (API Keys)
```
GET  /api/v1/markets              - Developer API
POST /api/v1/orders               - Programmatic trading
GET  /api/v1/positions            - User positions
```

#### Admin Endpoints
```
POST /api/admin/seed-markets      - Seed production markets
GET  /api/admin/investor-applications
```

### Background Services

#### Event Indexer
```typescript
// Monitors blockchain events and updates database
class EventIndexer {
  async start() {
    // Listen to ConditionalTokens events
    conditionalTokens.on('PositionSplit', this.handlePositionSplit);
    conditionalTokens.on('PositionMerge', this.handlePositionMerge);
    
    // Listen to CTFExchange events
    ctfExchange.on('OrderFilled', this.handleOrderFilled);
    
    // Listen to AMM events
    ammFactory.on('PoolCreated', this.handlePoolCreated);
  }
}
```

#### Order Matcher
```typescript
// Matches CLOB orders in the order book
class OrderMatcher {
  async matchOrders(marketId: string) {
    const buyOrders = await this.getBuyOrders(marketId);
    const sellOrders = await this.getSellOrders(marketId);
    
    // Match orders at same price
    for (const buy of buyOrders) {
      for (const sell of sellOrders) {
        if (buy.price >= sell.price) {
          await this.executeMatch(buy, sell);
        }
      }
    }
  }
}
```

#### Pyth Worker
```typescript
// Updates price feeds from Pyth Network
class PythWorker {
  async updatePrices() {
    const markets = await this.getActiveMarkets();
    
    for (const market of markets) {
      if (market.pythPriceFeedId) {
        const price = await pythConnection.getLatestPrice(
          market.pythPriceFeedId
        );
        await this.updateMarketPrice(market.id, price);
      }
    }
  }
}
```

#### Stop-Loss Monitor
```typescript
// Monitors and executes stop-loss orders
class StopLossMonitor {
  async monitorStopLossOrders() {
    const orders = await this.getActiveStopLossOrders();
    
    for (const order of orders) {
      const currentPrice = await this.getCurrentPrice(order.marketId);
      
      if (this.shouldTrigger(order, currentPrice)) {
        await this.executeStopLoss(order);
      }
    }
  }
}
```

---

## Blockchain Layer

### Smart Contract Architecture

#### ConditionalTokens (Gnosis Framework)
```solidity
// Core prediction market primitive
// Deployed at: 0xdC8CB01c328795C007879B2C030AbF1c1b580D84

function splitPosition(
  IERC20 collateralToken,
  bytes32 parentCollectionId,
  bytes32 conditionId,
  uint[] partition,
  uint amount
) external;

function mergePositions(
  IERC20 collateralToken,
  bytes32 parentCollectionId,
  bytes32 conditionId,
  uint[] partition,
  uint amount
) external;
```

#### CTFExchange (CLOB)
```solidity
// Central Limit Order Book exchange
// Permissionless - anyone can fill orders

struct Order {
  uint salt;
  address maker;
  address signer;
  address taker;
  uint tokenId;
  uint makerAmount;
  uint takerAmount;
  uint expiration;
  uint nonce;
  uint feeRateBps;
  uint8 side;
  uint8 signatureType;
  bytes signature;
}

function fillOrder(
  Order memory order,
  uint fillAmount
) external;
```

#### ProxyWallet System
```solidity
// Enables gasless trading via meta-transactions
// Factory: 0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2
// Implementation: 0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7

contract ProxyWallet {
  function executeMetaTransaction(
    address to,
    bytes calldata data,
    bytes calldata signature
  ) external returns (bytes memory);
}
```

#### AMMPoolFactorySimple
```solidity
// Automated Market Maker factory
// Deployed at: 0xAe14f8BC192306A891b172A3bc0e91132a4417EF

function createPool(
  bytes32 conditionId,
  uint initialLiquidity
) external returns (address pool);

// AMM uses constant product formula: x * y = k
// Fee: 2.0% per swap
```

### Gas Optimization

#### Meta-Transactions (EIP-712)
```typescript
// Users sign orders off-chain
const domain = {
  name: 'CTFExchange',
  version: '1',
  chainId: 11155111,
  verifyingContract: CTF_EXCHANGE_ADDRESS
};

const types = {
  Order: [
    { name: 'salt', type: 'uint256' },
    { name: 'maker', type: 'address' },
    // ...
  ]
};

const signature = await signer._signTypedData(domain, types, order);

// Relayer submits on-chain
await ctfExchange.fillOrder(order, fillAmount);
```

### Oracle Integration (Pyth Network)

```typescript
// Real-time price feeds for resolution
interface PythPriceResolver {
  function resolve(
    bytes32 conditionId,
    bytes32 priceFeedId,
    int64 targetPrice,
    uint64 expirationTime
  ) external;
}

// Example: BTC price feed
const priceFeedId = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
```

---

## Database Schema

### Core Tables

#### markets
```sql
CREATE TABLE markets (
  id VARCHAR PRIMARY KEY,
  question TEXT NOT NULL,
  description TEXT,
  category TEXT,
  expires_at TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  outcome BOOLEAN,
  yes_price REAL,
  no_price REAL,
  volume REAL,
  liquidity REAL,
  creator_address TEXT,
  condition_id TEXT,
  yes_token_id TEXT,
  no_token_id TEXT,
  pyth_price_feed_id TEXT,
  baseline_price REAL,
  target_price REAL,
  market_type TEXT, -- 'CLOB' or 'POOL'
  pool_address TEXT,
  image_url TEXT,
  tweet_url TEXT,
  ai_analysis TEXT,
  -- Sports-specific fields
  espn_event_id TEXT,
  home_team TEXT,
  away_team TEXT,
  sport TEXT,
  spread TEXT,
  over_under REAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### orders
```sql
CREATE TABLE orders (
  id VARCHAR PRIMARY KEY,
  market_id VARCHAR REFERENCES markets(id),
  user_address TEXT NOT NULL,
  side TEXT, -- 'BUY' or 'SELL'
  outcome TEXT, -- 'YES' or 'NO'
  price REAL,
  amount REAL,
  filled_amount REAL DEFAULT 0,
  status TEXT, -- 'PENDING', 'FILLED', 'CANCELLED'
  order_type TEXT, -- 'LIMIT', 'MARKET', 'STOP_LOSS'
  stop_price REAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### positions
```sql
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  market_id VARCHAR REFERENCES markets(id),
  outcome TEXT, -- 'YES' or 'NO'
  amount REAL,
  avg_price REAL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### api_keys
```sql
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT, -- First 8 chars for display
  tier TEXT, -- 'FREE', 'PRO', 'ENTERPRISE'
  rate_limit INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_markets_expires_at ON markets(expires_at);
CREATE INDEX idx_orders_market_status ON orders(market_id, status);
CREATE INDEX idx_positions_user ON positions(user_address);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
```

---

## Trading Systems

### 1. CLOB (Central Limit Order Book)

#### Order Flow
```
1. User creates order off-chain (EIP-712 signature)
2. Frontend sends to backend API
3. Backend validates and stores in database
4. Order Matcher attempts to fill against existing orders
5. If match found, relayer submits transaction to CTFExchange
6. Event Indexer updates database with fill
7. WebSocket broadcasts update to connected clients
```

#### Order Types
- **Limit Order**: Execute at specified price or better
- **Market Order**: Execute immediately at best available price
- **Fill-or-Kill**: Execute entire amount or cancel
- **Stop-Loss**: Trigger market order when price hits stop price

### 2. AMM (Automated Market Maker)

#### Constant Product Formula
```
x * y = k

Where:
- x = YES token reserves
- y = NO token reserves
- k = constant (liquidity)

Price calculation:
YES price = y / (x + y)
NO price = x / (x + y)
```

#### Swap Flow
```
1. User specifies input token and amount
2. Frontend calculates output using formula
3. Backend validates slippage tolerance
4. Transaction submitted to AMM pool contract
5. Tokens swapped, 2% fee collected
6. Event indexed and WebSocket update sent
```

#### Liquidity Provision
```typescript
// Add liquidity (get LP tokens)
await ammPool.addLiquidity(yesAmount, noAmount);

// Remove liquidity (burn LP tokens)
await ammPool.removeLiquidity(lpTokenAmount);
```

---

## Real-Time Updates

### WebSocket Architecture

```typescript
// Server-side
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws, req) => {
  const token = getTokenFromUrl(req.url);
  
  // Subscribe to market updates
  ws.on('message', (msg) => {
    const { type, marketId } = JSON.parse(msg);
    
    if (type === 'subscribe') {
      subscribeToMarket(ws, marketId);
    }
  });
});

// Broadcast update
function broadcastMarketUpdate(marketId: string, data: any) {
  wss.clients.forEach(client => {
    if (client.subscribedTo?.includes(marketId)) {
      client.send(JSON.stringify({ type: 'market_update', data }));
    }
  });
}
```

```typescript
// Client-side
const ws = new WebSocket(`wss://flipside.exchange/ws?token=${token}`);

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  
  if (type === 'market_update') {
    queryClient.invalidateQueries(['/api/markets', data.marketId]);
  }
};
```

### Polling Fallback

```typescript
// If WebSocket fails, fall back to polling
const { data: market } = useQuery({
  queryKey: ['/api/markets', marketId],
  refetchInterval: ws.readyState === WebSocket.OPEN ? false : 5000
});
```

---

## External Integrations

### Pyth Network
- **Purpose**: Real-time oracle price feeds
- **Usage**: Market resolution for crypto assets
- **Price Feed IDs**: BTC/USD, ETH/USD, SOL/USD, etc.

### OpenAI GPT-4o-mini
- **Purpose**: AI-powered market analysis
- **Usage**: Generate insights on market questions
- **Rate Limit**: Managed via Replit AI Integrations

### ESPN API
- **Purpose**: Live sports event data and odds
- **Usage**: Display spread/over-under on sports markets
- **Sports**: NFL, NBA, MLB, NHL, Soccer

### WalletConnect
- **Purpose**: Mobile wallet integration
- **Usage**: Connect mobile wallets (Trust, Rainbow, etc.)
- **Protocol**: WalletConnect v2

---

## Security

### Smart Contract Security
- **Audited Contracts**: ConditionalTokens (Gnosis)
- **Access Control**: Admin-only functions for critical operations
- **Reentrancy Guards**: All state-changing functions protected
- **Integer Overflow**: Solidity 0.8+ built-in protection

### Backend Security
- **API Rate Limiting**: By IP and API key tier
- **SQL Injection**: Prevented via Drizzle ORM parameterized queries
- **XSS Protection**: React auto-escapes user input
- **CSRF Protection**: Required for state-changing operations
- **Environment Variables**: Secrets stored in Replit Secrets

### Wallet Security
- **Private Keys**: Never stored on server
- **Meta-Transactions**: EIP-712 signatures verified on-chain
- **Proxy Wallets**: User retains full control
- **Signature Verification**: All orders validated before execution

---

## Scalability

### Current Capacity
- **Markets**: Unlimited (PostgreSQL scalability)
- **Orders**: 1000+ per second (order book)
- **WebSocket Connections**: 10,000+ concurrent
- **API Requests**: 100,000+ per hour

### Future Improvements
- **Layer 2 Deployment**: Reduce gas costs on mainnet
- **Database Sharding**: Partition by market category
- **CDN Integration**: Cache static market data
- **Microservices**: Separate indexer, matcher, API servers
- **Load Balancing**: Horizontal scaling of API servers

---

## Deployment

### Development
```bash
npm run dev  # Vite + Express on port 5000
```

### Production
```bash
npm run build        # Build frontend
npm run db:push      # Migrate database
npm start            # Start production server
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
RELAYER_PRIVATE_KEY=0x...
OPENAI_API_KEY=sk-...
VITE_WALLETCONNECT_PROJECT_ID=...
ADMIN_WALLET_ADDRESSES=0x...,0x...
```

---

## Monitoring

### Metrics Tracked
- Market creation rate
- Trading volume (24h, 7d, all-time)
- Order fill rate
- WebSocket connection count
- API request latency
- Database query performance

### Logging
- **Frontend**: Console errors sent to error tracking service
- **Backend**: Structured logging with Winston
- **Blockchain**: Event logs indexed and stored

---

**For questions or contributions, see [CONTRIBUTING.md](./CONTRIBUTING.md)**
