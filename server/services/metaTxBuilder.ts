/**
 * Meta-Transaction Builder Utility
 * 
 * Assembles executeBatch payloads with EIP-712 signatures
 * for gasless execution via ProxyWallet + Relayer.
 * 
 * Key Features:
 * - EIP-712 domain/types for single and batched calls
 * - Signature verification and nonce validation
 * - Target allowlist enforcement
 * - Gas estimation and safety limits
 * - Relayer queue integration with prioritization
 */

import { ethers } from 'ethers';
import {
  ProxyWalletService,
  getProxyWalletDomain,
  META_TX_TYPES,
  BATCH_META_TX_TYPES,
  CallDescriptor,
} from './proxyWalletService';
import { Web3Service } from '../contracts/web3Service';

/**
 * Target contract allowlist (security)
 */
export const ALLOWED_TARGETS = {
  ConditionalTokens: true,
  MockUSDT: true,
  CTFExchange: true,
  FeeDistributor: true,
} as const;

/**
 * Operation priority for relayer queue
 */
export enum OperationPriority {
  SETTLEMENT = 3,      // Highest: Order settlement
  SPLIT_MERGE = 2,     // Medium: Position operations
  USER_MISC = 1,       // Lowest: Misc user actions
}

/**
 * Meta-transaction payload (single call)
 */
export interface MetaTxPayload {
  from: string;
  to: string;
  value: string;
  data: string;
  nonce: bigint;
  deadline: number;
  gasLimit: bigint;
}

/**
 * Batched meta-transaction payload
 */
export interface BatchMetaTxPayload {
  from: string;
  targets: string[];
  values: string[];
  datas: string[];
  nonce: bigint;
  deadline: number;
  gasLimit: bigint;
}

/**
 * Signed meta-transaction for relayer queue
 */
export interface SignedMetaTx {
  payload: BatchMetaTxPayload;
  signature: string;
  priority: OperationPriority;
  operationType: string; // 'split', 'merge', 'order_fill', etc.
  estimatedGas: bigint;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export class MetaTxBuilder {
  private readonly MAX_BATCH_SIZE = 10;
  private readonly MAX_GAS_LIMIT = BigInt(3_000_000); // 3M gas cap
  private readonly MAX_VALUE_PER_CALL = ethers.parseUnits('1000', 6); // 1000 USDT max per call

  constructor(
    private web3Service: Web3Service,
    private proxyWalletService: ProxyWalletService,
    private chainId: number
  ) {}

  /**
   * Build batched meta-transaction from call descriptors
   */
  async buildBatchMetaTx(
    userAddress: string,
    calls: CallDescriptor[],
    deadlineSeconds: number = 300 // 5 min default
  ): Promise<{ success: boolean; payload?: BatchMetaTxPayload; error?: string }> {
    try {
      // Validation: Batch size
      if (calls.length === 0) {
        return { success: false, error: 'No calls provided' };
      }
      if (calls.length > this.MAX_BATCH_SIZE) {
        return { success: false, error: `Batch size exceeds maximum (${this.MAX_BATCH_SIZE})` };
      }

      // CRITICAL: Enforce allowlist BEFORE building payload
      const allowedTargets = await this.getAllowedTargets();
      for (const call of calls) {
        const targetNormalized = ethers.getAddress(call.to);
        if (!allowedTargets.includes(targetNormalized)) {
          return {
            success: false,
            error: `Target ${targetNormalized} is not in allowlist. Allowed: ${allowedTargets.join(', ')}`,
          };
        }
      }

      // Get proxy address
      const proxyAddress = await this.proxyWalletService.getProxyAddress(userAddress);
      
      // Get current nonce
      const nonce = await this.proxyWalletService.getNonce(userAddress);
      
      // Calculate deadline
      const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;

      // Estimate gas
      const batch = this.proxyWalletService.prepareBatchExecution(calls);
      const gasEstimate = await this.proxyWalletService.estimateGas(proxyAddress, batch);
      
      if (gasEstimate.gasLimit > this.MAX_GAS_LIMIT) {
        return {
          success: false,
          error: `Gas limit (${gasEstimate.gasLimit}) exceeds maximum (${this.MAX_GAS_LIMIT})`,
        };
      }

      // Build payload
      const payload: BatchMetaTxPayload = {
        from: userAddress,
        targets: batch.targets,
        values: batch.values,
        datas: batch.datas,
        nonce,
        deadline,
        gasLimit: gasEstimate.gasLimit,
      };

      return { success: true, payload };
    } catch (error: any) {
      console.error('MetaTx build error:', error);
      return { success: false, error: error.message || 'Failed to build meta-transaction' };
    }
  }

  /**
   * Sign batched meta-transaction with EIP-712
   */
  async signBatchMetaTx(
    payload: BatchMetaTxPayload,
    signer: ethers.Wallet
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const proxyAddress = await this.proxyWalletService.getProxyAddress(payload.from);
      const domain = getProxyWalletDomain(this.chainId, proxyAddress);
      
      const value = {
        from: payload.from,
        targets: payload.targets,
        values: payload.values,
        datas: payload.datas,
        nonce: payload.nonce,
        deadline: payload.deadline,
        gasLimit: payload.gasLimit,
      };

      const signature = await signer.signTypedData(domain, BATCH_META_TX_TYPES, value);
      
      return { success: true, signature };
    } catch (error: any) {
      console.error('MetaTx signing error:', error);
      return { success: false, error: error.message || 'Failed to sign meta-transaction' };
    }
  }

