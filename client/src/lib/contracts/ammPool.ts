import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/web3';

const ConditionalTokensABI = [
  "function splitPosition(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] calldata partition, uint256 amount)",
  "function mergePositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] calldata partition, uint256 amount)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
] as const;

const MockUSDTABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
] as const;

const AMMPoolABI = [
  "function addLiquidity(uint256 yesAmount, uint256 noAmount) returns (uint256)",
  "function removeLiquidity(uint256 lpTokens) returns (uint256, uint256)",
  "function getReserves() view returns (uint256 yesReserve, uint256 noReserve)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
] as const;

export interface AddLiquidityResult {
  splitTxHash: string;
  liquidityTxHash: string;
  lpTokens: string;
}

export interface LiquidityProgress {
  step: 'approve_usdt' | 'split' | 'approve_pool' | 'add_liquidity';
  status: 'pending' | 'waiting' | 'confirmed';
  txHash?: string;
  error?: string;
}

/**
 * Add initial liquidity to an AMM pool
 * This handles the complete flow:
 * 1. Approve USDT to ConditionalTokens
 * 2. Split USDT into YES+NO tokens
 * 3. Approve pool to transfer tokens
 * 4. Add liquidity to pool
 */
export async function addInitialLiquidity(
  poolAddress: string,
  conditionId: string,
  yesTokenId: string,
  noTokenId: string,
  yesAmount: string, // in USDT decimals (6)
  noAmount: string,
  signer: ethers.Signer,
  onProgress?: (progress: LiquidityProgress) => void
): Promise<AddLiquidityResult> {
  try {
    const userAddress = await signer.getAddress();
    console.log(`[LP] Starting liquidity addition for user ${userAddress}`);
    console.log(`[LP] Pool: ${poolAddress}, YES: ${yesAmount}, NO: ${noAmount}`);
    
    // Get contracts
    const usdtContract = new ethers.Contract(
      CONTRACT_ADDRESSES.MockUSDT,
      MockUSDTABI,
      signer
    );
    
    const ctContract = new ethers.Contract(
      CONTRACT_ADDRESSES.ConditionalTokens,
      ConditionalTokensABI,
      signer
    );
    
    const poolContract = new ethers.Contract(
      poolAddress,
      AMMPoolABI,
      signer
    );
    
    // Convert amounts to BigInt
    const yesAmountBN = ethers.parseUnits(yesAmount, 6);
    const noAmountBN = ethers.parseUnits(noAmount, 6);
    const totalAmount = yesAmountBN + noAmountBN;
    
    console.log(`[LP] Total amount to split: ${ethers.formatUnits(totalAmount, 6)} USDT`);
    
    // Step 1: Approve USDT to ConditionalTokens if needed
    try {
      console.log('[LP] Step 1: Checking USDT allowance...');
      const currentAllowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESSES.ConditionalTokens);
      console.log(`[LP] Current allowance: ${ethers.formatUnits(currentAllowance, 6)} USDT`);
      
      if (currentAllowance < totalAmount) {
        console.log('[LP] Insufficient allowance, requesting approval...');
        onProgress?.({ step: 'approve_usdt', status: 'pending' });
        
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.ConditionalTokens, ethers.MaxUint256);
        console.log(`[LP] Approval tx submitted: ${approveTx.hash}`);
        onProgress?.({ step: 'approve_usdt', status: 'waiting', txHash: approveTx.hash });
        
        const approveReceipt = await approveTx.wait();
        console.log(`[LP] Approval confirmed in block ${approveReceipt?.blockNumber}`);
        onProgress?.({ step: 'approve_usdt', status: 'confirmed', txHash: approveTx.hash });
      } else {
        console.log('[LP] Sufficient allowance already exists');
      }
    } catch (error: any) {
      console.error('[LP] Step 1 failed:', error);
      onProgress?.({ step: 'approve_usdt', status: 'pending', error: error.message });
      throw new Error(`USDT approval failed: ${error.message}`);
    }
    
    // Step 2: Split position to create YES and NO tokens
    try {
      console.log('[LP] Step 2: Splitting position...');
      const parentCollectionId = ethers.ZeroHash;
      const partition = [1, 2]; // indexSet for YES (1) and NO (2)
      
      onProgress?.({ step: 'split', status: 'pending' });
      
      const splitTx = await ctContract.splitPosition(
        CONTRACT_ADDRESSES.MockUSDT,
        parentCollectionId,
        conditionId,
        partition,
        totalAmount
      );
      
      console.log(`[LP] Split tx submitted: ${splitTx.hash}`);
      onProgress?.({ step: 'split', status: 'waiting', txHash: splitTx.hash });
      
      const splitReceipt = await splitTx.wait();
      
      if (!splitReceipt) {
        throw new Error('Split transaction receipt is null');
      }
      
      console.log(`[LP] Split confirmed in block ${splitReceipt.blockNumber}`);
      onProgress?.({ step: 'split', status: 'confirmed', txHash: splitTx.hash });
      
      // Verify we have the tokens
      const yesBalance = await ctContract.balanceOf(userAddress, yesTokenId);
      const noBalance = await ctContract.balanceOf(userAddress, noTokenId);
      console.log(`[LP] YES balance: ${ethers.formatUnits(yesBalance, 6)}`);
      console.log(`[LP] NO balance: ${ethers.formatUnits(noBalance, 6)}`);
      
    } catch (error: any) {
      console.error('[LP] Step 2 failed:', error);
      onProgress?.({ step: 'split', status: 'pending', error: error.message });
      throw new Error(`Position split failed: ${error.message}`);
    }
    
    // Step 3: Approve pool to transfer ERC1155 tokens
    try {
      console.log('[LP] Step 3: Checking pool approval...');
      const isApproved = await ctContract.isApprovedForAll(userAddress, poolAddress);
      console.log(`[LP] Pool approved: ${isApproved}`);
      
      if (!isApproved) {
        console.log('[LP] Requesting pool approval...');
        onProgress?.({ step: 'approve_pool', status: 'pending' });
        
        const approvalTx = await ctContract.setApprovalForAll(poolAddress, true);
        console.log(`[LP] Pool approval tx submitted: ${approvalTx.hash}`);
        onProgress?.({ step: 'approve_pool', status: 'waiting', txHash: approvalTx.hash });
        
        const approvalReceipt = await approvalTx.wait();
        console.log(`[LP] Pool approval confirmed in block ${approvalReceipt?.blockNumber}`);
        onProgress?.({ step: 'approve_pool', status: 'confirmed', txHash: approvalTx.hash });
      } else {
        console.log('[LP] Pool already approved');
      }
    } catch (error: any) {
      console.error('[LP] Step 3 failed:', error);
      onProgress?.({ step: 'approve_pool', status: 'pending', error: error.message });
      throw new Error(`Pool approval failed: ${error.message}`);
    }
    
    // Step 4: Add liquidity to pool
    try {
      console.log('[LP] Step 4: Adding liquidity to pool...');
      console.log(`[LP] Adding YES: ${ethers.formatUnits(yesAmountBN, 6)}, NO: ${ethers.formatUnits(noAmountBN, 6)}`);
      
      onProgress?.({ step: 'add_liquidity', status: 'pending' });
      
      const liquidityTx = await poolContract.addLiquidity(yesAmountBN, noAmountBN);
      console.log(`[LP] Add liquidity tx submitted: ${liquidityTx.hash}`);
      onProgress?.({ step: 'add_liquidity', status: 'waiting', txHash: liquidityTx.hash });
      
      const liquidityReceipt = await liquidityTx.wait();
      
      if (!liquidityReceipt) {
        throw new Error('Add liquidity transaction receipt is null');
      }
      
      console.log(`[LP] Add liquidity confirmed in block ${liquidityReceipt.blockNumber}`);
      onProgress?.({ step: 'add_liquidity', status: 'confirmed', txHash: liquidityTx.hash });
      
      // Get LP tokens balance to return
      const lpTokens = await poolContract.balanceOf(userAddress);
      console.log(`[LP] LP tokens received: ${ethers.formatUnits(lpTokens, 6)}`);
      
      console.log('[LP] ✅ Liquidity addition completed successfully!');
      
      return {
        splitTxHash: liquidityReceipt.hash,
        liquidityTxHash: liquidityReceipt.hash,
        lpTokens: lpTokens.toString(),
      };
    } catch (error: any) {
      console.error('[LP] Step 4 failed:', error);
      onProgress?.({ step: 'add_liquidity', status: 'pending', error: error.message });
      throw new Error(`Add liquidity failed: ${error.message}`);
    }
    
  } catch (error: any) {
    console.error('[LP] Overall process failed:', error);
    throw error;
  }
}

/**
 * Get pool information
 */
export async function getPoolInfo(
  poolAddress: string,
  provider: ethers.Provider
) {
  const poolContract = new ethers.Contract(
    poolAddress,
    AMMPoolABI,
    provider
  );
  
  const [yesReserve, noReserve] = await poolContract.getReserves();
  const totalSupply = await poolContract.totalSupply();
  
  return {
    yesReserve: yesReserve.toString(),
    noReserve: noReserve.toString(),
    totalSupply: totalSupply.toString(),
  };
}
