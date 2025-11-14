/**
 * Split/Merge Service - Multi-Context Execution Architecture
 * 
 * Handles splitting collateral into conditional tokens (USDT → YES + NO)
 * and merging conditional tokens back into collateral (YES + NO → USDT).
 * 
 * Key Design Principles:
 * 1. Support three execution contexts: USER_PROXY, RELAYER, DIRECT
 * 2. Use execution profile pattern to separate actor logic
 * 3. NEVER accept private keys server-side (security)
 * 4. Comprehensive edge case validation
 * 5. Deterministic position ID calculation
 */

import { ethers } from 'ethers';
import { Web3Service } from '../contracts/web3Service';
import { storage } from '../storage';

/**
 * Execution context for split/merge operations
 */
export enum ExecutionContext {
  USER_PROXY = 'USER_PROXY',     // User's ProxyWallet (gasless meta-tx)
  RELAYER = 'RELAYER',           // Backend relayer executes directly
  DIRECT = 'DIRECT',             // User's EOA executes directly
}

/**
 * Call descriptor for deferred execution
 */
export interface CallDescriptor {
  to: string;
  data: string;
  value: string;
  description: string;
}

/**
 * Split operation request
 */
export interface SplitRequest {
  userAddress: string;           // User's address (NOT private key)
  marketId: number;
  amount: string;                // Amount of collateral (USDT) to split
  context: ExecutionContext;
}

/**
 * Merge operation request
 */
export interface MergeRequest {
  userAddress: string;           // User's address (NOT private key)
  marketId: number;
  amount: string;                // Amount of position tokens to merge
  context: ExecutionContext;
}

/**
 * Split preparation result
 */
export interface SplitPreparation {
  valid: boolean;
  calls: CallDescriptor[];       // Calldata for ProxyWallet/Relayer
  yesTokenId: string;
  noTokenId: string;
  estimatedYesAmount: string;
  estimatedNoAmount: string;
  error?: string;
}

/**
 * Merge preparation result
 */
export interface MergePreparation {
  valid: boolean;
  calls: CallDescriptor[];       // Calldata for ProxyWallet/Relayer
  estimatedCollateralAmount: string;
  error?: string;
}

/**
 * Balance check result
 */
export interface BalanceCheck {
  sufficient: boolean;
  collateralBalance: string;
  yesBalance: string;
  noBalance: string;
  approvalNeeded: boolean;
}

/**
 * Execution profile for context-specific actor resolution and checks
 */
interface ExecutionProfile {
  /**
   * Resolve the actor address for this context
   */
  resolveActor(userAddress: string): Promise<string>;
  
  /**
   * Preflight balance and allowance checks for actor
   */
  preflightBalances(
    actorAddress: string,
    collateralAmount: bigint,
    yesTokenId: string,
    noTokenId: string,
    requiredAmount: bigint,
    context: 'split' | 'merge'
  ): Promise<{ sufficient: boolean; error?: string }>;
}

export class SplitMergeService {
  private proxyWalletService: any;
  private relayerService: any;

  constructor(private web3Service: Web3Service) {}

  /**
   * Set service dependencies (called after initialization to avoid circular deps)
   */
  setProxyWalletService(proxyWalletService: any) {
    this.proxyWalletService = proxyWalletService;
  }

  setRelayerService(relayerService: any) {
    this.relayerService = relayerService;
  }

