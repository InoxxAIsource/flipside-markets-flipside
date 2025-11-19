// Contract ABIs for the deployed Sepolia contracts
// These are minimal ABIs containing only the functions we need

export const MockUSDTABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
] as const;

// Gnosis Conditional Tokens - Core ERC1155 implementation
// Based on: https://github.com/gnosis/conditional-tokens-contracts
export const ConditionalTokensABI = [
  // Condition Management
  "function prepareCondition(address oracle, bytes32 questionId, uint256 outcomeSlotCount)",
  "function getConditionId(address oracle, bytes32 questionId, uint256 outcomeSlotCount) view returns (bytes32)",
  "function getOutcomeSlotCount(bytes32 conditionId) view returns (uint256)",
  
  // Position Management
  "function getPositionId(address collateralToken, bytes32 collectionId) view returns (uint256)",
  "function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint256 indexSet) pure returns (bytes32)",
  
  // Split/Merge Operations (Critical for trading)
  "function splitPosition(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)",
  "function mergePositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)",
  
  // Resolution & Redemption
  "function reportPayouts(bytes32 questionId, uint256[] memory payouts)",
  "function redeemPositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] memory indexSets) returns (uint256)",
  
  // ERC1155 Interface
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)",
  
  // Events
  "event ConditionPreparation(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount)",
  "event ConditionResolution(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount, uint256[] payoutNumerators)",
  "event PositionSplit(address indexed stakeholder, address collateralToken, bytes32 indexed parentCollectionId, bytes32 indexed conditionId, uint256[] partition, uint256 amount)",
  "event PositionsMerge(address indexed stakeholder, address collateralToken, bytes32 indexed parentCollectionId, bytes32 indexed conditionId, uint256[] partition, uint256 amount)",
  "event PayoutRedemption(address indexed redeemer, address indexed collateralToken, bytes32 indexed parentCollectionId, bytes32 conditionId, uint256[] indexSets, uint256 payout)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
] as const;