  /**
   * Verify meta-transaction signature
   */
  async verifySignature(
    payload: BatchMetaTxPayload,
    signature: string
  ): Promise<{ valid: boolean; recoveredAddress?: string; error?: string }> {
    try {
      const proxyAddress = await this.proxyWalletService.getProxyAddress(payload.from);
      const domain = getProxyWalletDomain(this.chainId, proxyAddress);

      const value = {
        from: payload.from,
        targets: payload.targets,
        values: payload.values,
        datas: payload.datas,
        nonce: payload.nonce,
        deadline: payload.deadline,
        gasLimit: payload.gasLimit,
      };

      const digest = ethers.TypedDataEncoder.hash(domain, BATCH_META_TX_TYPES, value);
      const recoveredAddress = ethers.recoverAddress(digest, signature);

      const valid = recoveredAddress.toLowerCase() === payload.from.toLowerCase();
      
      return { valid, recoveredAddress };
    } catch (error: any) {
      console.error('Signature verification error:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validate meta-transaction payload (security checks)
   */
  async validate(payload: BatchMetaTxPayload): Promise<ValidationResult> {
    const warnings: string[] = [];

    // Check deadline
    const now = Math.floor(Date.now() / 1000);
    if (payload.deadline < now) {
      return { valid: false, error: 'Transaction deadline has passed' };
    }
    if (payload.deadline > now + 3600) {
      warnings.push('Deadline is more than 1 hour in the future');
    }

    // Check nonce alignment
    const currentNonce = await this.proxyWalletService.getNonce(payload.from);
    if (payload.nonce < currentNonce) {
      return { valid: false, error: `Stale nonce: expected >= ${currentNonce}, got ${payload.nonce}` };
    }
    if (payload.nonce > currentNonce) {
      return { valid: false, error: `Future nonce: expected ${currentNonce}, got ${payload.nonce}` };
    }

    // Check batch consistency
    if (
      payload.targets.length !== payload.values.length ||
      payload.targets.length !== payload.datas.length
    ) {
      return { valid: false, error: 'Batch arrays have inconsistent lengths' };
    }

    // Check target allowlist
    const allowedTargets = await this.getAllowedTargets();
    for (const target of payload.targets) {
      const normalized = ethers.getAddress(target);
      if (!allowedTargets.includes(normalized)) {
        return { valid: false, error: `Target ${normalized} is not in allowlist` };
      }
    }

    // Check value limits
    for (const value of payload.values) {
      const valueBN = BigInt(value);
      if (valueBN > this.MAX_VALUE_PER_CALL) {
        return {
          valid: false,
          error: `Call value (${ethers.formatUnits(valueBN, 6)}) exceeds maximum (${ethers.formatUnits(this.MAX_VALUE_PER_CALL, 6)})`,
        };
      }
    }

    // Check gas limit
    if (payload.gasLimit > this.MAX_GAS_LIMIT) {
      return {
        valid: false,
        error: `Gas limit (${payload.gasLimit}) exceeds maximum (${this.MAX_GAS_LIMIT})`,
      };
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  /**
   * Get allowed target addresses from contracts
   */
  private async getAllowedTargets(): Promise<string[]> {
    return [
      await this.web3Service.conditionalTokens.getAddress(),
      await this.web3Service.mockUSDT.getAddress(),
      await this.web3Service.ctfExchange.getAddress(),
      await this.web3Service.feeDistributor.getAddress(),
    ].map((addr) => ethers.getAddress(addr));
  }

  /**
   * Prepare signed meta-transaction for relayer queue
   */
  async prepareForRelayer(
    userAddress: string,
    calls: CallDescriptor[],
    operationType: string,
    priority: OperationPriority,
    signer: ethers.Wallet
  ): Promise<{ success: boolean; signedMetaTx?: SignedMetaTx; error?: string }> {
    try {
      // Build payload
      const buildResult = await this.buildBatchMetaTx(userAddress, calls);
      if (!buildResult.success || !buildResult.payload) {
        return { success: false, error: buildResult.error };
      }

      const payload = buildResult.payload;

      // Validate payload
      const validation = await this.validate(payload);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Sign payload
      const signResult = await this.signBatchMetaTx(payload, signer);
      if (!signResult.success || !signResult.signature) {
        return { success: false, error: signResult.error };
      }

      // Verify signature
      const verifyResult = await this.verifySignature(payload, signResult.signature);
      if (!verifyResult.valid) {
        return { success: false, error: `Signature verification failed: ${verifyResult.error}` };
      }

      const signedMetaTx: SignedMetaTx = {
        payload,
        signature: signResult.signature,
        priority,
        operationType,
        estimatedGas: payload.gasLimit,
      };

      return { success: true, signedMetaTx };
    } catch (error: any) {
      console.error('Relayer preparation error:', error);
      return { success: false, error: error.message || 'Failed to prepare for relayer' };
    }
  }

  /**
   * Optimize batch by removing redundant approvals
   * Checks on-chain state to skip unnecessary approval calls
   */
  async optimizeBatch(
    userAddress: string,
    calls: CallDescriptor[]
  ): Promise<CallDescriptor[]> {
    const optimized: CallDescriptor[] = [];
    const proxyAddress = await this.proxyWalletService.getProxyAddress(userAddress);

    for (const call of calls) {
      const callData = call.data;
      
      // Check if this is an ERC20 approve call
      if (callData.startsWith('0x095ea7b3')) { // approve(address,uint256)
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address', 'uint256'],
          '0x' + callData.slice(10)
        );
        const [spender, amount] = decoded;

        // Check current allowance
        const mockUSDT = this.web3Service.mockUSDT;
        const currentAllowance = await mockUSDT.allowance(proxyAddress, spender);
        
        // Skip if already approved for sufficient amount
        if (currentAllowance >= BigInt(amount.toString())) {
          console.log(`Skipping redundant ERC20 approval for ${spender}`);
          continue;
        }
      }

      // Check if this is an ERC1155 setApprovalForAll call
      if (callData.startsWith('0xa22cb465')) { // setApprovalForAll(address,bool)
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['address', 'bool'],
          '0x' + callData.slice(10)
        );
        const [operator, approved] = decoded;

        // Check current approval status
        const ctf = this.web3Service.conditionalTokens;
        const currentlyApproved = await ctf.isApprovedForAll(proxyAddress, operator);
        
        // Skip if already in desired state
        if (currentlyApproved === approved) {
          console.log(`Skipping redundant ERC1155 approval for ${operator}`);
          continue;
        }
      }

      // Keep non-approval calls and necessary approvals
      optimized.push(call);
    }

    return optimized;
  }
}

// Singleton instance
let metaTxBuilderInstance: MetaTxBuilder | null = null;

export function getMetaTxBuilder(
  web3Service: Web3Service,
  proxyWalletService: ProxyWalletService,
  chainId: number
): MetaTxBuilder {
  if (!metaTxBuilderInstance) {
    metaTxBuilderInstance = new MetaTxBuilder(web3Service, proxyWalletService, chainId);
  }
  return metaTxBuilderInstance;
}