  /**
   * Get execution profile for given context
   */
  private getExecutionProfile(context: ExecutionContext): ExecutionProfile {
    switch (context) {
      case ExecutionContext.USER_PROXY:
        return {
          resolveActor: async (userAddress: string) => {
            if (!this.proxyWalletService) {
              throw new Error('ProxyWalletService not initialized');
            }
            return await this.proxyWalletService.getProxyAddress(userAddress);
          },
          preflightBalances: async (actorAddress, collateralAmount, yesTokenId, noTokenId, requiredAmount, operation) => {
            if (operation === 'split') {
              const balance = await this.web3Service.mockUSDT.balanceOf(actorAddress);
              if (balance < collateralAmount) {
                return {
                  sufficient: false,
                  error: `Insufficient collateral in proxy wallet. Have: ${ethers.formatUnits(balance, 6)} USDT, Need: ${ethers.formatUnits(collateralAmount, 6)} USDT`,
                };
              }
            } else {
              const yesBalance = await this.web3Service.conditionalTokens.balanceOf(actorAddress, yesTokenId);
              const noBalance = await this.web3Service.conditionalTokens.balanceOf(actorAddress, noTokenId);
              const minBalance = yesBalance < noBalance ? yesBalance : noBalance;
              if (minBalance < requiredAmount) {
                return {
                  sufficient: false,
                  error: `Insufficient position tokens in proxy wallet. Have: ${ethers.formatUnits(minBalance, 6)}, Need: ${ethers.formatUnits(requiredAmount, 6)}`,
                };
              }
            }
            return { sufficient: true };
          },
        };

      case ExecutionContext.RELAYER:
        return {
          resolveActor: async () => {
            if (!this.relayerService) {
              throw new Error('RelayerService not initialized');
            }
            return this.relayerService.getRelayerAddress();
          },
          preflightBalances: async (actorAddress, collateralAmount, yesTokenId, noTokenId, requiredAmount, operation) => {
            if (operation === 'split') {
              const balance = await this.web3Service.mockUSDT.balanceOf(actorAddress);
              if (balance < collateralAmount) {
                return {
                  sufficient: false,
                  error: `Insufficient collateral in relayer wallet. Have: ${ethers.formatUnits(balance, 6)} USDT, Need: ${ethers.formatUnits(collateralAmount, 6)} USDT`,
                };
              }
            } else {
              const yesBalance = await this.web3Service.conditionalTokens.balanceOf(actorAddress, yesTokenId);
              const noBalance = await this.web3Service.conditionalTokens.balanceOf(actorAddress, noTokenId);
              const minBalance = yesBalance < noBalance ? yesBalance : noBalance;
              if (minBalance < requiredAmount) {
                return {
                  sufficient: false,
                  error: `Insufficient position tokens in relayer wallet. Have: ${ethers.formatUnits(minBalance, 6)}, Need: ${ethers.formatUnits(requiredAmount, 6)}`,
                };
              }
            }
            return { sufficient: true };
          },
        };

      case ExecutionContext.DIRECT:
        return {
          resolveActor: async (userAddress: string) => userAddress,
          preflightBalances: async (actorAddress, collateralAmount, yesTokenId, noTokenId, requiredAmount, operation) => {
            if (operation === 'split') {
              const balance = await this.web3Service.mockUSDT.balanceOf(actorAddress);
              if (balance < collateralAmount) {
                return {
                  sufficient: false,
                  error: `Insufficient collateral. Have: ${ethers.formatUnits(balance, 6)} USDT, Need: ${ethers.formatUnits(collateralAmount, 6)} USDT`,
                };
              }
            } else {
              const yesBalance = await this.web3Service.conditionalTokens.balanceOf(actorAddress, yesTokenId);
              const noBalance = await this.web3Service.conditionalTokens.balanceOf(actorAddress, noTokenId);
              const minBalance = yesBalance < noBalance ? yesBalance : noBalance;
              if (minBalance < requiredAmount) {
                return {
                  sufficient: false,
                  error: `Insufficient position tokens. Have: ${ethers.formatUnits(minBalance, 6)}, Need: ${ethers.formatUnits(requiredAmount, 6)}`,
                };
              }
            }
            return { sufficient: true };
          },
        };
    }
  }

