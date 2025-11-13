import { db, storage } from './storage';
import { web3Service } from './contracts/web3Service';
import { CONTRACT_ADDRESSES } from './contracts/web3Service';
import { ethers } from 'ethers';

async function backfillMarketData() {
  console.log('Starting market data backfill...');
  
  const markets = await storage.getAllMarkets();
  console.log(`Found ${markets.length} markets to process`);
  
  for (const market of markets) {
    if (market.conditionId && market.yesTokenId && market.noTokenId) {
      console.log(`Market ${market.id} already has token data, skipping`);
      continue;
    }
    
    console.log(`\nProcessing market: ${market.question}`);
    
    try {
      // Generate questionId from market question (same method used in creation)
      const questionId = ethers.id(market.question);
      console.log(`Generated questionId: ${questionId}`);
      
      // Get conditionId from ConditionalTokens contract
      const conditionId = await web3Service.getConditionId(
        CONTRACT_ADDRESSES.MarketFactory,
        questionId,
        2 // binary outcome
      );
      console.log(`ConditionId: ${conditionId}`);
      
      // Get token IDs using MarketFactory.getMarket
      const marketData = await web3Service.marketFactory.getMarket(conditionId);
      console.log(`Market data from contract:`, marketData);
      
      const yesTokenId = marketData.yesTokenId.toString();
      const noTokenId = marketData.noTokenId.toString();
      
      console.log(`YES token ID: ${yesTokenId}`);
      console.log(`NO token ID: ${noTokenId}`);
      
      // Update database
      await storage.updateMarket(market.id, {
        conditionId,
        yesTokenId,
        noTokenId,
      });
      
      console.log(`✅ Updated market ${market.id}`);
    } catch (error) {
      console.error(`❌ Error processing market ${market.id}:`, error);
    }
  }
  
  console.log('\nBackfill complete!');
  process.exit(0);
}

backfillMarketData().catch(console.error);
