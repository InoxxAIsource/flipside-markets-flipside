/**
 * ProxyWallet Service - Deterministic Gasless Wallet Management
 * 
 * Implements lazy-instantiated proxy wallets for gasless trading:
 * - Deterministic address derivation (create2)
 * - Lazy deployment on first action
 * - Address caching with block verification
 * - Meta-transaction preparation and batching
 */

import { ethers } from 'ethers';
import { Web3Service } from '../contracts/web3Service';
import { ProxyWalletFactoryABI } from '../contracts/abis';
import { storage } from '../storage';

/**
 * Cached proxy wallet info
 */
interface ProxyWalletCache {
  userAddress: string;
  proxyAddress: string;
  deployed: boolean;
  lastVerifiedBlock: number;
  createdAt: Date;
}

/**
 * EIP-712 domain for ProxyWallet meta-transactions
 */
export function getProxyWalletDomain(chainId: number, proxyWalletAddress: string) {
  return {
    name: 'ProxyWallet',
    version: '1',
    chainId,
    verifyingContract: proxyWalletAddress,
  };
}

/**
 * EIP-712 types for meta-transaction (matching ProxyWallet.sol)
 */
export const META_TX_TYPES = {
  MetaTransaction: [
    { name: 'user', type: 'address' },
    { name: 'target', type: 'address' },
    { name: 'data', type: 'bytes' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

/**
 * Call descriptor for batch execution
 */
export interface CallDescriptor {
  to: string;
  data: string;
  value: string;
}

/**
 * Batch execution parameters
 */
export interface BatchExecutionParams {
  targets: string[];
  values: string[];
  datas: string[];
  revertOnFail: boolean;
}

export class ProxyWalletService {
  private proxyWalletCache: Map<string, ProxyWalletCache> = new Map();
  private readonly CACHE_REVALIDATION_BLOCKS = 1000; // Revalidate every 1000 blocks
  
  constructor(
    private web3Service: Web3Service,
    private proxyFactoryAddress: string,
    private proxyImplementationAddress: string
  ) {}

  /**
   * Get deterministic proxy wallet address for a user
   * Uses create2 for deterministic address calculation
   */
  async getProxyAddress(userAddress: string): Promise<string> {
    const normalizedUser = ethers.getAddress(userAddress); // Checksum format
    
    // Check cache
    const cached = this.proxyWalletCache.get(normalizedUser);
    if (cached) {
      const currentBlock = await this.web3Service.getProvider().getBlockNumber();
      const blocksSinceVerification = currentBlock - cached.lastVerifiedBlock;
      
      // Return cached if recently verified
      if (blocksSinceVerification < this.CACHE_REVALIDATION_BLOCKS) {
        return cached.proxyAddress;
      }
    }

    // Calculate deterministic address
    const proxyFactory = new ethers.Contract(
      this.proxyFactoryAddress,
      ProxyWalletFactoryABI,
      this.web3Service.getProvider()
    );

    const proxyAddress = await proxyFactory.getInstanceAddress(
      this.proxyImplementationAddress,
      normalizedUser
    );

    // Verify deployment status
    const code = await this.web3Service.getProvider().getCode(proxyAddress);
    const deployed = code !== '0x';
    const currentBlock = await this.web3Service.getProvider().getBlockNumber();

    // Update cache
    this.proxyWalletCache.set(normalizedUser, {
      userAddress: normalizedUser,
      proxyAddress,
      deployed,
      lastVerifiedBlock: currentBlock,
      createdAt: new Date(),
    });

    console.log(`ProxyWallet for ${normalizedUser}: ${proxyAddress} (deployed: ${deployed})`);
    return proxyAddress;
  }

  /**
   * Check if proxy wallet is deployed
   */
  async isDeployed(userAddress: string): Promise<boolean> {
    const proxyAddress = await this.getProxyAddress(userAddress);
    const code = await this.web3Service.getProvider().getCode(proxyAddress);
    return code !== '0x';
  }

  /**
   * Lazily deploy proxy wallet on first action
   * Only deploys if not already deployed
   */
  async ensureDeployed(
    userAddress: string,
    signer: ethers.Wallet
  ): Promise<{ success: boolean; proxyAddress: string; txHash?: string; error?: string }> {
    try {
      const normalizedUser = ethers.getAddress(userAddress);
      const proxyAddress = await this.getProxyAddress(normalizedUser);
      
      // Check if already deployed
      if (await this.isDeployed(normalizedUser)) {
        return {
          success: true,
          proxyAddress,
        };
      }

      console.log(`Deploying ProxyWallet for ${normalizedUser}...`);
      
      // Deploy via maybeMakeWallet
      const proxyFactory = new ethers.Contract(
        this.proxyFactoryAddress,
        ProxyWalletFactoryABI,
        signer
      );

      const tx = await proxyFactory.maybeMakeWallet(
        this.proxyImplementationAddress,
        proxyAddress,
        normalizedUser
      );

      const receipt = await tx.wait();
      console.log(`ProxyWallet deployed for ${normalizedUser}: ${proxyAddress} (tx: ${receipt.hash})`);

      // Update cache
      const currentBlock = await this.web3Service.getProvider().getBlockNumber();
      this.proxyWalletCache.set(normalizedUser, {
        userAddress: normalizedUser,
        proxyAddress,
        deployed: true,
        lastVerifiedBlock: currentBlock,
        createdAt: new Date(),
      });

      return {
        success: true,
        proxyAddress,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error('ProxyWallet deployment error:', error);
      return {
        success: false,
        proxyAddress: '',
        error: error.message || 'Deployment failed',
      };
    }
  }

  /**
   * Get ProxyWallet contract instance for a user
   */
  private getProxyWalletContract(proxyAddress: string): ethers.Contract {
    return new ethers.Contract(
      proxyAddress,
      [
        'function getNonce(address user) view returns (uint256)',
        'function executeBatch((address to, bytes data, uint256 value)[] calls) returns (bytes[] memory)',
        'function execute(address to, bytes data, uint256 value) returns (bytes memory)',
        'function executeMetaTransaction(address user, address target, bytes data, bytes signature, uint256 deadline) returns (bytes memory)',
        'function getOwner() view returns (address)',
      ],
      this.web3Service.getProvider()
    );
  }

  /**
   * Get on-chain nonce for a user's proxy wallet
   * Always fetches from chain to avoid desync
   * Returns 0 if proxy wallet is not deployed yet
   */
  async getNonce(userAddress: string): Promise<bigint> {
    try {
      const proxyAddress = await this.getProxyAddress(userAddress);
      
      // Check if proxy wallet is deployed first
      const isDeployed = await this.isDeployed(userAddress);
      if (!isDeployed) {
        // Proxy wallet not deployed yet, nonce is 0
        return BigInt(0);
      }
      
      const proxyWallet = this.getProxyWalletContract(proxyAddress);
      
      // Get per-user nonce from the proxy wallet contract
      const nonce = await proxyWallet.getNonce(userAddress);
      return BigInt(nonce.toString());
    } catch (error) {
      // If any error occurs (including BAD_DATA when wallet not deployed), return 0
      console.error(`Failed to fetch nonce for ${userAddress}:`, error);
      return BigInt(0);
    }
  }

  /**
   * Initialize proxy wallet with necessary approvals
   * Called on first use: approve ConditionalTokens and CTFExchange
   */
  async initializeApprovals(
    userAddress: string,
    signer: ethers.Wallet
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Ensure wallet is deployed
      const deployResult = await this.ensureDeployed(userAddress, signer);
      if (!deployResult.success) {
        return deployResult;
      }

      const ctfAddress = await this.web3Service.conditionalTokens.getAddress();
      const collateralAddress = await this.web3Service.mockUSDT.getAddress();

      // Build approval calls
      const calls: CallDescriptor[] = [];

      // Approve ConditionalTokens to spend collateral (for splits)
      const approveCollateralData = this.web3Service.mockUSDT.interface.encodeFunctionData('approve', [
        ctfAddress,
        ethers.MaxUint256,
      ]);
      calls.push({
        to: collateralAddress,
        data: approveCollateralData,
        value: '0',
      });

      // Approve ConditionalTokens to handle position tokens (for merges)
      const approvePositionsData = this.web3Service.conditionalTokens.interface.encodeFunctionData(
        'setApprovalForAll',
        [ctfAddress, true]
      );
      calls.push({
        to: ctfAddress,
        data: approvePositionsData,
        value: '0',
      });

      // TODO: Add CTFExchange approval if needed

      // Execute batch initialization
      console.log(`Initializing approvals for ProxyWallet ${deployResult.proxyAddress}...`);
      
      // For now, return success (actual batched execution will be implemented in MetaTxBuilder)
      return {
        success: true,
        txHash: deployResult.txHash,
      };
    } catch (error: any) {
      console.error('Approval initialization error:', error);
      return {
        success: false,
        error: error.message || 'Approval initialization failed',
      };
    }
  }

  /**
   * Transform CallDescriptors into BatchExecutionParams
   */
  prepareBatchExecution(calls: CallDescriptor[]): BatchExecutionParams {
    return {
      targets: calls.map((c) => c.to),
      values: calls.map((c) => c.value),
      datas: calls.map((c) => c.data),
      revertOnFail: true, // Atomic execution
    };
  }

  /**
   * Estimate gas for batched execution
   */
  async estimateGas(
    proxyAddress: string,
    batch: BatchExecutionParams
  ): Promise<{ gasLimit: bigint; error?: string }> {
    try {
      const proxyWallet = this.getProxyWalletContract(proxyAddress);

      // Build batch calls in correct format
      const batchCalls = batch.targets.map((to, i) => ({
        to,
        data: batch.datas[i],
        value: batch.values[i],
      }));

      // Estimate gas for executeBatch
      const estimatedGas = await proxyWallet.executeBatch.estimateGas(batchCalls);
      
      // Add 20% safety margin
      const gasWithMargin = (estimatedGas * BigInt(120)) / BigInt(100);
      
      return { gasLimit: gasWithMargin };
    } catch (error: any) {
      console.error('Gas estimation error:', error);
      return {
        gasLimit: BigInt(500000), // Fallback gas limit
        error: error.message,
      };
    }
  }

  /**
   * Encode executeBatch calldata (for relayer execution)
   */
  encodeExecuteBatch(batch: BatchExecutionParams): string {
    const proxyWalletInterface = new ethers.Interface([
      'function executeBatch((address to, bytes data, uint256 value)[] calls) returns (bytes[] memory)',
    ]);

    const batchCalls = batch.targets.map((to, i) => ({
      to,
      data: batch.datas[i],
      value: batch.values[i],
    }));

    return proxyWalletInterface.encodeFunctionData('executeBatch', [batchCalls]);
  }

  /**
   * Invalidate cache for a user (call after deployment or major events)
   */
  invalidateCache(userAddress: string) {
    const normalized = ethers.getAddress(userAddress);
    this.proxyWalletCache.delete(normalized);
  }

  /**
   * Get cached proxy info (for debugging/monitoring)
   */
  getCachedInfo(userAddress: string): ProxyWalletCache | undefined {
    const normalized = ethers.getAddress(userAddress);
    return this.proxyWalletCache.get(normalized);
  }
}

// Singleton instance
let proxyWalletServiceInstance: ProxyWalletService | null = null;

export function getProxyWalletService(
  web3Service: Web3Service,
  proxyFactoryAddress: string,
  proxyImplementationAddress: string
): ProxyWalletService {
  if (!proxyWalletServiceInstance) {
    proxyWalletServiceInstance = new ProxyWalletService(
      web3Service,
      proxyFactoryAddress,
      proxyImplementationAddress
    );
  }
  return proxyWalletServiceInstance;
}
