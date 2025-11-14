import { ethers } from 'ethers';
import {
  MockUSDTABI,
  ConditionalTokensABI,
  CTFExchangeABI,
  MarketFactoryABI,
  PythPriceResolverABI,
  FeeDistributorABI,
  ProxyWalletABI,
} from './abis';

// Contract addresses on Sepolia testnet
export const CONTRACT_ADDRESSES = {
  MockUSDT: '0x4041b89E54786F05744fCF13C1263a24164820AC',
  FeeDistributor: '0x8A87e6610A762505408b30dcB03266ea255616D1',
  ConditionalTokens: '0x27B0B87571e7908bAB95Dd374792bdC9634edfA4',
  CTFExchange: '0xA9DbBb8d093518912EE8b0f1c19d8B694B8f8d92',
  PythPriceResolver: '0x244DE5a1e2c0d0e158515bF3D47ba39cc878A411',
  MarketFactory: '0x9Ce05c79aEcfE70711A5471B562947EfdF53AD68',
  ProxyWallet: '0x4a373C230BE7574B905A31c43317EE912D3B65c7',
  PythOracle: '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21',
} as const;

export const SEPOLIA_CHAIN_ID = 11155111;

// EIP-712 domain for CTFExchange
export const EIP712_DOMAIN = {
  name: 'CTFExchange',
  version: '1',
  chainId: SEPOLIA_CHAIN_ID,
  verifyingContract: CONTRACT_ADDRESSES.CTFExchange,
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
  expiration: number; // Unix timestamp
  signature?: string;
}

export class Web3Service {
  private provider: ethers.JsonRpcProvider;
  
  // Contract instances
  public mockUSDT: ethers.Contract;
  public conditionalTokens: ethers.Contract;
  public ctfExchange: ethers.Contract;
  public marketFactory: ethers.Contract;
  public pythPriceResolver: ethers.Contract;
  public feeDistributor: ethers.Contract;
  public proxyWallet: ethers.Contract;

  constructor(rpcUrl?: string) {
    // Use provided RPC or Alchemy if available, fallback to public Sepolia
    let defaultRpcUrl = 'https://rpc.sepolia.org';
    
    if (process.env.ALCHEMY_API_KEY) {
      const alchemyKey = process.env.ALCHEMY_API_KEY;
      // Check if the key is already a full URL or just the API key
      if (alchemyKey.startsWith('http')) {
        defaultRpcUrl = alchemyKey;
      } else {
        defaultRpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
      }
    }
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultRpcUrl);

    // Initialize contract instances (read-only)
    this.mockUSDT = new ethers.Contract(
      CONTRACT_ADDRESSES.MockUSDT,
      MockUSDTABI,
      this.provider
    );

    this.conditionalTokens = new ethers.Contract(
      CONTRACT_ADDRESSES.ConditionalTokens,
      ConditionalTokensABI,
      this.provider
    );

    this.ctfExchange = new ethers.Contract(
      CONTRACT_ADDRESSES.CTFExchange,
      CTFExchangeABI,
      this.provider
    );

    this.marketFactory = new ethers.Contract(
      CONTRACT_ADDRESSES.MarketFactory,
      MarketFactoryABI,
      this.provider
    );

    this.pythPriceResolver = new ethers.Contract(
      CONTRACT_ADDRESSES.PythPriceResolver,
      PythPriceResolverABI,
      this.provider
    );

    this.feeDistributor = new ethers.Contract(
      CONTRACT_ADDRESSES.FeeDistributor,
      FeeDistributorABI,
      this.provider
    );

