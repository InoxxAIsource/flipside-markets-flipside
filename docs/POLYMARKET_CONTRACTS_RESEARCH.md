# Polymarket Contract Research Summary

## Overview

Polymarket uses a **hybrid-decentralized model**: operator provides off-chain matching while settlement happens on-chain, non-custodially.

---

## Core Contracts Required for Binary Markets (YES/NO)

### 1. CTFExchange (Main Trading Contract)

**GitHub:** https://github.com/Polymarket/ctf-exchange  
**Deployed (Polygon):** 0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E

**Constructor Parameters:**
```solidity
constructor(
    address _collateral,    // ERC20 collateral (USDC/MockUSDT)
    address _ctf,          // ConditionalTokens contract
    address _proxyFactory, // ProxyFactory for gasless trading
    address _safeFactory   // SafeProxyFactory (can use address(0) initially)
)
```

**Key Features:**
- Three matching scenarios: NORMAL (direct swap), MINT (split collateral), MERGE (merge positions)
- Symmetric fee structure to preserve market integrity
- Operator-based execution (fillOrder, matchOrders)
- Token registration system (token, complement, conditionId)
- Admin controls (pause, configure)
- EIP-712 signatures ("Polymarket CTF Exchange", "1")

**Mixins Inherited:**
- **Auth** - onlyAdmin, onlyOperator access control
- **Assets** - Manages collateral and CTF addresses
- **Fees** - Symmetric fee calculations
- **Pausable** - Emergency pause functionality
- **AssetOperations** - Split/Merge operations
- **Hashing** - EIP712 domain separator
- **NonceManager** - Order nonce tracking
- **Registry** - Token registration
- **Signatures** - EIP712 signature verification with ProxyFactory
- **Trading** - Core order matching logic

**Key Functions:**
```solidity
// Trading (onlyOperator)
function fillOrder(Order memory order, uint256 fillAmount) external;
function fillOrders(Order[] memory orders, uint256[] memory fillAmounts) external;
function matchOrders(Order memory takerOrder, Order[] memory makerOrders, uint256 takerFillAmount, uint256[] memory makerFillAmounts) external;

// Admin Configuration
function registerToken(uint256 token, uint256 complement, bytes32 conditionId) external onlyAdmin;
function pauseTrading() external onlyAdmin;
function unpauseTrading() external onlyAdmin;
function setProxyFactory(address _newProxyFactory) external onlyAdmin;
function setSafeFactory(address _newSafeFactory) external onlyAdmin;
```

---

### 2. ProxyFactory (Gasless Meta-Transactions)

**GitHub:** https://github.com/Polymarket/proxy-factories  
**Deployed (Polygon):** 0xaB45c5A4B0c941a2F231C04C3f49182e1A254052

**Purpose:**
- Enables gasless trading via meta-transactions
- Creates deterministic proxy wallets (CREATE2) per user
- Uses Gas Station Network (GSN) for relayed transactions

**Key Features:**
- Deterministic addresses: user EOA → predictable proxy wallet
- Batch transactions: approve + trade atomically
- Zero gas cost for users (relayer pays)
- EIP-712 signature validation

**Main Function:**
```solidity
function proxy(ProxyWalletLib.ProxyCall[] memory calls) public payable returns (bytes[] memory);
```

**Flow:**
1. User signs meta-transaction
2. Relayer submits to ProxyFactory.proxy()
3. Factory creates wallet if doesn't exist (CREATE2)
4. Executes batch calls on user's proxy wallet

---

### 3. ConditionalTokens (CTF)

**Source:** https://github.com/gnosis/conditional-tokens-contracts  
**Deployed (Polygon):** 0x4D97DCd97eC945f40cF65F87097ACe5EA0476045

**Purpose:**
- Core ERC1155 implementation for outcome tokens
- Handles split/merge operations
- Condition preparation and resolution

**Key Functions:**
```solidity
function splitPosition(IERC20 collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint[] calldata partition, uint amount) external;
function mergePositions(IERC20 collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint[] calldata partition, uint amount) external;
function redeemPositions(IERC20 collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint[] calldata indexSets) external;
```

---

## Matching Scenarios

### Scenario 1: NORMAL (Direct Asset Swap)
- User A: BUY 100 YES @ $0.50 (pays 50 USDT)
- User B: SELL 50 YES @ $0.50 (receives 25 USDT)
- **Flow:** Transfer YES from B to A, transfer USDT from A to B

