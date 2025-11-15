import { ethers } from 'ethers';
import { web3Service } from '../contracts/web3Service';
import { getProxyWalletService } from './proxyWalletService';

interface MetaTransaction {
  id: string;
  user: string;
  target: string;
  data: string;
  signature: string;
  deadline: number;
  nonce: number;
  status: 'pending' | 'relayed' | 'confirmed' | 'failed';
  txHash?: string;
  error?: string;
  createdAt: Date;
}

export class RelayerService {
  private relayerWallet: ethers.Wallet;
  private metaTxQueue: Map<string, MetaTransaction> = new Map();
  private processing = false;
  private readonly MIN_ETH_BALANCE = ethers.parseEther('0.1');
  private userNonces: Map<string, number> = new Map();
  private readonly RATE_LIMIT = 10; // Max 10 transactions per user per minute
  private userTxTimestamps: Map<string, number[]> = new Map();

  constructor() {
    if (!process.env.RELAYER_PRIVATE_KEY) {
      throw new Error('RELAYER_PRIVATE_KEY environment variable is required');
    }

    this.relayerWallet = web3Service.getSigner(process.env.RELAYER_PRIVATE_KEY);
    console.log(`Relayer wallet address: ${this.relayerWallet.address}`);

    // Start monitoring relayer balance
    this.monitorBalance();
    
    // Start processing queue
    this.processQueue();
  }

  /**
   * Monitor relayer wallet ETH balance
   */
  private async monitorBalance() {
    try {
      const balance = await web3Service.getProvider().getBalance(this.relayerWallet.address);
      console.log(`Relayer ETH balance: ${ethers.formatEther(balance)} ETH`);

      if (balance < this.MIN_ETH_BALANCE) {
        console.error(`⚠️  ALERT: Relayer balance (${ethers.formatEther(balance)} ETH) is below minimum threshold (${ethers.formatEther(this.MIN_ETH_BALANCE)} ETH)`);
      }
    } catch (error: any) {
      console.error('Failed to check relayer balance:', error.message);
    }

    // Check balance every 5 minutes
    setTimeout(() => this.monitorBalance(), 5 * 60 * 1000);
  }

  /**
   * Check if user has exceeded rate limit
   */
  private checkRateLimit(userAddress: string): boolean {
    const now = Date.now();
    const userTxs = this.userTxTimestamps.get(userAddress.toLowerCase()) || [];
    
    // Remove timestamps older than 1 minute
    const recentTxs = userTxs.filter(timestamp => now - timestamp < 60000);
    this.userTxTimestamps.set(userAddress.toLowerCase(), recentTxs);

    return recentTxs.length >= this.RATE_LIMIT;
  }

  /**
   * Record a new transaction for rate limiting
   */
  private recordTransaction(userAddress: string) {
    const now = Date.now();
    const userTxs = this.userTxTimestamps.get(userAddress.toLowerCase()) || [];
    userTxs.push(now);
    this.userTxTimestamps.set(userAddress.toLowerCase(), userTxs);
  }

  /**
   * Get latest user nonce from chain (always fetches to avoid desync)
   */
  private async getUserNonce(userAddress: string): Promise<number> {
    try {
      const proxyWalletService = getProxyWalletService(web3Service, '', '');
      const nonce = await proxyWalletService.getNonce(userAddress);
      return Number(nonce);
    } catch (error) {
      console.error(`Failed to fetch nonce for ${userAddress}, using 0:`, error);
      return 0;
    }
  }

  /**
   * Invalidate cached nonce (no longer used, kept for compatibility)
   */
  private incrementUserNonce(userAddress: string) {
    // Noop - we fetch fresh nonce each time to prevent desync
  }