  /**
   * Prepare split operation (build calldata, validate, return execution descriptor)
   * 
   * Flow:
   * 1. Validate market exists and is active
   * 2. Check user has sufficient collateral
   * 3. Build approval calldata (if needed)
   * 4. Build splitPosition calldata
   * 5. Return call descriptors for ProxyWallet/Relayer
   */
  async prepareSplit(request: SplitRequest): Promise<SplitPreparation> {
    try {
      const { userAddress, marketId, amount, context } = request;

      // Guard: Zero amount
      if (!amount || parseFloat(amount) <= 0) {
        return {
          valid: false,
          calls: [],
          yesTokenId: '0',
          noTokenId: '0',
          estimatedYesAmount: '0',
          estimatedNoAmount: '0',
          error: 'Amount must be greater than zero',
        };
      }

      // Get market details
      const market = await storage.getMarket(marketId.toString());
      if (!market) {
        return {
          valid: false,
          calls: [],
          yesTokenId: '0',
          noTokenId: '0',
          estimatedYesAmount: '0',
          estimatedNoAmount: '0',
          error: 'Market not found',
        };
      }

      // Guard: Market must be prepared on-chain
      if (!market.conditionId) {
        return {
          valid: false,
          calls: [],
          yesTokenId: '0',
          noTokenId: '0',
          estimatedYesAmount: '0',
          estimatedNoAmount: '0',
          error: 'Market not prepared on-chain',
        };
      }

      // Guard: Market must not be resolved
      if (market.resolved) {
        return {
          valid: false,
          calls: [],
          yesTokenId: '0',
          noTokenId: '0',
          estimatedYesAmount: '0',
          estimatedNoAmount: '0',
          error: 'Cannot split positions for resolved market',
        };
      }

      // Guard: Market tokens must be registered
      if (!market.yesTokenId || !market.noTokenId) {
        return {
          valid: false,
          calls: [],
          yesTokenId: '0',
          noTokenId: '0',
          estimatedYesAmount: '0',
          estimatedNoAmount: '0',
          error: 'Market tokens not registered on CTFExchange',
        };
      }

      const amountBN = ethers.parseUnits(amount, 6); // USDT has 6 decimals
      const collateralAddress = await this.web3Service.mockUSDT.getAddress();
      const ctfAddress = await this.web3Service.conditionalTokens.getAddress();

      // Resolve actor address using execution profile
      const profile = this.getExecutionProfile(context);
      let actorAddress: string;
      try {
        actorAddress = await profile.resolveActor(userAddress);
      } catch (error) {
        return {
          valid: false,
          calls: [],
          yesTokenId: market.yesTokenId || '0',
          noTokenId: market.noTokenId || '0',
          estimatedYesAmount: '0',
          estimatedNoAmount: '0',
          error: error instanceof Error ? error.message : 'Failed to resolve actor address',
        };
      }

      // Preflight balance checks for actor
      const balanceCheck = await profile.preflightBalances(
        actorAddress,
        amountBN,      // Collateral amount to check
        '',            // YES token ID (not used for split)
        '',            // NO token ID (not used for split)
        BigInt(0),     // Required position token amount (not used for split)
        'split'
      );

      if (!balanceCheck.sufficient) {
        return {
          valid: false,
          calls: [],
          yesTokenId: market.yesTokenId,
          noTokenId: market.noTokenId,
          estimatedYesAmount: '0',
          estimatedNoAmount: '0',
          error: balanceCheck.error || 'Insufficient balance',
        };
      }

      // Build call descriptors
      const calls: CallDescriptor[] = [];

      // Step 1: Approve ConditionalTokens to spend collateral (if needed)
      const actorAllowance = await this.web3Service.mockUSDT.allowance(actorAddress, ctfAddress);
      if (actorAllowance < amountBN) {
        const approveData = this.web3Service.mockUSDT.interface.encodeFunctionData('approve', [
          ctfAddress,
          ethers.MaxUint256,
        ]);

        calls.push({
          to: collateralAddress,
          data: approveData,
          value: '0',
          description: 'Approve ConditionalTokens to spend collateral',
        });
      }

      // Step 2: Split position
      const parentCollectionId = ethers.ZeroHash;
      const partition = [1, 2]; // Binary outcome: [YES (0b01), NO (0b10)]

      const splitData = this.web3Service.conditionalTokens.interface.encodeFunctionData(
        'splitPosition',
        [collateralAddress, parentCollectionId, market.conditionId, partition, amountBN]
      );

      calls.push({
        to: ctfAddress,
        data: splitData,
        value: '0',
        description: `Split ${amount} USDT into ${amount} YES + ${amount} NO for market ${marketId}`,
      });

      return {
        valid: true,
        calls,
        yesTokenId: market.yesTokenId,
        noTokenId: market.noTokenId,
        estimatedYesAmount: amount, // 1:1 ratio
        estimatedNoAmount: amount, // 1:1 ratio
      };
    } catch (error: any) {
      console.error('Split preparation error:', error);
      return {
        valid: false,
        calls: [],
        yesTokenId: '0',
        noTokenId: '0',
        estimatedYesAmount: '0',
        estimatedNoAmount: '0',
        error: error.message || 'Split preparation failed',
      };
    }
  }

