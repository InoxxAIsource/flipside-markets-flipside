# ProxyWallet Meta-Transaction Testing Guide

## Overview

The prediction market platform now supports gasless trading via ProxyWallet meta-transactions with EIP-712 signature verification. This document explains how to test the complete flow.

## Contract Deployments (Sepolia Testnet)

All contracts are deployed and operational on Sepolia:

```
MockUSDT:               0x8710B6A7770B4586Bdc631D27645EC99DdAa9546
ConditionalTokens:      0xd52DDA74bF9D067814BBFC4F3F9a9E238Ed8D77B
ProxyWalletImpl:        0xE636F8584fC8D24E7162763291407703763af18a
ProxyWalletFactory:     0xf3CBF315014Fa95dc148B49c1Be4312744895e8B
CTFExchange:            0xCd38ACF61d7131aE1e220e57c1C0043B32dBB736
Relayer:                0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0 (0.115 ETH)
```

## Testing Methods

### Option 1: Automated Testing with Private Key (Recommended for CI/Replit)

Use the provided test script that doesn't require MetaMask:

```bash
# Set your test private key (optional - defaults to Hardhat test key)
export TEST_PRIVATE_KEY="0x..."

# Run the test
tsx scripts/test-proxy-flow.ts
```

**Prerequisites:**
- Wallet must have Sepolia testnet ETH (get from https://sepoliafaucet.com/)
- Script will automatically mint test USDT tokens

**What it tests:**
1. ✅ Proxy wallet deployment
2. ✅ USDT deposit (direct transaction)
3. ✅ Split operation (gasless meta-transaction)
4. ✅ Withdraw operation (gasless meta-transaction)
5. ✅ Balance verification

### Option 2: Manual Testing via Frontend (With MetaMask)

1. **Connect Wallet:**
   - Open the application in your browser
   - Click "Connect Wallet" and approve MetaMask
   - Ensure you're on Sepolia network (chainId 11155111)

2. **Deploy Proxy Wallet:**
   - Click "Deploy Proxy Wallet" button
   - Approve MetaMask transaction (costs ~0.001 ETH)
   - Wait for confirmation

3. **Get Test USDT:**
   - The backend can mint test USDT for you
   - Or ask the contract owner to send test tokens

4. **Deposit USDT:**
   - Enter amount (e.g., "10")
   - Click "Deposit"
   - Approve USDT spending in MetaMask
   - Confirm transfer transaction

5. **Test Split (Gasless):**
   - Navigate to any market
   - Select "Split" tab in trading panel
   - Enter amount (e.g., "5")
   - Click "Split"
   - **Sign EIP-712 message** (no gas required!)
   - Relayer executes transaction within 2 seconds

6. **Test Merge (Gasless):**
   - Select "Merge" tab
   - Enter amount of shares to merge
   - Click "Merge"
   - Sign EIP-712 message (no gas!)
   - Relayer executes transaction

7. **Test Withdraw (Gasless):**
   - Enter withdrawal amount
   - Click "Withdraw"
   - Sign EIP-712 message (no gas!)
   - USDT returns to your wallet

## Key Features

### Gasless Operations
The following operations require **ONLY a signature** (no gas/ETH):
- ✅ Split (USDT → YES+NO tokens)
- ✅ Merge (YES+NO → USDT)
- ✅ Withdraw (Proxy → User wallet)
- ✅ Place limit orders
- ✅ Place market orders

### Gas-Required Operations
These operations still require ETH for gas:
- ⛽ Deploy proxy wallet (one-time, ~0.001 ETH)
- ⛽ Deposit USDT to proxy (direct transfer)

## Meta-Transaction Flow

### Architecture
```
User signs EIP-712 message
    ↓
Signature + data sent to relayer API
    ↓
Relayer queues meta-transaction
    ↓
Relayer calls ProxyWallet.executeMetaTransaction()
    ↓
ProxyWallet verifies signature + nonce + deadline
    ↓
ProxyWallet executes the operation
    ↓
User receives confirmation (no gas spent!)
```

### EIP-712 Signature Structure

**Domain:**
```json
{
  "name": "ProxyWallet",
  "version": "1",
  "chainId": 11155111,
  "verifyingContract": "<user's proxy address>"
}
```

**Types:**
```json
{
  "MetaTransaction": [
    { "name": "user", "type": "address" },
    { "name": "target", "type": "address" },
    { "name": "data", "type": "bytes" },
    { "name": "nonce", "type": "uint256" },
    { "name": "deadline", "type": "uint256" }
  ]
}
```

## API Endpoints for Testing

### Check Proxy Status
```bash
GET http://localhost:5000/api/proxy/status/:address
```

**Response:**
```json
{
  "deployed": true,
  "proxyAddress": "0x...",
  "nonce": 0
}
```

### Check Proxy Balance
```bash
GET http://localhost:5000/api/proxy/balance/:address
```

**Response:**
```json
{
  "balance": "10000000"  // 10 USDT (6 decimals)
}
```

### Submit Meta-Transaction
```bash
POST http://localhost:5000/api/proxy/meta-transaction
Content-Type: application/json

{
  "user": "0x...",
  "target": "0x...",  // proxy address
  "data": "0x...",    // encoded function call
  "signature": "0x...",
  "deadline": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "txId": "uuid"
}
```

### Check Transaction Status
```bash
GET http://localhost:5000/api/proxy/meta-transaction/:txId
```

**Response:**
```json
{
  "id": "uuid",
  "status": "confirmed",  // pending | relayed | confirmed | failed
  "txHash": "0x...",
  "createdAt": "2025-11-15T07:00:00Z"
}
```

## Troubleshooting

### "Proxy wallet not deployed"
- User must deploy proxy wallet first (costs gas)
- Check deployment status via `/api/proxy/status/:address`

### "Insufficient balance"
- Check proxy balance via `/api/proxy/balance/:address`
- Deposit more USDT to proxy wallet

### "Signature verification failed"
- Ensure nonce matches on-chain nonce (fetch from `/api/proxy/status/:address`)
- Verify deadline is in the future (use current timestamp + 3600 seconds)
- Check EIP-712 domain matches user's specific proxy address (NOT implementation address)

### "Transaction reverted"
- Check relayer has sufficient ETH (should have >0.01 ETH)
- Verify target contract addresses are correct
- Check encoded function data is valid

## Expected Test Results

**Successful Flow:**
```
✅ Deploy proxy wallet (costs ~0.001 ETH)
✅ Deposit 10 USDT (costs gas)
✅ Split 5 USDT into YES+NO (gasless, ~2 sec)
   → Proxy balance: 5 USDT
   → Position: 5 YES + 5 NO shares
✅ Merge 3 shares back to USDT (gasless, ~2 sec)
   → Proxy balance: 8 USDT
   → Position: 2 YES + 2 NO shares
✅ Withdraw 2 USDT (gasless, ~2 sec)
   → Proxy balance: 6 USDT
   → User wallet: +2 USDT
```

## Next Steps

1. **Trading Operations:**
   - Test limit order placement (gasless)
   - Test market order execution (gasless)
   - Verify order matching in CLOB

2. **Multi-User Testing:**
   - Deploy proxies for multiple users
   - Create opposing orders
   - Test order fills and position updates

3. **Oracle Integration:**
   - Deploy PythPriceResolver contract
   - Test automated market resolution
   - Verify payout distribution

## Technical Notes

### Nonce Management
- Each user's proxy wallet maintains an on-chain nonce counter
- Frontend fetches current nonce before signing
- Relayer increments nonce after successful execution
- Prevents replay attacks

### Security
- EIP-712 signatures are domain-separated (specific to user's proxy)
- Deadline prevents stale meta-transactions
- Relayer verifies signature before executing
- On-chain verification ensures only user can authorize operations

### Gas Optimization
- Relayer batches transactions when possible
- Proxy wallet uses minimal gas for verification
- User never pays gas for trading operations