  /**
   * Add a meta-transaction to the queue
   */
  async addMetaTransaction(
    user: string,
    target: string,
    data: string,
    signature: string,
    deadline: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> {
    // Check rate limit
    if (this.checkRateLimit(user)) {
      return {
        success: false,
        error: 'Rate limit exceeded. Maximum 10 transactions per minute.',
      };
    }

    // Check deadline
    if (Math.floor(Date.now() / 1000) > deadline) {
      return {
        success: false,
        error: 'Transaction deadline has passed',
      };
    }

    // Get user nonce
    const nonce = await this.getUserNonce(user);

    const txId = ethers.id(JSON.stringify({ user, target, data, nonce, deadline }));

    const metaTx: MetaTransaction = {
      id: txId,
      user,
      target,
      data,
      signature,
      deadline,
      nonce,
      status: 'pending',
      createdAt: new Date(),
    };

    this.metaTxQueue.set(txId, metaTx);
    this.recordTransaction(user);

    console.log(`Meta-transaction queued: ${txId} (user: ${user}, nonce: ${nonce})`);

    return {
      success: true,
      txId,
    };
  }

  /**
   * Process the meta-transaction queue
   */
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      const pendingTxs = Array.from(this.metaTxQueue.values())
        .filter(tx => tx.status === 'pending')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      for (const metaTx of pendingTxs) {
        try {
          await this.executeMetaTransaction(metaTx);
        } catch (error: any) {
          console.error(`Failed to execute meta-tx ${metaTx.id}:`, error.message);
          metaTx.status = 'failed';
          metaTx.error = error.message;
        }

        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      this.processing = false;

      // Clean up old completed/failed transactions (keep only last 1000)
      const completed = Array.from(this.metaTxQueue.values())
        .filter(tx => tx.status === 'confirmed' || tx.status === 'failed')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (completed.length > 1000) {
        completed.slice(1000).forEach(tx => this.metaTxQueue.delete(tx.id));
      }

      // Process queue every 2 seconds
      setTimeout(() => this.processQueue(), 2000);
    }
  }

  /**
   * Execute a single meta-transaction
   */
  private async executeMetaTransaction(metaTx: MetaTransaction) {
    console.log(`Executing meta-tx ${metaTx.id}...`);
    metaTx.status = 'relayed';

    try {
      // Get ProxyWallet contract with relayer signer
      const proxyWallet = web3Service.proxyWallet.connect(this.relayerWallet);

      // Execute the meta-transaction
      const tx = await proxyWallet.executeMetaTransaction(
        metaTx.signature,
        metaTx.user,
        metaTx.data
      );

      metaTx.txHash = tx.hash;
      console.log(`Meta-tx ${metaTx.id} submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        metaTx.status = 'confirmed';
        this.incrementUserNonce(metaTx.user);
        console.log(`Meta-tx ${metaTx.id} confirmed in block ${receipt.blockNumber}`);
      } else {
        metaTx.status = 'failed';
        metaTx.error = 'Transaction reverted';
        console.error(`Meta-tx ${metaTx.id} reverted`);
      }
    } catch (error: any) {
      metaTx.status = 'failed';
      metaTx.error = error.message;
      console.error(`Meta-tx ${metaTx.id} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(txId: string): MetaTransaction | null {
    return this.metaTxQueue.get(txId) || null;
  }

  /**
   * Get all transactions for a user
   */
  getUserTransactions(userAddress: string): MetaTransaction[] {
    return Array.from(this.metaTxQueue.values())
      .filter(tx => tx.user.toLowerCase() === userAddress.toLowerCase())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const allTxs = Array.from(this.metaTxQueue.values());
    return {
      total: allTxs.length,
      pending: allTxs.filter(tx => tx.status === 'pending').length,
      relayed: allTxs.filter(tx => tx.status === 'relayed').length,
      confirmed: allTxs.filter(tx => tx.status === 'confirmed').length,
      failed: allTxs.filter(tx => tx.status === 'failed').length,
    };
  }

  /**
   * Get relayer wallet address
   */
  getRelayerAddress(): string {
    return this.relayerWallet.address;
  }
}

// Singleton instance
export const relayerService = new RelayerService();
