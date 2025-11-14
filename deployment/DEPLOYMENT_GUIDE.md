# Polymarket-Style Contract Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the complete Polymarket contract suite on Sepolia testnet.

---

## Prerequisites

1. **Foundry or Hardhat** - Smart contract deployment framework
2. **Private Key** - Deployment wallet with Sepolia ETH
3. **Alchemy/Infura API Key** - Sepolia RPC endpoint
4. **Etherscan API Key** - Contract verification

---

## Contract Repositories

Clone these Polymarket repositories:

```bash
# CTFExchange (main trading contract)
git clone https://github.com/Polymarket/ctf-exchange.git

# ProxyFactory (gasless trading)
git clone https://github.com/Polymarket/proxy-factories.git

# ConditionalTokens (Gnosis CTF)
git clone https://github.com/gnosis/conditional-tokens-contracts.git
```

---

## Deployment Sequence

### Step 1: Deploy Collateral Token (MockUSDT)

**Status:** ✅ Already deployed

Check current MockUSDT address in your environment or deploy fresh if needed.

```bash
# Verify existing deployment
cast call $MOCK_USDT_ADDRESS "name()" --rpc-url $SEPOLIA_RPC
```

---

### Step 2: Deploy ConditionalTokens

**Source:** `conditional-tokens-contracts/contracts/ConditionalTokens.sol`

```bash
cd conditional-tokens-contracts

# Deploy using Foundry
forge create src/ConditionalTokens.sol:ConditionalTokens \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Save the deployed address
export CTF_ADDRESS="0x..."
```

**Constructor:** No parameters required

---

### Step 3: Deploy ProxyWallet Implementation

**Source:** `proxy-factories/packages/proxy-factory/contracts/ProxyWallet/ProxyWallet.sol`

```bash
cd proxy-factories

# Install dependencies
npm install

# Deploy ProxyWallet implementation
forge create packages/proxy-factory/contracts/ProxyWallet/ProxyWallet.sol:ProxyWallet \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Save the implementation address
export PROXY_WALLET_IMPL="0x..."
```

**Constructor:** No parameters (implementation contract)

---

### Step 4: Deploy ProxyWalletFactory

**Source:** `proxy-factories/packages/proxy-factory/contracts/ProxyWalletFactory.sol`

```bash
# Deploy ProxyWalletFactory
forge create packages/proxy-factory/contracts/ProxyWalletFactory.sol:ProxyWalletFactory \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Save the factory address
export PROXY_FACTORY="0x..."
```

**Post-Deployment Configuration:**

```bash
# Set the ProxyWallet implementation
cast send $PROXY_FACTORY \
  "setImplementation(address)" \
  $PROXY_WALLET_IMPL \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY
```

---

### Step 5: Deploy CTFExchange

**Source:** `ctf-exchange/src/exchange/CTFExchange.sol`

```bash
cd ctf-exchange

# Install dependencies
forge install

# Deploy CTFExchange
forge create src/exchange/CTFExchange.sol:CTFExchange \
  --constructor-args \
    $MOCK_USDT_ADDRESS \
    $CTF_ADDRESS \
    $PROXY_FACTORY \
    "0x0000000000000000000000000000000000000000" \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Save the exchange address
export CTF_EXCHANGE="0x..."
```

**Constructor Parameters:**
1. `_collateral` - MockUSDT address
2. `_ctf` - ConditionalTokens address
3. `_proxyFactory` - ProxyWalletFactory address
4. `_safeFactory` - address(0) for now

---

## Post-Deployment Configuration

### Step 6: Configure Roles

```bash
# Get DEFAULT_ADMIN_ROLE hash
cast call $CTF_EXCHANGE "DEFAULT_ADMIN_ROLE()" --rpc-url $SEPOLIA_RPC

# Grant OPERATOR_ROLE to relayer
# First, get OPERATOR_ROLE hash
cast call $CTF_EXCHANGE "OPERATOR_ROLE()" --rpc-url $SEPOLIA_RPC

# Grant the role
cast send $CTF_EXCHANGE \
  "grantRole(bytes32,address)" \
  $OPERATOR_ROLE_HASH \
  $RELAYER_ADDRESS \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# Verify role granted
cast call $CTF_EXCHANGE \
  "hasRole(bytes32,address)" \
  $OPERATOR_ROLE_HASH \
  $RELAYER_ADDRESS \
  --rpc-url $SEPOLIA_RPC
```