    this.proxyWallet = new ethers.Contract(
      CONTRACT_ADDRESSES.ProxyWallet,
      ProxyWalletABI,
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
   */
  async getUSDTBalance(address: string): Promise<bigint> {
    return await this.mockUSDT.balanceOf(address);
  }

  /**
   * Get token balance for conditional tokens
   */
  async getTokenBalance(address: string, tokenId: bigint): Promise<bigint> {
    return await this.conditionalTokens.balanceOf(address, tokenId);
  }

  /**
   * Listen to market creation events
   */
  onMarketCreated(callback: (conditionId: string, question: string, creator: string, expiresAt: number) => void) {
    this.marketFactory.on('MarketCreated', (conditionId, question, creator, expiresAt) => {
      callback(conditionId, question, creator, expiresAt);
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
   * Get latest price from Pyth price feed
   */
  async getLatestPrice(priceFeedId: string): Promise<{ price: bigint; conf: bigint; publishTime: bigint; expo: number } | null> {
    try {
      // Convert price feed ID to bytes32 format if needed
      const feedId = priceFeedId.startsWith('0x') ? priceFeedId : `0x${priceFeedId}`;
      
      // Get price from Pyth resolver - returns { price, conf, expo, publishTime }
      const priceData = await this.pythPriceResolver.getLatestPrice(feedId);
      
      return {
        price: priceData.price,
        conf: priceData.conf,
        publishTime: priceData.publishTime,
        expo: Number(priceData.expo), // Exponent for price normalization
      };
    } catch (error: any) {
      console.error(`Failed to fetch Pyth price for ${priceFeedId}:`, error.message);
      return null;
    }
  }

  /**
   * Get ProxyWallet balance for a user
   */
  async getProxyWalletBalance(userAddress: string): Promise<bigint> {
    return await this.proxyWallet.getBalance(userAddress);
  }

  /**
   * Get position balance in ProxyWallet
   */
  async getProxyPositionBalance(userAddress: string, tokenId: bigint): Promise<bigint> {
    return await this.proxyWallet.getPositionBalance(userAddress, tokenId);
  }

  /**
   * Get user's nonce in ProxyWallet
   */
  async getProxyWalletNonce(userAddress: string): Promise<bigint> {
    return await this.proxyWallet.getNonce(userAddress);
  }

  /**
   * Create a market on-chain via MarketFactory
   * Returns the conditionId and token IDs
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
    const factoryWithSigner = this.marketFactory.connect(signer) as any;
    
    // Convert questionId to bytes32 format
    const questionIdBytes32 = questionId.startsWith('0x') 
      ? questionId 
      : ethers.id(questionId);
    
    // Create market on-chain
    const tx = await factoryWithSigner.createMarket(
      questionIdBytes32,
      question,
      expiresAt
    );
    
    const receipt = await tx.wait();
    
    // Find MarketCreated event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return this.marketFactory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed: any) => parsed && parsed.name === 'MarketCreated');
    
    if (!event) {
      throw new Error('MarketCreated event not found in transaction receipt');
    }
    
    const conditionId = event.args.conditionId;
    
    // Calculate token IDs for YES (outcome 0) and NO (outcome 1)
    const yesTokenId = await this.getPositionId(
      CONTRACT_ADDRESSES.MockUSDT,
      conditionId,
      0
    );
    
    const noTokenId = await this.getPositionId(
      CONTRACT_ADDRESSES.MockUSDT,
      conditionId,
      1
    );
    
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
   */
  async isOperator(address: string): Promise<boolean> {
    try {
      return await this.ctfExchange.isOperator(address);
    } catch (error) {
      console.error('Error checking operator status:', error);
      return false;
    }
  }

  /**
   * Get market details from MarketFactory contract
   */
  async getMarketFromChain(conditionId: string): Promise<{
    conditionId: string;
    question: string;
    creator: string;
    expiresAt: bigint;
    resolved: boolean;
    yesTokenId: bigint;
    noTokenId: bigint;
  } | null> {
    try {
      const market = await this.marketFactory.getMarket(conditionId);
      return {
        conditionId: market.conditionId,
        question: market.question,
        creator: market.creator,
        expiresAt: market.expiresAt,
        resolved: market.resolved,
        yesTokenId: market.yesTokenId,
        noTokenId: market.noTokenId,
      };
    } catch (error) {
      console.error('Error fetching market from chain:', error);
      return null;
    }
  }

  /**
   * Stop listening to events
   */
  removeAllListeners() {
    this.marketFactory.removeAllListeners();
    this.ctfExchange.removeAllListeners();
  }
}

// Singleton instance
export const web3Service = new Web3Service();