// Polymarket-Style CTFExchange with Auth System
// Based on: https://github.com/Polymarket/ctf-exchange
// Requires OPERATOR_ROLE for fillOrder/matchOrders, ADMIN for configuration
export const CTFExchangeABI = [
  // Core Trading Functions (onlyOperator)
  "function fillOrder((address maker,address makerAsset,address takerAsset,uint256 makerAmount,uint256 takerAmount,uint256 salt,uint256 expiry,uint8 side,bytes signature) order, uint256 fillAmount)",
  "function fillOrders((address maker,address makerAsset,address takerAsset,uint256 makerAmount,uint256 takerAmount,uint256 salt,uint256 expiry,uint8 side,bytes signature)[] orders, uint256[] fillAmounts)",
  "function matchOrders((address maker,address makerAsset,address takerAsset,uint256 makerAmount,uint256 takerAmount,uint256 salt,uint256 expiry,uint8 side,bytes signature) takerOrder, (address maker,address makerAsset,address takerAsset,uint256 makerAmount,uint256 takerAmount,uint256 salt,uint256 expiry,uint8 side,bytes signature)[] makerOrders, uint256 takerFillAmount, uint256[] makerFillAmounts)",
  
  // Token Registration (onlyAdmin)
  "function registerToken(uint256 token, uint256 complement, bytes32 conditionId)",
  "function getComplement(uint256 token) view returns (uint256)",
  "function getConditionId(uint256 token) view returns (bytes32)",
  
  // Role Management (AccessControl)
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function getRoleAdmin(bytes32 role) view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function OPERATOR_ROLE() view returns (bytes32)",
  
  // Pause/Unpause (onlyAdmin)
  "function pauseTrading()",
  "function unpauseTrading()",
  "function paused() view returns (bool)",
  
  // Configuration (onlyAdmin)
  "function setProxyFactory(address _newProxyFactory)",
  "function setSafeFactory(address _newSafeFactory)",
  
  // View Functions
  "function getCollateral() view returns (address)",
  "function getCtf() view returns (address)",
  "function getProxyFactory() view returns (address)",
  "function getSafeFactory() view returns (address)",
  
  // Order Status
  "function isOrderFilled(bytes32 orderHash) view returns (bool)",
  "function getOrderStatus(bytes32 orderHash) view returns (uint256)",
  
  // Events
  "event OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled, uint256 takerAmountFilled, uint256 fee)",
  "event OrdersMatched(bytes32 indexed takerOrderHash, bytes32[] makerOrderHashes, uint256 takerFilled, uint256[] makerFilled)",
  "event OrderCancelled(bytes32 indexed orderHash)",
  "event TokenRegistered(uint256 indexed token0, uint256 indexed token1, bytes32 indexed conditionId)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
  "event TradingPaused()",
  "event TradingUnpaused()",
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

// ProxyWalletFactory - Creates deterministic proxy wallets for gasless trading
// Based on: https://github.com/Polymarket/proxy-factories
export const ProxyWalletFactoryABI = [
  // Main entry point for gasless transactions
  "function proxy((address to, bytes data, uint256 value)[] calls) payable returns (bytes[] memory)",
  
  // Wallet Management
  "function getInstanceAddress(address implementation, address user) view returns (address)",
  "function maybeMakeWallet(address implementation, address instanceAddress, address user) returns (address)",
  
  // Configuration (Ownable)
  "function setImplementation(address _newImplementation)",
  "function getImplementation() view returns (address)",
  "function setGSNModule(address _newGSNModule)",
  
  // Events
  "event ProxyCreation(address indexed instance, address indexed user)",
  "event ImplementationUpdated(address indexed newImplementation)",
] as const;

// ProxyWallet - Individual user's proxy wallet (created by factory)
export const ProxyWalletABI = [
  // Batch execution
  "function executeBatch((address to, bytes data, uint256 value)[] calls) returns (bytes[] memory)",
  
  // Single execution
  "function execute(address to, bytes data, uint256 value) returns (bytes memory)",
  
  // Ownership
  "function getOwner() view returns (address)",
  
  // ERC1155 Receiver (to hold CTF tokens)
  "function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes data) returns (bytes4)",
  "function onERC1155BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data) returns (bytes4)",
  
  // Events
  "event ExecutionSuccess(address indexed to, uint256 value, bytes data, bytes returnData)",
  "event ExecutionFailure(address indexed to, uint256 value, bytes data)",
] as const;

// AMMPoolFactorySimple - Factory for creating constant-sum AMM pools
export const AMMPoolFactoryABI = [
  // Pool Creation
  "function createPool(string name, string symbol, bytes32 conditionId, address oracle, uint256 yesPositionId, uint256 noPositionId, uint256 lpFee, uint256 protocolFee) returns (address)",
  "function createPoolWithDefaults(string name, string symbol, bytes32 conditionId, address oracle, uint256 yesPositionId, uint256 noPositionId) returns (address)",
  
  // Pool Lookup
  "function getPool(bytes32 conditionId) view returns (address)",
  "function getPoolCount() view returns (uint256)",
  "function pools(bytes32 conditionId) view returns (address)",
  "function allPools(uint256 index) view returns (address)",
  
  // Configuration
  "function collateralToken() view returns (address)",
  "function conditionalTokens() view returns (address)",
  "function treasury() view returns (address)",
  "function defaultLPFee() view returns (uint256)",
  "function defaultProtocolFee() view returns (uint256)",
  
  // Events
  "event PoolCreated(address indexed pool, bytes32 indexed conditionId, uint256 yesPositionId, uint256 noPositionId, uint256 lpFee, uint256 protocolFee)",
] as const;

// AMMPool - Constant-sum AMM for binary prediction markets
export const AMMPoolABI = [
  // Swap
  "function swap(bool buyYes, uint256 amountIn, uint256 minAmountOut) returns (uint256 amountOut)",
  
  // Liquidity Management
  "function addLiquidity(uint256 yesAmount, uint256 noAmount, uint256 minLPTokens) returns (uint256 lpTokens)",
  "function removeLiquidity(uint256 lpTokens, uint256 minYesAmount, uint256 minNoAmount) returns (uint256 yesAmount, uint256 noAmount)",
  
  // Views
  "function getSwapOutput(bool buyYes, uint256 amountIn) view returns (uint256 amountOut, uint256 totalFee)",
  "function getYesPrice() view returns (uint256)",
  "function yesReserve() view returns (uint256)",
  "function noReserve() view returns (uint256)",
  "function resolved() view returns (bool)",
  "function winningOutcome() view returns (uint256)",
  
  // ERC20 (LP Tokens)
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  
  // Market Info
  "function conditionId() view returns (bytes32)",
  "function yesPositionId() view returns (uint256)",
  "function noPositionId() view returns (uint256)",
  "function oracle() view returns (address)",
  "function lpFeeRate() view returns (uint256)",
  "function protocolFeeRate() view returns (uint256)",
  
  // Events
  "event Swap(address indexed user, bool buyYes, uint256 amountIn, uint256 amountOut, uint256 lpFee, uint256 protocolFee)",
  "event LiquidityAdded(address indexed provider, uint256 yesAmount, uint256 noAmount, uint256 lpTokens)",
  "event LiquidityRemoved(address indexed provider, uint256 yesAmount, uint256 noAmount, uint256 lpTokens)",
  "event MarketResolved(uint256 winningOutcome)",
] as const;
