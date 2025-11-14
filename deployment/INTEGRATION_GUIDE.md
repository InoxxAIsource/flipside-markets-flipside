# Backend Integration Guide

## Deployed Contract Addresses (Sepolia)

All contracts successfully deployed to Sepolia testnet on November 14, 2025.

**Import from:** `server/config/contracts.ts`

```typescript
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './config/contracts';
```

## Integration Steps

### 1. Update Service Imports

Replace hardcoded addresses with deployed addresses:

```typescript
// server/services/proxyWalletService.ts
import { CONTRACT_ADDRESSES } from '../config/contracts';

const PROXY_FACTORY_ADDRESS = CONTRACT_ADDRESSES.PROXY_WALLET_FACTORY;
```

### 2. Configure Provider & ABIs

Update the Web3 provider configuration:

```typescript
// server/services/web3Provider.ts
import { ethers } from 'ethers';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES } from './config/contracts';

export const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

// Load ABIs from compiled artifacts
import ProxyWalletFactoryArtifact from '../../artifacts/contracts/ProxyWalletFactory.sol/ProxyWalletFactory.json';
import CTFExchangeArtifact from '../../artifacts/contracts/CTFExchange.sol/CTFExchange.json';
import ConditionalTokensArtifact from '../../artifacts/contracts/ConditionalTokens.sol/ConditionalTokens.json';

export const contracts = {
  proxyFactory: new ethers.Contract(
    CONTRACT_ADDRESSES.PROXY_WALLET_FACTORY,
    ProxyWalletFactoryArtifact.abi,
    provider
  ),
  ctfExchange: new ethers.Contract(
    CONTRACT_ADDRESSES.CTF_EXCHANGE,
    CTFExchangeArtifact.abi,
    provider
  ),
  conditionalTokens: new ethers.Contract(
    CONTRACT_ADDRESSES.CONDITIONAL_TOKENS,
    ConditionalTokensArtifact.abi,
    provider
  ),
};
```

### 3. Update Split/Merge Service

Integrate ConditionalTokens for split/merge operations:

```typescript
// server/services/splitMergeService.ts
import { CONTRACT_ADDRESSES } from '../config/contracts';

class SplitMergeService {
  private CONDITIONAL_TOKENS = CONTRACT_ADDRESSES.CONDITIONAL_TOKENS;
  private MOCK_USDT = CONTRACT_ADDRESSES.MOCK_USDT;

  async buildSplitCalldata(params: SplitParams): Promise<CallDescriptor[]> {
    const calls: CallDescriptor[] = [];

    // 1. Approve ConditionalTokens to spend USDT from proxy
    calls.push({
      to: this.MOCK_USDT,
      data: encodeApprove(this.CONDITIONAL_TOKENS, params.amount),
      value: 0
    });

    // 2. Split position
    calls.push({
      to: this.CONDITIONAL_TOKENS,
      data: encodeSplitPosition(
        this.MOCK_USDT,
        ZERO_BYTES32, // parentCollectionId
        params.conditionId,
        [1, 2], // partition for YES/NO
        params.amount
      ),
      value: 0
    });

    return calls;
  }
}
```

### 4. Update Relayer Service

Configure relayer with OPERATOR_ROLE:

```typescript
// server/services/relayerService.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../config/contracts';

const relayerWallet = new ethers.Wallet(
  process.env.RELAYER_PRIVATE_KEY!,
  new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl)
);

// Relayer address: 0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0
// Has OPERATOR_ROLE on CTFExchange for executing orders
```

### 5. Token Registration (Per Market)

When creating a new market, register tokens in CTFExchange:

```typescript
// After market creation and condition preparation
async function registerMarketTokens(market: Market) {
  const deployer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY!, provider);
  const ctfExchange = new ethers.Contract(
    CONTRACT_ADDRESSES.CTF_EXCHANGE,
    CTFExchangeArtifact.abi,
    deployer
  );

  // Get token IDs from ConditionalTokens
  const yesTokenId = getPositionId(MOCK_USDT, yesCollectionId);
  const noTokenId = getPositionId(MOCK_USDT, noCollectionId);

  // Register complementary tokens
  await ctfExchange.registerToken(
    yesTokenId,
    noTokenId,
    market.conditionId
  );
}
```

## Testing Split/Merge with Deployed Contracts

### Test Flow:

1. **Mint test USDT** (anyone can mint):
   ```typescript
   const mockUSDT = new ethers.Contract(
     CONTRACT_ADDRESSES.MOCK_USDT,
     MockUSDTArtifact.abi,
     userWallet
   );
   await mockUSDT.mint(userAddress, ethers.parseUnits("1000", 6));
   ```

