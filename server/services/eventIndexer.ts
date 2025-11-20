import { web3Service } from "../contracts/web3Service";
import { storage } from "../storage";
import { ethers } from "ethers";
import { AMMPoolABI } from "../contracts/abis";

/**
 * Event indexer service to listen to blockchain events and update the database
 */
export class EventIndexer {
  private isRunning = false;
  private poolListeners: Map<string, ethers.Contract> = new Map();

  /**
   * Start listening to blockchain events
   */
  start() {
    if (this.isRunning) {
      console.log('Event indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting event indexer...');

    // Listen to condition preparation events (market creation)
    web3Service.onConditionPreparation(async (conditionId, oracle, questionId, outcomeSlotCount) => {
      console.log('Condition prepared event:', { conditionId, oracle, questionId, outcomeSlotCount });
      
      try {
        // Check if market already exists in database
        const existingMarket = await storage.getAllMarkets();
        const exists = existingMarket.some(m => m.conditionId === conditionId);
        
        if (!exists) {
          console.log('New condition detected on-chain, syncing to database...');
          // Markets are created via API which calls prepareCondition and stores in DB
        }
      } catch (error) {
        console.error('Error processing condition preparation event:', error);
      }
    });

    // Listen to order filled events
    web3Service.onOrderFilled(async (orderHash, maker, taker, makerAmount, takerAmount, fee) => {
      console.log('Order filled event:', { 
        orderHash, 
        maker, 
        taker, 
        makerAmount: makerAmount.toString(), 
        takerAmount: takerAmount.toString(),
        fee: fee.toString()
      });
      
      try {
        // Find the order in our database by matching maker address and amounts
        const userOrders = await storage.getUserOrders(maker);
        const matchingOrder = userOrders.find(order => {
          // Match by maker and approximate amounts (accounting for decimals)
          const orderAmount = BigInt(Math.floor(order.size * 1e18));
          return Math.abs(Number(orderAmount - makerAmount)) < 1e15;
        });

        if (matchingOrder) {
          // Update the order fill with transaction details
          const fills = await storage.getOrderFills(matchingOrder.id);
          const latestFill = fills[0]; // Most recent fill
          
          if (latestFill && !latestFill.txHash) {
            // We'll update this when we get block confirmation
            console.log(`Matched fill for order ${matchingOrder.id}`);
          }
        }
      } catch (error) {
        console.error('Error processing order filled event:', error);
      }
    });

    // Listen to PositionsMerge events (Sell All feature)
    web3Service.onPositionsMerge(async (stakeholder, collateralToken, conditionId, amount, event) => {
      console.log('PositionsMerge event:', { 
        stakeholder, 
        collateralToken, 
        conditionId, 
        amount: amount.toString() 
      });
      
      try {
        // Find the market by conditionId
        const markets = await storage.getAllMarkets();
        const market = markets.find(m => m.conditionId === conditionId);
        
        if (!market) {
          console.warn(`Market not found for conditionId: ${conditionId}`);
          return;
        }

        // Get transaction details
        const txHash = event.log?.transactionHash || '';
        const blockNumber = event.log?.blockNumber || 0;

        // Calculate USDT received (amount is in wei, convert to USDT with 18 decimals)
        const collateralReceived = Number(amount) / 1e18;

        // For merge operations, the user is merging equal amounts of YES and NO tokens
        // The amount parameter represents how much collateral they receive back
        const tokenAmount = collateralReceived;

        console.log(`Creating position merge record: ${tokenAmount} YES+NO → ${collateralReceived} USDT`);

        // Store the merge transaction
        await storage.createPositionMerge({
          marketId: market.id,
          userAddress: stakeholder.toLowerCase(),
          conditionId,
          yesAmount: tokenAmount,
          noAmount: tokenAmount,
          collateralReceived,
          txHash,
          blockNumber,
        });

        console.log(`✅ Position merge indexed: ${collateralReceived} USDT returned to ${stakeholder}`);
      } catch (error) {
        console.error('Error processing PositionsMerge event:', error);
      }
    });

    // Listen to PayoutRedemption events (claiming winnings after resolution)
    web3Service.onPayoutRedemption(async (redeemer, collateralToken, conditionId, payout, event) => {
      console.log('PayoutRedemption event:', { 
        redeemer, 
        collateralToken, 
        conditionId, 
        payout: payout.toString() 
      });
      
      try {
        // Find the market by conditionId
        const markets = await storage.getAllMarkets();
        const market = markets.find(m => m.conditionId === conditionId);
        
        if (!market) {
          console.warn(`Market not found for conditionId: ${conditionId}`);
          return;
        }

        // Get transaction details
        const txHash = event.log?.transactionHash || '';
        const blockNumber = event.log?.blockNumber || 0;

        // Calculate USDT received (payout is in wei, convert to USDT with 18 decimals)
        const collateralReceived = Number(payout) / 1e18;

        console.log(`Creating payout redemption record: ${collateralReceived} USDT claimed`);

        // Store the redemption as a position merge (it's essentially the same - converting tokens to collateral)
        // For redemptions, we don't know the exact split of YES/NO, so we record the payout amount
        await storage.createPositionMerge({
          marketId: market.id,
          userAddress: redeemer.toLowerCase(),
          conditionId,
          yesAmount: 0, // Unknown for redemptions
          noAmount: 0, // Unknown for redemptions
          collateralReceived,
          txHash,
          blockNumber,
        });

        console.log(`✅ Payout redemption indexed: ${collateralReceived} USDT claimed by ${redeemer}`);
      } catch (error) {
        console.error('Error processing PayoutRedemption event:', error);
      }
    });

    // Set up AMM pool swap event listeners
    this.setupAMMPoolListeners().catch(error => {
      console.error('Error setting up AMM pool listeners:', error);
    });

    console.log('Event indexer started successfully');
  }

  /**
   * Set up event listeners for all AMM pools
   */
  private async setupAMMPoolListeners() {
    try {
      // Get all POOL markets
      const markets = await storage.getAllMarkets();
      const poolMarkets = markets.filter(m => m.marketType === 'POOL' && m.poolAddress);

      console.log(`Setting up AMM swap listeners for ${poolMarkets.length} pools...`);

      for (const market of poolMarkets) {
        const poolAddress = market.poolAddress!;
        
        // Skip if already listening
        if (this.poolListeners.has(poolAddress)) {
          continue;
        }

        // Create contract instance
        const provider = web3Service.getProvider();
        const pool = new ethers.Contract(poolAddress, AMMPoolABI, provider);
        this.poolListeners.set(poolAddress, pool);

        // Listen for Swap events
        pool.on('Swap', async (user: string, buyYes: boolean, amountIn: bigint, amountOut: bigint, lpFee: bigint, protocolFee: bigint, event: ethers.Log) => {
          console.log('AMM Swap event:', {
            pool: poolAddress,
            user,
            buyYes,
            amountIn: amountIn.toString(),
            amountOut: amountOut.toString(),
            lpFee: lpFee.toString(),
            protocolFee: protocolFee.toString(),
            txHash: event.transactionHash,
          });

          try {
            // Get transaction details for block number
            const tx = await event.getTransaction();
            const blockNumber = event.blockNumber;

            // Convert amounts from wei (6 decimals for USDT)
            const amountInUSDT = Number(amountIn) / 1e6;
            const amountOutUSDT = Number(amountOut) / 1e6;
            const lpFeeUSDT = Number(lpFee) / 1e6;
            const protocolFeeUSDT = Number(protocolFee) / 1e6;

            // Store swap in database (normalize addresses to lowercase)
            await storage.createAmmSwap({
              marketId: market.id,
              poolAddress: poolAddress.toLowerCase(),
              userAddress: user.toLowerCase(),
              buyYes,
              amountIn: amountInUSDT,
              amountOut: amountOutUSDT,
              lpFee: lpFeeUSDT,
              protocolFee: protocolFeeUSDT,
              txHash: event.transactionHash!,
              blockNumber,
            });

            // Update market volume atomically (prevents race conditions)
            await storage.incrementMarketVolume(market.id, amountInUSDT);

            console.log(`✅ AMM swap indexed: ${amountInUSDT} USDT → ${amountOutUSDT} tokens (${buyYes ? 'YES' : 'NO'})`);
          } catch (error) {
            console.error('Error processing AMM swap event:', error);
          }
        });

        console.log(`✅ Listening to swaps on pool ${poolAddress}`);
      }
    } catch (error) {
      console.error('Error in setupAMMPoolListeners:', error);
    }
  }

  /**
   * Stop listening to blockchain events
   */
  stop() {
    if (!this.isRunning) {
      console.log('Event indexer is not running');
      return;
    }

    console.log('Stopping event indexer...');
    web3Service.removeAllListeners();
    
    // Remove all AMM pool listeners
    for (const [poolAddress, pool] of this.poolListeners) {
      pool.removeAllListeners();
      console.log(`Stopped listening to pool ${poolAddress}`);
    }
    this.poolListeners.clear();
    
    this.isRunning = false;
    console.log('Event indexer stopped');
  }

  /**
   * Check if indexer is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export const eventIndexer = new EventIndexer();
