import { ethers } from 'ethers';
import {
  MockUSDTABI,
  ConditionalTokensABI,
  CTFExchangeABI,
  ProxyWalletABI,
  ProxyWalletFactoryABI,
} from './abis';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../config/contracts';

// EIP-712 domain for CTFExchange
export const EIP712_DOMAIN = {
  name: 'CTFExchange',
  version: '1',
  chainId: NETWORK_CONFIG.chainId,
  verifyingContract: CONTRACT_ADDRESSES.CTF_EXCHANGE,
} as const;

// EIP-712 types for limit orders
export const ORDER_TYPES = {
  Order: [
    { name: 'maker', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'side', type: 'uint8' }, // 0 = BUY, 1 = SELL
    { name: 'feeRateBps', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'signer', type: 'address' },
    { name: 'expiration', type: 'uint256' },
  ],
};

export interface Order {
  maker: string;
  taker: string; // address(0) for open orders
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  side: number; // 0 = BUY, 1 = SELL
  feeRateBps: number; // basis points (e.g., 250 = 2.5%)
  nonce: bigint;
  signer: string;
  expiration: bigint | number; // Unix timestamp (BigInt for signing, number for storage)
  signature?: string;
}

export class Web3Service {
  private provider: ethers.JsonRpcProvider;
  
  // Contract instances (deployed on Sepolia)
  public mockUSDT: ethers.Contract;
  public conditionalTokens: ethers.Contract;
  public ctfExchange: ethers.Contract;
  public proxyWalletImpl: ethers.Contract;
  public proxyWalletFactory: ethers.Contract;

  constructor(rpcUrl?: string) {
    // Use provided RPC or Alchemy if available, fallback to config RPC
    let defaultRpcUrl = NETWORK_CONFIG.rpcUrl;
    
    if (process.env.ALCHEMY_API_KEY) {
      const alchemyKey = process.env.ALCHEMY_API_KEY;
      if (alchemyKey.startsWith('http')) {
        defaultRpcUrl = alchemyKey;
      } else {
        defaultRpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
      }
    }
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultRpcUrl);

    // Initialize contract instances using deployed addresses
    this.mockUSDT = new ethers.Contract(
      CONTRACT_ADDRESSES.MOCK_USDT,
      MockUSDTABI,
      this.provider
    );

    this.conditionalTokens = new ethers.Contract(
      CONTRACT_ADDRESSES.CONDITIONAL_TOKENS,
      ConditionalTokensABI,
      this.provider
    );

    this.ctfExchange = new ethers.Contract(
      CONTRACT_ADDRESSES.CTF_EXCHANGE,
      CTFExchangeABI,
      this.provider
    );

    this.proxyWalletImpl = new ethers.Contract(
      CONTRACT_ADDRESSES.PROXY_WALLET_IMPL,
      ProxyWalletABI,
      this.provider
    );