### Scenario 2: MINT (Split Collateral)
- User A: BUY 100 YES @ $0.50 (pays 50 USDT)
- User B: BUY 50 NO @ $0.50 (pays 25 USDT)
- **Flow:** Collect 75 USDT, mint 150 tokens (75 YES + 75 NO), distribute

### Scenario 3: MERGE (Merge to Collateral)
- User A: SELL 50 YES @ $0.50 (wants 25 USDT)
- User B: SELL 50 NO @ $0.50 (wants 25 USDT)
- **Flow:** Collect YES+NO pairs, merge to USDT, distribute

---

## Symmetric Fee Structure

**Goal:** Preserve market integrity for complementary tokens (YES + NO = USDT)

**Formula:**
```
fee = baseFeeRate * min(price, 1-price) * size
```

**Examples** (baseFeeRate = 0.02):
- BUY 100 YES @ $0.50 → fee = 2 YES ($1.00 value)
- SELL 100 NO @ $0.50 → fee = 1.0 USDT ($1.00 value)
- BUY 100 YES @ $0.10 → fee = 2 YES ($0.20 value)
- SELL 100 YES @ $0.90 → fee = 0.20 USDT ($0.20 value)

**Principle:** Same USD value fee whether buying cheap or expensive outcome

---

## Optional: NegRiskAdapter (Multi-Outcome Markets)

**GitHub:** https://github.com/Polymarket/neg-risk-ctf-adapter  
**Deployed (Polygon):** 0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296

**Purpose:**
- For multi-outcome markets (elections with >2 candidates)
- Exactly one outcome resolves YES, all others NO
- Integrates with UMA oracle for resolution

**Note:** NOT needed for binary YES/NO markets. Only required if you want to support multi-outcome predictions.

---

## Deployment Strategy for Sepolia

### Minimal Setup (Binary Markets Only):

1. **ConditionalTokens** - Either reuse existing or deploy fresh
2. **MockUSDT** - Already deployed (collateral)
3. **CTFExchange** - Deploy with Auth system
4. **ProxyFactory** - Deploy for gasless trading

### Constructor Values:
```typescript
const ctfExchange = await deploy("CTFExchange", [
  MOCK_USDT_ADDRESS,      // collateral
  CONDITIONAL_TOKENS,     // CTF
  PROXY_FACTORY_ADDRESS,  // proxyFactory
  SAFE_FACTORY_ADDRESS    // safeFactory (can use address(0))
]);
```

### Post-Deployment Configuration:

1. **Grant Operator Role** to relayer address
2. **Grant Admin Role** to owner address
3. **Register tokens** via registerToken(tokenId, complement, conditionId)
4. **Approve CTFExchange** to transfer collateral

---

## Integration with Existing Backend

### Required Changes:

1. **Update ABIs** - Import CTFExchange ABI with all mixins
2. **Relayer Service** - Extend to call fillOrder/matchOrders via ProxyWallet
3. **Event Indexer** - Listen for OrderFilled, OrdersMatched events
4. **Order Matching** - Backend matching engine feeds relayer with matched orders
5. **ProxyWallet Integration** - Create wallets, sign meta-transactions

### Order Flow:

```
User Signs Order → Backend Matches → Relayer Calls fillOrder/matchOrders → On-Chain Settlement → Event Indexer Updates DB
```

---

## Key Resources

- **CTFExchange Repo:** https://github.com/Polymarket/ctf-exchange
- **CTFExchange Docs:** https://github.com/Polymarket/ctf-exchange/blob/main/docs/Overview.md
- **ProxyFactory Repo:** https://github.com/Polymarket/proxy-factories
- **NegRisk Repo:** https://github.com/Polymarket/neg-risk-ctf-adapter (optional)
- **CTF Source:** https://github.com/gnosis/conditional-tokens-contracts
- **Polymarket Docs:** https://docs.polymarket.com/
- **ChainSecurity Audit:** Available in repos
- **Code Examples:** https://github.com/Polymarket/examples

---

## Decision for Our Platform

✅ **Deploy:**
- CTFExchange (with full Auth system)
- ProxyFactory (gasless trading)
- ConditionalTokens (if fresh start needed)

❌ **Skip for Now:**
- NegRiskAdapter (only for multi-outcome)
- SafeProxyFactory (can add later for browser wallets)

**Goal:** Clean CLOB execution with limit/market orders, split/merge, proxy wallets, free gas, and automatic settlement - exactly like Polymarket!
