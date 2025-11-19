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
  signer: ethers.Signer
): Promise<AddLiquidityResult> {
  const userAddress = await signer.getAddress();
  
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
  
  // Step 1: Approve USDT to ConditionalTokens if needed
  const currentAllowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESSES.ConditionalTokens);
  if (currentAllowance < totalAmount) {
    const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.ConditionalTokens, ethers.MaxUint256);
    await approveTx.wait();
  }
  
  // Step 2: Split position to create YES and NO tokens
  // We need to split TWICE: once for YES, once for NO
  const parentCollectionId = ethers.ZeroHash;
  const partition = [1, 2]; // indexSet for YES (1) and NO (2)
  
  const splitTx = await ctContract.splitPosition(
    CONTRACT_ADDRESSES.MockUSDT,
    parentCollectionId,
    conditionId,
    partition,
    totalAmount
  );
  
  const splitReceipt = await splitTx.wait();
  
  if (!splitReceipt) {
    throw new Error('Split transaction failed');
  }
  
  // Step 3: Approve pool to transfer ERC1155 tokens
  const isApproved = await ctContract.isApprovedForAll(userAddress, poolAddress);
  if (!isApproved) {
    const approvalTx = await ctContract.setApprovalForAll(poolAddress, true);
    await approvalTx.wait();
  }
  
  // Step 4: Add liquidity to pool
  const liquidityTx = await poolContract.addLiquidity(yesAmountBN, noAmountBN);
  const liquidityReceipt = await liquidityTx.wait();
  
  if (!liquidityReceipt) {
    throw new Error('Add liquidity transaction failed');
  }
  
  // Get LP tokens balance to return
  const lpTokens = await poolContract.balanceOf(userAddress);
  
  return {
    splitTxHash: splitReceipt.hash,
    liquidityTxHash: liquidityReceipt.hash,
    lpTokens: lpTokens.toString(),
  };
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
