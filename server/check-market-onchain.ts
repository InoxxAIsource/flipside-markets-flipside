import { web3Service } from './contracts/web3Service';
import { CONTRACT_ADDRESSES } from './contracts/web3Service';
import { ethers } from 'ethers';

async function checkMarket() {
  console.log('Checking market on-chain...');
  
  const question = '"Will Bitcoin reach $110,000 by November 14th?"';
  const questionId = ethers.id(question);
  
  console.log(`Question: ${question}`);
  console.log(`QuestionId: ${questionId}`);
  
  // Manually calculate conditionId using the same formula as the contract
  const conditionId = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'bytes32', 'uint256'],
      [CONTRACT_ADDRESSES.MarketFactory, questionId, 2]
    )
  );
  
  console.log(`Calculated conditionId: ${conditionId}`);
  
  try {
    // Try to get market from MarketFactory
    const marketData = await web3Service.marketFactory.getMarket(conditionId);
    console.log('\n✅ Market found on-chain!');
    console.log('Market data:', {
      conditionId: marketData.conditionId,
      question: marketData.question,
      creator: marketData.creator,
      yesTokenId: marketData.yesTokenId.toString(),
      noTokenId: marketData.noTokenId.toString(),
    });
  } catch (error: any) {
    console.log('\n❌ Market NOT found on-chain');
    console.log('Error:', error.message);
    console.log('\nThe market exists in the database but was never created on the blockchain.');
    console.log('This is why tokenIds are missing and orders cannot be placed.');
  }
  
  process.exit(0);
}

checkMarket().catch(console.error);
