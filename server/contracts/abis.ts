// Contract ABIs for the deployed Sepolia contracts
// These are minimal ABIs containing only the functions we need

export const MockUSDTABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
] as const;

export const ConditionalTokensABI = [
  "function prepareCondition(address oracle, bytes32 questionId, uint256 outcomeSlotCount)",
  "function getConditionId(address oracle, bytes32 questionId, uint256 outcomeSlotCount) view returns (bytes32)",
  "function getPositionId(address collateralToken, bytes32 collectionId) view returns (uint256)",
  "function getOutcomeSlotCount(bytes32 conditionId) view returns (uint256)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function reportPayouts(bytes32 questionId, uint256[] memory payouts)",
  "function redeemPositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] memory indexSets) returns (uint256)",
  "event ConditionPreparation(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount)",
] as const;

export const CTFExchangeABI = [
  "function fillOrder((address maker, address taker, address tokenId, uint256 makerAmount, uint256 takerAmount, uint256 side, uint256 feeRateBps, uint256 nonce, uint256 signer, uint256 expiration, bytes signature) order, uint256 fillAmount)",
  "function cancelOrder(uint256 salt)",
  "function hashOrder((address maker, address taker, address tokenId, uint256 makerAmount, uint256 takerAmount, uint256 side, uint256 feeRateBps, uint256 nonce, uint256 signer, uint256 expiration) order) view returns (bytes32)",
  "function validateOrderSignature(bytes32 orderHash, (address maker, address taker, address tokenId, uint256 makerAmount, uint256 takerAmount, uint256 side, uint256 feeRateBps, uint256 nonce, uint256 signer, uint256 expiration, bytes signature) order) view returns (bool)",
  "event OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)",
  "event OrderCancelled(bytes32 indexed orderHash)",
] as const;

export const MarketFactoryABI = [
  "function createMarket(bytes32 questionId, string memory question, uint256 expiresAt) returns (bytes32)",
  "function getMarket(bytes32 conditionId) view returns (tuple(bytes32 conditionId, string question, address creator, uint256 expiresAt, bool resolved, uint256 yesTokenId, uint256 noTokenId))",
  "function resolveMarket(bytes32 conditionId, uint256[] memory payouts)",
  "event MarketCreated(bytes32 indexed conditionId, string question, address indexed creator, uint256 expiresAt)",
  "event MarketResolved(bytes32 indexed conditionId, uint256[] payouts)",
] as const;

export const PythPriceResolverABI = [
  "function resolveMarket(bytes32 conditionId, bytes[] memory priceUpdateData) payable",
  "function checkCondition(bytes32 conditionId, int64 price) view returns (bool)",
  "event MarketAutoResolved(bytes32 indexed conditionId, int64 price, bool outcome)",
] as const;

export const FeeDistributorABI = [
  "function distributeFees(bytes32 conditionId, uint256 amount)",
  "function claimFees(bytes32 conditionId)",
  "function getCreatorFees(bytes32 conditionId, address creator) view returns (uint256)",
  "event FeesDistributed(bytes32 indexed conditionId, uint256 platformFee, uint256 creatorFee)",
] as const;

export const ProxyWalletABI = [
  "function executeOrder(address exchange, bytes memory orderData) payable",
  "function withdrawToken(address token, uint256 amount)",
] as const;