2. **Create proxy wallet** (if not exists):
   ```typescript
   const factory = new ethers.Contract(
     CONTRACT_ADDRESSES.PROXY_WALLET_FACTORY,
     ProxyWalletFactoryArtifact.abi,
     provider
   );
   const proxyAddress = await factory.getInstanceAddress(
     CONTRACT_ADDRESSES.PROXY_WALLET_IMPL,
     userAddress
   );
   await factory.maybeMakeWallet(
     CONTRACT_ADDRESSES.PROXY_WALLET_IMPL,
     proxyAddress,
     userAddress
   );
   ```

3. **Split collateral into YES/NO**:
   ```typescript
   // Build calldata via SplitMergeService
   const calls = await splitMergeService.buildSplitCalldata({
     userAddress,
     conditionId,
     amount: ethers.parseUnits("100", 6),
     executionContext: ExecutionContext.PROXY_WALLET
   });

   // Execute via proxy wallet
   const proxy = new ethers.Contract(
     proxyAddress,
     ProxyWalletArtifact.abi,
     userWallet
   );
   await proxy.executeBatch(calls);
   ```

4. **Verify token balances**:
   ```typescript
   const ctf = new ethers.Contract(
     CONTRACT_ADDRESSES.CONDITIONAL_TOKENS,
     ConditionalTokensArtifact.abi,
     provider
   );
   const yesBalance = await ctf.balanceOf(userAddress, yesTokenId);
   const noBalance = await ctf.balanceOf(userAddress, noTokenId);
   ```

## Role Management

### Check if OPERATOR_ROLE is granted:
```bash
npx hardhat run scripts/grant-operator-role.ts --network sepolia
```

### Verify role manually:
```typescript
const ctfExchange = new ethers.Contract(
  CONTRACT_ADDRESSES.CTF_EXCHANGE,
  CTFExchangeArtifact.abi,
  provider
);
const OPERATOR_ROLE = await ctfExchange.OPERATOR_ROLE();
const hasRole = await ctfExchange.hasRole(
  OPERATOR_ROLE,
  "0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0"
);
console.log("Relayer has OPERATOR_ROLE:", hasRole);
```

## Contract ABIs

All contract ABIs are available in `artifacts/contracts/*/`*.json`:

- `MockUSDT.json`
- `ConditionalTokens.json`
- `ProxyWallet.json`
- `ProxyWalletFactory.json`
- `CTFExchange.json`

Import them as needed:
```typescript
import CTFExchangeArtifact from '../../artifacts/contracts/CTFExchange.sol/CTFExchange.json';
const abi = CTFExchangeArtifact.abi;
```

## Frontend Integration

Update frontend config with deployed addresses:

```typescript
// client/src/config/contracts.ts
export const CONTRACTS = {
  MOCK_USDT: "0xAf24D4DDbA993F6b11372528C678edb718a097Aa",
  CONDITIONAL_TOKENS: "0xdC8CB01c328795C007879B2C030AbF1c1b580D84",
  PROXY_WALLET_FACTORY: "0x36ac1F1E95fD0B4E691b3B29869Ec423490D50c2",
  CTF_EXCHANGE: "0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3",
} as const;

export const NETWORK = {
  chainId: 11155111,
  name: "Sepolia",
  rpcUrl: "https://sepolia.gateway.tenderly.co",
  blockExplorer: "https://sepolia.etherscan.io",
} as const;
```

## Next Development Tasks

1. ✅ Contracts deployed to Sepolia
2. ⏳ Grant OPERATOR_ROLE to relayer (pending transaction)
3. ⏳ Update backend services with deployed addresses
4. ⏳ Test split/merge with live contracts
5. ⏳ Integrate proxy wallet execution in order flow
6. ⏳ Test end-to-end trading with relayer
7. ⏳ Update frontend to use deployed contracts

## Troubleshooting

### Issue: Transaction reverts with "Only operator"
**Solution:** Ensure OPERATOR_ROLE is granted to relayer address (0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0)

### Issue: Token not registered
**Solution:** Call `ctfExchange.registerToken(token0, token1, conditionId)` for each market

### Issue: Proxy wallet not deployed
**Solution:** Call `proxyFactory.maybeMakeWallet(impl, proxyAddress, user)` to deploy on-demand

### Issue: Insufficient USDT balance
**Solution:** Call `mockUSDT.mint(address, amount)` to mint test tokens

## Resources

- [Deployment Summary](./DEPLOYMENT_SUMMARY.md)
- [Contract Source Code](../contracts/)
- [Hardhat Config](../hardhat.config.ts)
- [Sepolia Block Explorer](https://sepolia.etherscan.io)
