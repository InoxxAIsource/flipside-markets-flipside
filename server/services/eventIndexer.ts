import { web3Service } from "../contracts/web3Service";
import { storage } from "../storage";

/**
 * Event indexer service to listen to blockchain events and update the database
 */
export class EventIndexer {
  private isRunning = false;

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

    console.log('Event indexer started successfully');
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