  /**
   * Prepare merge operation (build calldata, validate, return execution descriptor)
   * 
   * Flow:
   * 1. Validate market exists and tokens are registered
   * 2. Check user has sufficient YES and NO tokens
   * 3. Build setApprovalForAll calldata (if needed)
   * 4. Build mergePositions calldata
   * 5. Return call descriptors for ProxyWallet/Relayer
   */
  async prepareMerge(request: MergeRequest): Promise<MergePreparation> {
    try {
      const { userAddress, marketId, amount, context } = request;

      // Guard: Zero amount
      if (!amount || parseFloat(amount) <= 0) {
        return {
          valid: false,
          calls: [],
          estimatedCollateralAmount: '0',
          error: 'Amount must be greater than zero',
        };
      }

      // Get market details
      const market = await storage.getMarket(marketId.toString());
      if (!market) {
        return {
          valid: false,
          calls: [],
          estimatedCollateralAmount: '0',
          error: 'Market not found',
        };
      }

      // Guard: Market must have tokens registered
      if (!market.conditionId || !market.yesTokenId || !market.noTokenId) {
        return {
          valid: false,
          calls: [],
          estimatedCollateralAmount: '0',
          error: 'Market tokens not registered',
        };
      }

      // Guard: Market must not be resolved (can't merge after resolution - use redeem instead)
      if (market.resolved) {
        return {
          valid: false,
          calls: [],
          estimatedCollateralAmount: '0',
          error: 'Market resolved - use redeem instead of merge',
        };
      }

      const amountBN = ethers.parseUnits(amount, 6);
      const collateralAddress = await this.web3Service.mockUSDT.getAddress();
      const ctfAddress = await this.web3Service.conditionalTokens.getAddress();

      // Resolve actor address using execution profile
      const profile = this.getExecutionProfile(context);
      let actorAddress: string;
      try {
        actorAddress = await profile.resolveActor(userAddress);
      } catch (error) {
        return {
          valid: false,
          calls: [],
          estimatedCollateralAmount: '0',
          error: error instanceof Error ? error.message : 'Failed to resolve actor address',
        };
      }

      // Preflight balance checks for actor
      const balanceCheck = await profile.preflightBalances(
        actorAddress,
        BigInt(0),            // Collateral amount (not used for merge)
        market.yesTokenId,    // YES token ID
        market.noTokenId,     // NO token ID
        amountBN,             // Required position token amount
        'merge'
      );

      if (!balanceCheck.sufficient) {
        return {
          valid: false,
          calls: [],
          estimatedCollateralAmount: '0',
          error: balanceCheck.error || 'Insufficient position tokens',
        };
      }

      // Build call descriptors
      const calls: CallDescriptor[] = [];

      // Step 1: Approve ConditionalTokens to handle position tokens (if needed)
      const isApproved = await this.web3Service.conditionalTokens.isApprovedForAll(
        actorAddress,
        ctfAddress
      );

      if (!isApproved) {
        const approveData = this.web3Service.conditionalTokens.interface.encodeFunctionData(
          'setApprovalForAll',
          [ctfAddress, true]
        );

        calls.push({
          to: ctfAddress,
          data: approveData,
          value: '0',
          description: 'Approve ConditionalTokens to handle position tokens',
        });
      }

      // Step 2: Merge positions
      const parentCollectionId = ethers.ZeroHash;
      const partition = [1, 2]; // Binary outcome: [YES, NO]

      const mergeData = this.web3Service.conditionalTokens.interface.encodeFunctionData(
        'mergePositions',
        [collateralAddress, parentCollectionId, market.conditionId, partition, amountBN]
      );

      calls.push({
        to: ctfAddress,
        data: mergeData,
        value: '0',
        description: `Merge ${amount} YES + ${amount} NO into ${amount} USDT for market ${marketId}`,
      });

      return {
        valid: true,
        calls,
        estimatedCollateralAmount: amount, // 1:1 ratio
      };
    } catch (error: any) {
      console.error('Merge preparation error:', error);
      return {
        valid: false,
        calls: [],
        estimatedCollateralAmount: '0',
        error: error.message || 'Merge preparation failed',
      };
    }
  }

