# Smart Contract Deployment Summary

**Deployment Date:** November 14, 2025  
**Network:** Sepolia Testnet (Chain ID: 11155111)  
**Deployer:** 0x73eB1835929244710D4b894b147C4187dB80Aab7  
**Relayer:** 0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0

## Deployed Contracts

| Contract | Address | Verified | Explorer |
|----------|---------|----------|----------|
| MockUSDT | `0xAf24D4DDbA993F6b11372528C678edb718a097Aa` | ✅ | [Blockscout](https://eth-sepolia.blockscout.com/address/0xAf24D4DDbA993F6b11372528C678edb718a097Aa#code) · [Sourcify](https://sourcify.dev/server/repo-ui/11155111/0xAf24D4DDbA993F6b11372528C678edb718a097Aa) |
| ConditionalTokens | `0xdC8CB01c328795C007879B2C030AbF1c1b580D84` | ✅ | [Blockscout](https://eth-sepolia.blockscout.com/address/0xdC8CB01c328795C007879B2C030AbF1c1b580D84#code) · [Sourcify](https://sourcify.dev/server/repo-ui/11155111/0xdC8CB01c328795C007879B2C030AbF1c1b580D84) |
| ProxyWallet (Impl) | `0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7` | ✅ | [Blockscout](https://eth-sepolia.blockscout.com/address/0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7#code) · [Sourcify](https://sourcify.dev/server/repo-ui/11155111/0xc50cA824d3140CB3E0FB4C00fE336d7Ebd2dB5A7) |
| ProxyWalletFactory | `0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2` | ✅ | [Blockscout](https://eth-sepolia.blockscout.com/address/0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2#code) · [Sourcify](https://sourcify.dev/server/repo-ui/11155111/0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2) |
| CTFExchange | `0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3` | ✅ | [Blockscout](https://eth-sepolia.blockscout.com/address/0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3#code) · [Sourcify](https://sourcify.dev/server/repo-ui/11155111/0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3) |

## Deployment Details

### 1. MockUSDT (Collateral Token)
- **Purpose:** Test USDT token with 6 decimals
- **Features:** Mintable by anyone for testing
- **Initial Supply:** 1,000,000 USDT to deployer

### 2. ConditionalTokens
- **Purpose:** Gnosis CTF implementation for outcome tokens
- **Features:** Split/merge collateral into YES/NO tokens
- **Standard:** ERC1155

### 3. ProxyWallet System
- **Implementation:** Template contract for user wallets
- **Factory:** Creates deterministic proxy wallets via CREATE2
- **Purpose:** Enables gasless trading via meta-transactions

### 4. CTFExchange
- **Purpose:** Order book DEX for prediction market trading
- **Features:**
  - OPERATOR_ROLE for relayer-based order execution
  - Token registration for market outcomes
  - Fee distribution (0.25% default)
- **Access Control:** OpenZeppelin AccessControl

## Post-Deployment Configuration

### ✅ Completed
1. Contract compilation with Hardhat + Solidity 0.8.24
2. Deployment to Sepolia testnet
3. ProxyWalletFactory implementation set
4. **All contracts verified** on Blockscout and Sourcify
5. **OPERATOR_ROLE granted** to relayer (0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0)

### 🔄 Ready for Integration
1. **Token Registration** (per market):
   ```typescript
   await ctfExchange.registerToken(
     token0Id,    // YES token position ID
     token1Id,    // NO token position ID
     conditionId  // Market condition ID
   );
   ```

2. **Backend Integration**:
   - Import CONTRACT_ADDRESSES from `server/config/contracts.ts`
   - Update backend services to use deployed contracts
   - Test split/merge operations with live contracts
   - Enable frontend trading with proxy wallet system

## Next Steps

1. **Test Split/Merge Operations:**
   - Create a test market
   - Split USDT into YES/NO tokens via ConditionalTokens
   - Register tokens in CTFExchange
   - Test merge operations

2. **Integrate with Backend:**
   - Import CONTRACT_ADDRESSES from `server/config/contracts.ts`
   - Update backend services to use deployed contracts
   - Test proxy wallet creation and meta-transactions
   - Verify relayer can execute trades via OPERATOR_ROLE

3. **Frontend Updates:**
   - Update contract addresses in frontend config
   - Test wallet connection and trading flow
   - Enable gasless trading UI

## Architecture Overview

```
User → ProxyWallet (via relayer) → CTFExchange
                                   ↓
                            ConditionalTokens ← MockUSDT
```

### Trading Flow:
1. User signs meta-transaction off-chain
2. Relayer (OPERATOR_ROLE) executes on-chain via ProxyWallet
3. CTFExchange matches orders and settles via ConditionalTokens
4. Collateral (USDT) split/merged as needed

## Security Considerations

- ✅ ProxyWallet tied to user address (deterministic CREATE2)
- ✅ OPERATOR_ROLE required for order execution
- ✅ Meta-transaction signature verification (EIP-712)
- ⚠️ Public testnet - funds have no value
- ⚠️ Simplified contracts - not production-audited

## Deployment Log

Full deployment log saved to: `deployment.log`

Gas used for deployment: ~6-8M gas total  
Cost on Sepolia: ~0.01 ETH (testnet)
