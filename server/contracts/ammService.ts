import { ethers } from 'ethers';
import { AMMPoolFactoryABI, AMMPoolABI, ConditionalTokensABI, MockUSDTABI } from './abis';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../config/contracts';

/**
 * AMMService - Service for interacting with AMM Pool contracts
 * Handles pool creation, swapping, and liquidity management
 */
export class AMMService {
  private provider: ethers.JsonRpcProvider;
  public ammPoolFactory: ethers.Contract;
  public conditionalTokens: ethers.Contract;
  public mockUSDT: ethers.Contract;

  constructor(rpcUrl?: string) {
    // Use provided RPC or Alchemy if available, fallback to config RPC
    let defaultRpcUrl: string = NETWORK_CONFIG.rpcUrl;
    
    if (process.env.ALCHEMY_API_KEY) {
      const alchemyKey = process.env.ALCHEMY_API_KEY;
      if (alchemyKey.startsWith('http')) {
        defaultRpcUrl = alchemyKey;
      } else {
        defaultRpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
      }
    }
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultRpcUrl);

    // Initialize contract instances
    this.ammPoolFactory = new ethers.Contract(
      CONTRACT_ADDRESSES.AMM_POOL_FACTORY,
      AMMPoolFactoryABI,
      this.provider
    );

    this.conditionalTokens = new ethers.Contract(
      CONTRACT_ADDRESSES.CONDITIONAL_TOKENS,
      ConditionalTokensABI,
      this.provider
    );