  /**
   * Check user balances and approval status
   */
  async checkBalances(userAddress: string, marketId: number): Promise<BalanceCheck> {
    try {
      const market = await storage.getMarket(marketId.toString());
      if (!market || !market.yesTokenId || !market.noTokenId) {
        return {
          sufficient: false,
          collateralBalance: '0',
          yesBalance: '0',
          noBalance: '0',
          approvalNeeded: true,
        };
      }

      const ctfAddress = await this.web3Service.conditionalTokens.getAddress();

      // Batch calls for efficiency
      const [collateralBalance, positionBalances, isApproved] = await Promise.all([
        this.web3Service.mockUSDT.balanceOf(userAddress),
        this.web3Service.conditionalTokens.balanceOfBatch(
          [userAddress, userAddress],
          [market.yesTokenId, market.noTokenId]
        ),
        this.web3Service.conditionalTokens.isApprovedForAll(userAddress, ctfAddress),
      ]);

      return {
        sufficient: collateralBalance > BigInt(0) || (positionBalances[0] > BigInt(0) && positionBalances[1] > BigInt(0)),
        collateralBalance: ethers.formatUnits(collateralBalance, 6),
        yesBalance: ethers.formatUnits(positionBalances[0], 6),
        noBalance: ethers.formatUnits(positionBalances[1], 6),
        approvalNeeded: !isApproved,
      };
    } catch (error) {
      console.error('Balance check error:', error);
      return {
        sufficient: false,
        collateralBalance: '0',
        yesBalance: '0',
        noBalance: '0',
        approvalNeeded: true,
      };
    }
  }

  /**
   * Get deterministic position IDs for a market
   * Used by CLOB matcher to request precise balances
   */
  async getPositionIds(marketId: number): Promise<{ yesTokenId: string; noTokenId: string } | null> {
    const market = await storage.getMarket(marketId.toString());
    if (!market || !market.yesTokenId || !market.noTokenId) {
      return null;
    }

    return {
      yesTokenId: market.yesTokenId,
      noTokenId: market.noTokenId,
    };
  }

  /**
   * Calculate split/merge amounts (1:1 ratio for binary markets)
   */
  calculateSplitAmount(desiredPositionAmount: string): string {
    return desiredPositionAmount;
  }

  calculateMergeAmount(positionAmount: string): string {
    return positionAmount;
  }
}

// Singleton instance
let splitMergeServiceInstance: SplitMergeService | null = null;

export function getSplitMergeService(web3Service: Web3Service): SplitMergeService {
  if (!splitMergeServiceInstance) {
    splitMergeServiceInstance = new SplitMergeService(web3Service);
  }
  return splitMergeServiceInstance;
}