---

### Step 7: Approve CTFExchange on ConditionalTokens

```bash
# Users' proxy wallets need to approve CTFExchange to transfer their CTF tokens
# This is done per-user when they first trade

# For the exchange itself to split/merge, it needs approval
cast send $CTF_ADDRESS \
  "setApprovalForAll(address,bool)" \
  $CTF_EXCHANGE \
  true \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY
```

---

### Step 8: Register Market Tokens

For each market, register the YES/NO token pair:

```bash
# Calculate token IDs for a market
# positionId = getPositionId(collateral, conditionId, indexSet)

# Register token
cast send $CTF_EXCHANGE \
  "registerToken(uint256,uint256,bytes32)" \
  $YES_TOKEN_ID \
  $NO_TOKEN_ID \
  $CONDITION_ID \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY
```

---

## Verification Checklist

After deployment, verify:

- [ ] ConditionalTokens deployed and verified
- [ ] ProxyWallet implementation deployed
- [ ] ProxyWalletFactory deployed with correct implementation
- [ ] CTFExchange deployed with all constructor params
- [ ] OPERATOR_ROLE granted to relayer address
- [ ] DEFAULT_ADMIN_ROLE belongs to owner
- [ ] CTFExchange approved on ConditionalTokens
- [ ] Test market tokens registered

---

## Environment Variables

Update your `.env` with deployed addresses:

```bash
# Sepolia Contract Addresses
CTF_ADDRESS="0x..."
PROXY_WALLET_IMPL="0x..."
PROXY_FACTORY="0x..."
CTF_EXCHANGE="0x..."

# Existing
MOCK_USDT_ADDRESS="0x..."
RELAYER_PRIVATE_KEY="..."
OWNER_PRIVATE_KEY="..."
```

---

## Integration with Backend

After deployment, update:

1. `server/contracts/abis.ts` - Add CTFExchange ABI
2. `server/contracts/web3Service.ts` - Add contract instances
3. `server/services/relayer.ts` - Integrate fillOrder/matchOrders calls
4. `server/services/eventIndexer.ts` - Listen for OrderFilled events

---

## Testing Deployment

```bash
# Test 1: Create a test market via MarketFactory
cast send $MARKET_FACTORY \
  "createMarket(...)" \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# Test 2: Register tokens
cast send $CTF_EXCHANGE \
  "registerToken(...)" \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# Test 3: Check proxy wallet creation
# Use ProxyFactory to create a wallet for test user

# Test 4: Submit test order via backend API
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"marketId": 1, "outcome": 0, "side": "BUY", ...}'
```

---

## Troubleshooting

### Issue: "Only operator can call this function"

**Solution:** Grant OPERATOR_ROLE to relayer address (Step 6)

### Issue: "Token not registered"

**Solution:** Call registerToken() for the market's YES/NO tokens (Step 8)

### Issue: "Transfer failed"

**Solution:** Ensure CTFExchange is approved on ConditionalTokens

### Issue: "Proxy wallet creation failed"

**Solution:** Verify ProxyWalletFactory has correct implementation set

---

## Next Steps

After successful deployment:

1. Update backend contract addresses
2. Test end-to-end order flow
3. Deploy frontend with new contract integration
4. Run integration tests
5. Monitor events and transactions

---

## Resources

- **CTFExchange Repo:** https://github.com/Polymarket/ctf-exchange
- **ProxyFactory Repo:** https://github.com/Polymarket/proxy-factories
- **CTF Repo:** https://github.com/gnosis/conditional-tokens-contracts
- **Foundry Book:** https://book.getfoundry.sh/
- **Cast Reference:** https://book.getfoundry.sh/reference/cast/