    this.mockUSDT = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_USDT,
      MockUSDTABI,
      this.provider
    );
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get signer from private key (for backend operations)
   */
  getSigner(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Get pool contract instance
   */
  getPoolContract(poolAddress: string, signer?: ethers.Wallet): ethers.Contract {
    return new ethers.Contract(
      poolAddress,
      AMMPoolABI,
      signer || this.provider
    );
  }

  /**
   * Create a new AMM pool for a market
   */
  async createPool(params: {
    name: string;
    symbol: string;
    conditionId: string;
    oracle: string;
    yesPositionId: string;
    noPositionId: string;
    lpFee?: number; // basis points (default: 150 = 1.5%)
    protocolFee?: number; // basis points (default: 50 = 0.5%)
    signer: ethers.Wallet;
  }): Promise<{
    poolAddress: string;
    txHash: string;
  }> {
    const factory = this.ammPoolFactory.connect(params.signer) as ethers.Contract;

    let tx: ethers.ContractTransactionResponse;

    if (params.lpFee !== undefined && params.protocolFee !== undefined) {
      // Create pool with custom fees
      tx = await factory.createPool(
        params.name,
        params.symbol,
        params.conditionId,
        params.oracle,
        params.yesPositionId,
        params.noPositionId,
        params.lpFee,
        params.protocolFee
      );
    } else {
      // Create pool with default fees (1.5% LP, 0.5% protocol)
      tx = await factory.createPoolWithDefaults(
        params.name,
        params.symbol,
        params.conditionId,
        params.oracle,
        params.yesPositionId,
        params.noPositionId
      );
    }

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    // Extract pool address from PoolCreated event
    const event = receipt.logs
      .map(log => {
        try {
          return factory.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'PoolCreated');

    if (!event) {
      throw new Error('PoolCreated event not found');
    }

    return {
      poolAddress: event.args.pool,
      txHash: receipt.hash,
    };
  }

  /**
   * Get pool address for a condition
   */
  async getPool(conditionId: string): Promise<string> {
    return await this.ammPoolFactory.getPool(conditionId);
  }

  /**
   * Get pool information
   */
  async getPoolInfo(poolAddress: string): Promise<{
    conditionId: string;
    yesPositionId: string;
    noPositionId: string;
    yesReserve: string;
    noReserve: string;
    totalSupply: string;
    lpFeeRate: number;
    protocolFeeRate: number;
    resolved: boolean;
    winningOutcome?: number;
    yesPrice: number;
    noPrice: number;
    totalLiquidity: string;
    lpTokenAddress: string;
  }> {
    const pool = this.getPoolContract(poolAddress);

    const [
      conditionId,
      yesPositionId,
      noPositionId,
      yesReserve,
      noReserve,
      totalSupply,
      lpFeeRate,
      protocolFeeRate,
      resolved,
      winningOutcome,
      yesPriceBP,
    ] = await Promise.all([
      pool.conditionId(),
      pool.yesPositionId(),
      pool.noPositionId(),
      pool.yesReserve(),
      pool.noReserve(),
      pool.totalSupply(),
      pool.lpFeeRate(),
      pool.protocolFeeRate(),
      pool.resolved(),
      pool.winningOutcome().catch(() => 0),
      pool.getYesPrice(),
    ]);

    // Convert basis points to decimal (5000 BP = 0.5 = 50%)
    const yesPrice = Number(yesPriceBP) / 10000;
    const noPrice = 1 - yesPrice;

    // Calculate total liquidity in USDT
    const totalLiquidityBN = BigInt(yesReserve) + BigInt(noReserve);

    return {
      conditionId,
      yesPositionId: yesPositionId.toString(),
      noPositionId: noPositionId.toString(),
      yesReserve: yesReserve.toString(),
      noReserve: noReserve.toString(),
      totalSupply: totalSupply.toString(),
      lpFeeRate: Number(lpFeeRate),
      protocolFeeRate: Number(protocolFeeRate),
      resolved,
      winningOutcome: resolved ? Number(winningOutcome) : undefined,
      yesPrice,
      noPrice,
      totalLiquidity: totalLiquidityBN.toString(),
      lpTokenAddress: poolAddress, // Pool contract is also the LP token
    };
  }

  /**
   * Get swap quote (no transaction)
   */
  async getSwapQuote(
    poolAddress: string,
    buyYes: boolean,
    amountIn: string
  ): Promise<{
    amountOut: string;
    lpFee: string;
    protocolFee: string;
    price: number; // Effective price after fees
  }> {
    const pool = this.getPoolContract(poolAddress);
    const [amountOut, lpFee, protocolFee] = await pool.getSwapQuote(buyYes, amountIn);

    // Calculate effective price
    const amountInBN = BigInt(amountIn);
    const amountOutBN = BigInt(amountOut);
    const price = amountInBN > BigInt(0) ? Number(amountOutBN) / Number(amountInBN) : 0;

    return {
      amountOut: amountOut.toString(),
      lpFee: lpFee.toString(),
      protocolFee: protocolFee.toString(),
      price,
    };
  }

  /**
   * Execute a swap
   */
  async swap(params: {
    poolAddress: string;
    buyYes: boolean;
    amountIn: string;
    minAmountOut: string;
    signer: ethers.Wallet;
  }): Promise<{
    amountOut: string;
    lpFee: string;
    protocolFee: string;
    txHash: string;
  }> {
    const pool = this.getPoolContract(params.poolAddress, params.signer);

    const tx = await pool.swap(
      params.buyYes,
      params.amountIn,
      params.minAmountOut
    );

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    // Extract swap details from event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return pool.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === 'Swap');

    if (!event) {
      throw new Error('Swap event not found');
    }

    return {
      amountOut: event.args.amountOut.toString(),
      lpFee: event.args.lpFee.toString(),
      protocolFee: event.args.protocolFee.toString(),
      txHash: receipt.hash,
    };
  }

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(params: {
    poolAddress: string;
    yesAmount: string;
    noAmount: string;
    minLPTokens: string;
    signer: ethers.Wallet;
  }): Promise<{
    lpTokens: string;
    txHash: string;
  }> {
    const pool = this.getPoolContract(params.poolAddress, params.signer);

    const tx = await pool.addLiquidity(
      params.yesAmount,
      params.noAmount,
      params.minLPTokens
    );

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    // Extract LP tokens from event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return pool.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === 'LiquidityAdded');

    if (!event) {
      throw new Error('LiquidityAdded event not found');
    }

    return {
      lpTokens: event.args.lpTokens.toString(),
      txHash: receipt.hash,
    };
  }

  /**
   * Remove liquidity from a pool
   */
  async removeLiquidity(params: {
    poolAddress: string;
    lpTokens: string;
    minYesAmount: string;
    minNoAmount: string;
    signer: ethers.Wallet;
  }): Promise<{
    yesAmount: string;
    noAmount: string;
    txHash: string;
  }> {
    const pool = this.getPoolContract(params.poolAddress, params.signer);

    const tx = await pool.removeLiquidity(
      params.lpTokens,
      params.minYesAmount,
      params.minNoAmount
    );

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    // Extract amounts from event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return pool.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === 'LiquidityRemoved');

    if (!event) {
      throw new Error('LiquidityRemoved event not found');
    }

    return {
      yesAmount: event.args.yesAmount.toString(),
      noAmount: event.args.noAmount.toString(),
      txHash: receipt.hash,
    };
  }

  /**
   * Get user's LP token balance
   */
  async getLPBalance(poolAddress: string, userAddress: string): Promise<string> {
    const pool = this.getPoolContract(poolAddress);
    const balance = await pool.balanceOf(userAddress);
    return balance.toString();
  }

  /**
   * Calculate user's share of the pool
   */
  async getUserPoolShare(poolAddress: string, userAddress: string): Promise<{
    lpBalance: string;
    totalSupply: string;
    sharePercentage: number;
    yesShare: string;
    noShare: string;
  }> {
    const pool = this.getPoolContract(poolAddress);

    const [lpBalance, totalSupply, yesReserve, noReserve] = await Promise.all([
      pool.balanceOf(userAddress),
      pool.totalSupply(),
      pool.yesReserve(),
      pool.noReserve(),
    ]);

    const sharePercentage = totalSupply > BigInt(0)
      ? (Number(lpBalance) / Number(totalSupply)) * 100
      : 0;

    const yesShare = totalSupply > BigInt(0)
      ? (lpBalance * yesReserve) / totalSupply
      : BigInt(0);

    const noShare = totalSupply > BigInt(0)
      ? (lpBalance * noReserve) / totalSupply
      : BigInt(0);

    return {
      lpBalance: lpBalance.toString(),
      totalSupply: totalSupply.toString(),
      sharePercentage,
      yesShare: yesShare.toString(),
      noShare: noShare.toString(),
    };
  }
}

// Export singleton instance
export const ammService = new AMMService();
