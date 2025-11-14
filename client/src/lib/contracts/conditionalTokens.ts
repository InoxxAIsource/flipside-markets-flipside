import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/web3';

const ConditionalTokensABI = [
  "function prepareCondition(address oracle, bytes32 questionId, uint256 outcomeSlotCount)",
  "function getConditionId(address oracle, bytes32 questionId, uint256 outcomeSlotCount) view returns (bytes32)",
  "function getPositionId(address collateralToken, bytes32 collectionId) view returns (uint256)",
  "function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint256 indexSet) pure returns (bytes32)",
  "event ConditionPreparation(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount)",
] as const;

export interface MarketCreationResult {
  conditionId: string;
  yesTokenId: string;
  noTokenId: string;
  txHash: string;
}

export function buildQuestionId(question: string, timestamp?: number): string {
  const ts = timestamp || Date.now();
  return ethers.id(`${question}_${ts}`);
}

export async function getConditionalTokensContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.ConditionalTokens,
    ConditionalTokensABI,
    signerOrProvider
  );
}

export async function prepareMarketCondition(
  oracle: string,
  question: string,
  signer: ethers.Signer
): Promise<MarketCreationResult> {
  const contract = await getConditionalTokensContract(signer);
  
  const questionId = buildQuestionId(question);
  const outcomeSlotCount = 2;

  const tx = await contract.prepareCondition(oracle, questionId, outcomeSlotCount);
  const receipt = await tx.wait();

  const conditionId = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'bytes32', 'uint256'],
      [oracle, questionId, outcomeSlotCount]
    )
  );

  const yesTokenId = await calculateTokenId(contract, conditionId, 0);
  const noTokenId = await calculateTokenId(contract, conditionId, 1);

  return {
    conditionId,
    yesTokenId: yesTokenId.toString(),
    noTokenId: noTokenId.toString(),
    txHash: receipt.hash,
  };
}

async function calculateTokenId(
  contract: ethers.Contract,
  conditionId: string,
  outcomeIndex: number
): Promise<bigint> {
  const parentCollectionId = ethers.ZeroHash;
  const indexSet = 1 << outcomeIndex;
  
  const collectionId = await contract.getCollectionId(
    parentCollectionId,
    conditionId,
    indexSet
  );
  
  const positionId = await contract.getPositionId(
    CONTRACT_ADDRESSES.MockUSDT,
    collectionId
  );
  
  return positionId;
}

export async function verifyConditionExists(
  conditionId: string,
  provider: ethers.Provider
): Promise<boolean> {
  try {
    const contract = await getConditionalTokensContract(provider);
    const outcomeSlotCount = await contract.getOutcomeSlotCount(conditionId);
    return outcomeSlotCount > 0;
  } catch {
    return false;
  }
}