    this.proxyWalletFactory = new ethers.Contract(
      CONTRACT_ADDRESSES.PROXY_WALLET_FACTORY,
      ProxyWalletFactoryABI,
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
   * Generate condition ID for a market
   */
  async getConditionId(
    oracle: string,
    questionId: string,
    outcomeSlotCount: number = 2
  ): Promise<string> {
    return await this.conditionalTokens.getConditionId(
      oracle,
      questionId,
      outcomeSlotCount
    );
  }

  /**
   * Get position ID (token ID) for an outcome
   */
  async getPositionId(
    collateralToken: string,
    conditionId: string,
    outcomeIndex: number
  ): Promise<bigint> {
    // Collection ID for binary outcomes
    const collectionId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'uint256'],
        [conditionId, 1 << outcomeIndex]
      )
    );
    
    return await this.conditionalTokens.getPositionId(collateralToken, collectionId);
  }

  /**
   * Create EIP-712 signature for a limit order
   */
  async signOrder(order: Order, signer: ethers.Wallet): Promise<string> {
    const domain = EIP712_DOMAIN;
    const types = ORDER_TYPES;
    const value = {
      maker: order.maker,
      taker: order.taker,
      tokenId: order.tokenId,
      makerAmount: order.makerAmount,
      takerAmount: order.takerAmount,
      side: order.side,
      feeRateBps: order.feeRateBps,
      nonce: order.nonce,
      signer: order.signer,
      expiration: order.expiration,
    };

    return await signer.signTypedData(domain, types, value);
  }

  /**
   * Verify an order signature
   */
  async verifyOrderSignature(order: Order, signature: string): Promise<boolean> {
    const domain = EIP712_DOMAIN;
    const types = ORDER_TYPES;
    const value = {
      maker: order.maker,
      taker: order.taker,
      tokenId: order.tokenId,
      makerAmount: order.makerAmount,
      takerAmount: order.takerAmount,
      side: order.side,
      feeRateBps: order.feeRateBps,
      nonce: order.nonce,
      signer: order.signer,
      expiration: order.expiration,
    };

    const digest = ethers.TypedDataEncoder.hash(domain, types, value);
    const recoveredAddress = ethers.recoverAddress(digest, signature);
    
    return recoveredAddress.toLowerCase() === order.maker.toLowerCase();
  }

  /**
   * Hash an order for tracking
   */
  hashOrder(order: Order): string {
    const domain = EIP712_DOMAIN;
    const types = ORDER_TYPES;
    const value = {
      maker: order.maker,
      taker: order.taker,
      tokenId: order.tokenId,
      makerAmount: order.makerAmount,
      takerAmount: order.takerAmount,
      side: order.side,
      feeRateBps: order.feeRateBps,
      nonce: order.nonce,
      signer: order.signer,
      expiration: order.expiration,
    };

    return ethers.TypedDataEncoder.hash(domain, types, value);
  }

  /**
   * Get USDT balance for an address
   * Includes retry logic for improved reliability
   */
  async getUSDTBalance(address: string, retries = 3): Promise<bigint> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.mockUSDT.balanceOf(address);
      } catch (error: any) {
        if (attempt === retries) {
          console.error(`Failed to get USDT balance after ${retries} attempts:`, error);
          throw error;
        }
        // Exponential backoff: 500ms, 1000ms, 1500ms
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
    throw new Error('Failed to get USDT balance');
  }

  /**
   * Get token balance for conditional tokens
   * Includes retry logic for improved reliability
   */
  async getTokenBalance(address: string, tokenId: bigint, retries = 3): Promise<bigint> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.conditionalTokens.balanceOf(address, tokenId);
      } catch (error: any) {
        if (attempt === retries) {
          console.error(`Failed to get token balance after ${retries} attempts:`, error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
    throw new Error('Failed to get token balance');
  }

  /**
   * Get ETH balance for an address
   * Includes retry logic for improved reliability
   */
  async getETHBalance(address: string, retries = 3): Promise<bigint> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.provider.getBalance(address);
      } catch (error: any) {
        if (attempt === retries) {
          console.error(`Failed to get ETH balance after ${retries} attempts:`, error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
    throw new Error('Failed to get ETH balance');
  }

  /**
   * Listen to condition preparation events (market creation)
   */
  onConditionPreparation(callback: (conditionId: string, oracle: string, questionId: string, outcomeSlotCount: number) => void) {
    this.conditionalTokens.on('ConditionPreparation', (conditionId, oracle, questionId, outcomeSlotCount) => {
      callback(conditionId, oracle, questionId, outcomeSlotCount);
    });
  }

  /**
   * Listen to order filled events
   */
  onOrderFilled(callback: (orderHash: string, maker: string, taker: string, makerAmount: bigint, takerAmount: bigint, fee: bigint) => void) {
    this.ctfExchange.on('OrderFilled', (orderHash, maker, taker, makerAssetId, takerAssetId, makerAmount, takerAmount, fee) => {
      callback(orderHash, maker, taker, makerAmount, takerAmount, fee);
    });
  }

  /**
   * Create a market on-chain via ConditionalTokens.prepareCondition
   * Returns the conditionId and token IDs
   * 
   * Flow:
   * 1. Call prepareCondition on ConditionalTokens with oracle (this contract's deployer), questionId, outcomeSlotCount=2
   * 2. Calculate conditionId from oracle, questionId, outcomeSlotCount
   * 3. Derive YES/NO token position IDs
   * 4. Return all IDs for database storage
   */
  async createMarketOnChain(
    questionId: string,
    question: string,
    expiresAt: number,
    signer: ethers.Wallet
  ): Promise<{
    conditionId: string;
    yesTokenId: string;
    noTokenId: string;
    txHash: string;
  }> {
    const conditionalTokensWithSigner = this.conditionalTokens.connect(signer) as any;
    
    // Convert questionId to bytes32 format
    const questionIdBytes32 = questionId.startsWith('0x') 
      ? questionId 
      : ethers.id(questionId);
    
    // Oracle is the signer (who will resolve the market later)
    const oracle = signer.address;
    const outcomeSlotCount = 2; // Binary market: YES/NO
    
    // Prepare condition on ConditionalTokens
    const tx = await conditionalTokensWithSigner.prepareCondition(
      oracle,
      questionIdBytes32,
      outcomeSlotCount
    );
    
    const receipt = await tx.wait();
    
    // Calculate condition ID deterministically
    const conditionId = await this.getConditionId(oracle, questionIdBytes32, outcomeSlotCount);
    
    // Calculate token IDs for YES (outcome 0) and NO (outcome 1)
    const yesTokenId = await this.getPositionId(
      CONTRACT_ADDRESSES.MOCK_USDT,
      conditionId,
      0
    );
    
    const noTokenId = await this.getPositionId(
      CONTRACT_ADDRESSES.MOCK_USDT,
      conditionId,
      1
    );
    
    console.log(`Market created: conditionId=${conditionId}, YES=${yesTokenId}, NO=${noTokenId}`);
    
    return {
      conditionId,
      yesTokenId: yesTokenId.toString(),
      noTokenId: noTokenId.toString(),
      txHash: receipt.hash,
    };
  }

  /**
   * Register a token with CTFExchange for trading
   * Must be called by admin/operator
   */
  async registerTokenWithExchange(
    tokenId: string,
    complementTokenId: string,
    conditionId: string,
    signer: ethers.Wallet
  ): Promise<string> {
    const exchangeWithSigner = this.ctfExchange.connect(signer) as any;
    
    const tx = await exchangeWithSigner.registerToken(
      tokenId,
      complementTokenId,
      conditionId
    );
    
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Check if relayer wallet is authorized as operator on CTFExchange
   * Uses AccessControl's hasRole() with OPERATOR_ROLE
   */
  async isOperator(address: string): Promise<boolean> {
    try {
      const operatorRole = await this.ctfExchange.OPERATOR_ROLE();
      return await this.ctfExchange.hasRole(operatorRole, address);
    } catch (error) {
      console.error('Error checking operator status:', error);
      return false;
    }
  }

  /**
   * Stop listening to events
   */
  removeAllListeners() {
    this.conditionalTokens.removeAllListeners();
    this.ctfExchange.removeAllListeners();
  }
}

// Singleton instance
export const web3Service = new Web3Service();
