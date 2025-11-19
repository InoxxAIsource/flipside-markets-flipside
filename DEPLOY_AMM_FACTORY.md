# AMM Pool Factory Deployment Instructions

## Problem Identified

The LP Pool creation was failing at Step 4 (addLiquidity) with error code `0x57f447ce`. The root cause was that the `AMMPool.sol` contract was missing the `IERC1155Receiver` interface implementation.

When ERC1155 tokens (YES/NO tokens) are transferred to a contract using `safeTransferFrom`, the receiving contract **must** implement the `IERC1155Receiver` interface. Without it, the transfer reverts.

## Fix Applied

✅ **Fixed `contracts/AMMPool.sol`:**
- Added `import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol"`
- Made contract implement `IERC1155Receiver` interface
- Added `onERC1155Received()` callback function
- Added `onERC1155BatchReceived()` callback function
- Added `supportsInterface()` for ERC165 compatibility

✅ **Contract compiled successfully**

## Next Step: Redeploy Factory

The AMMPool contract is now fixed, but the factory contract has the old bytecode embedded in it. You need to redeploy the factory.

### Option 1: Using the Provided Script (Recommended)

```bash
# Deploy the new factory
node scripts/deployFactory.mjs
```

**Note:** The script may timeout due to slow RPC. If it does, try Option 2.

### Option 2: Manual Deployment via Hardhat

```bash
cd contracts
npx hardhat run ../scripts/deployAMMFactory.ts --network sepolia
```

### Option 3: Using Remix IDE (Easiest)

1. Go to https://remix.ethereum.org
2. Upload `contracts/AMMPoolFactorySimple.sol` and `contracts/AMMPool.sol`
3. Compile AMMPoolFactorySimple
4. Deploy with these constructor parameters:
   - `_collateralToken`: `0xAf24D4DDbA993F6b11372528C678edb718a097Aa` (MockUSDT)
   - `_conditionalTokens`: `0xdC8CB01c328795C007879B2C030AbF1c1b580D84`
   - `_treasury`: `<your wallet address>`
5. Copy the deployed contract address

### After Deployment

Update `server/config/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  // ... existing addresses ...
  AMMPoolFactory: '<NEW_FACTORY_ADDRESS>', // Update this
};
```

Also update `client/src/config/contracts.ts` if it exists.

## Testing

After redeploying the factory, try creating an LP Pool market again. The console logs will now show:

```
[LP] Starting liquidity addition for user 0x...
[LP] Step 1: Checking USDT allowance...
[LP] Step 2: Splitting position...
[LP] Step 3: Checking pool approval...
[LP] Step 4: Adding liquidity to pool...
[LP] ✅ Liquidity addition completed successfully!
```

If Step 4 no longer fails, the fix is working!

## Summary

- ✅ AMMPool.sol fixed with ERC1155Receiver implementation
- ✅ Comprehensive logging added for debugging
- ⏳ Factory redeployment pending
- ⏳ Config update pending
