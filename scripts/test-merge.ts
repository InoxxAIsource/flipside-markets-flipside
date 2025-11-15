import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../server/config/contracts';

const MockUSDTABI = [
  'function balanceOf(address) view returns (uint256)',
];

const ProxyWalletFactoryABI = [
  'function getInstanceAddress(address implementation, address user) view returns (address)',
];

const ProxyWalletABI = [
  'function nonces(address user) view returns (uint256)',
];

const ConditionalTokensABI = [
  'function balanceOf(address owner, uint256 positionId) view returns (uint256)',
  'function mergePositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)',
  'function getPositionId(address collateralToken, bytes32 collectionId) pure returns (uint256)',
  'function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint256 indexSet) pure returns (bytes32)',
];

async function main() {
  console.log('🧪 Testing Merge Operation (YES+NO → USDT)\n');

  // Setup
  const rpcUrl = process.env.ALCHEMY_API_KEY || 'https://rpc.sepolia.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const testPrivateKey = process.env.TEST_PRIVATE_KEY || process.env.OWNER_PRIVATE_KEY!;
  const wallet = new ethers.Wallet(testPrivateKey, provider);
  const userAddress = wallet.address;

  console.log(`👤 Test wallet: ${userAddress}`);

  // Get proxy address
  const factory = new ethers.Contract(CONTRACT_ADDRESSES.PROXY_WALLET_FACTORY, ProxyWalletFactoryABI, provider);
  const proxyAddress = await factory.getInstanceAddress(
    CONTRACT_ADDRESSES.PROXY_WALLET_IMPL,
    userAddress
  );
  console.log(`📦 Proxy wallet: ${proxyAddress}\n`);

  // Get market info
  const marketResponse = await fetch('http://localhost:5000/api/markets');
  const markets = await marketResponse.json();
  const market = markets[0];
  const conditionId = market.conditionId;
  
  console.log(`📊 Market: ${market.question}`);
  console.log(`🔑 ConditionId: ${conditionId}\n`);

  // Check current balances
  const usdt = new ethers.Contract(CONTRACT_ADDRESSES.MOCK_USDT, MockUSDTABI, provider);
  const conditionalTokens = new ethers.Contract(CONTRACT_ADDRESSES.CONDITIONAL_TOKENS, ConditionalTokensABI, provider);
  
  const usdtBalance = await usdt.balanceOf(proxyAddress);
  console.log(`💵 Proxy USDT balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);

  // Get position IDs for YES and NO tokens
  const yesCollectionId = await conditionalTokens.getCollectionId(
    ethers.ZeroHash, // parentCollectionId
    conditionId,
    1 // YES outcome (index 0, bitmask 1)
  );
  const noCollectionId = await conditionalTokens.getCollectionId(
    ethers.ZeroHash,
    conditionId,
    2 // NO outcome (index 1, bitmask 2)
  );

  const yesPositionId = await conditionalTokens.getPositionId(CONTRACT_ADDRESSES.MOCK_USDT, yesCollectionId);
  const noPositionId = await conditionalTokens.getPositionId(CONTRACT_ADDRESSES.MOCK_USDT, noCollectionId);

  const yesBalance = await conditionalTokens.balanceOf(proxyAddress, yesPositionId);
  const noBalance = await conditionalTokens.balanceOf(proxyAddress, noPositionId);

  console.log(`✅ YES token balance: ${ethers.formatUnits(yesBalance, 6)}`);
  console.log(`❌ NO token balance: ${ethers.formatUnits(noBalance, 6)}\n`);

  // Determine merge amount (minimum of YES and NO balances)
  const mergeAmount = yesBalance < noBalance ? yesBalance : noBalance;
  
  if (mergeAmount === 0n) {
    console.log('⚠️  No tokens to merge! Need equal YES+NO tokens.');
    console.log('   Run the split test first to get some tokens.');
    return;
  }

  console.log(`🔄 Merging ${ethers.formatUnits(mergeAmount, 6)} YES+NO tokens back to USDT...\n`);

  // Encode mergePositions call
  const ctInterface = new ethers.Interface(ConditionalTokensABI);
  const mergeData = ctInterface.encodeFunctionData('mergePositions', [
    CONTRACT_ADDRESSES.MOCK_USDT,
    ethers.ZeroHash, // parentCollectionId
    conditionId,
    [1, 2], // partition for binary outcome
    mergeAmount,
  ]);

  // Get nonce
  const proxy = new ethers.Contract(proxyAddress, ProxyWalletABI, provider);
  const nonce = await proxy.nonces(userAddress);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  // Create EIP-712 signature
  const domain = {
    name: 'ProxyWallet',
    version: '1',
    chainId: 11155111, // Sepolia
    verifyingContract: proxyAddress,
  };

  const types = {
    MetaTransaction: [
      { name: 'user', type: 'address' },
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const value = {
    user: userAddress,
    target: CONTRACT_ADDRESSES.CONDITIONAL_TOKENS,
    data: mergeData,
    nonce,
    deadline,
  };

  console.log('🖊️  Signing EIP-712 meta-transaction...');
  const signature = await wallet.signTypedData(domain, types, value);

  // Submit to relayer
  console.log('📤 Submitting to relayer...');
  const metaTxResponse = await fetch('http://localhost:5000/api/proxy/meta-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: userAddress,
      target: CONTRACT_ADDRESSES.CONDITIONAL_TOKENS,
      data: mergeData,
      signature,
      deadline: deadline.toString(),
    }),
  });

  const metaTxResult = await metaTxResponse.json();

  if (!metaTxResult.success) {
    console.log(`❌ Failed: ${metaTxResult.error}`);
    return;
  }

  console.log(`✅ Meta-transaction submitted: ${metaTxResult.txId}`);
  console.log('⏳ Waiting for relayer to process...\n');

  // Poll for status
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const statusResponse = await fetch(`http://localhost:5000/api/proxy/meta-transaction/${metaTxResult.txId}`);
    const status = await statusResponse.json();

    if (status.status === 'confirmed') {
      console.log(`✅ Merge confirmed! Tx: ${status.txHash}\n`);
      break;
    } else if (status.status === 'failed') {
      console.log(`❌ Merge failed: ${status.error}\n`);
      return;
    } else {
      console.log(`   ⏳ Status: ${status.status}`);
    }
  }

  // Check final balances
  console.log('📊 Final Balances:');
  const finalUsdtBalance = await usdt.balanceOf(proxyAddress);
  const finalYesBalance = await conditionalTokens.balanceOf(proxyAddress, yesPositionId);
  const finalNoBalance = await conditionalTokens.balanceOf(proxyAddress, noPositionId);

  console.log(`   💵 USDT: ${ethers.formatUnits(finalUsdtBalance, 6)} (was ${ethers.formatUnits(usdtBalance, 6)})`);
  console.log(`   ✅ YES: ${ethers.formatUnits(finalYesBalance, 6)} (was ${ethers.formatUnits(yesBalance, 6)})`);
  console.log(`   ❌ NO: ${ethers.formatUnits(finalNoBalance, 6)} (was ${ethers.formatUnits(noBalance, 6)})`);

  const usdtIncrease = finalUsdtBalance - usdtBalance;
  const yesDecrease = yesBalance - finalYesBalance;
  const noDecrease = noBalance - finalNoBalance;

  console.log(`\n💰 Changes:`);
  console.log(`   USDT increased by: ${ethers.formatUnits(usdtIncrease, 6)}`);
  console.log(`   YES decreased by: ${ethers.formatUnits(yesDecrease, 6)}`);
  console.log(`   NO decreased by: ${ethers.formatUnits(noDecrease, 6)}`);

  if (usdtIncrease === mergeAmount && yesDecrease === mergeAmount && noDecrease === mergeAmount) {
    console.log('\n✅ Merge operation successful! All balances match expected values.');
  } else {
    console.log('\n⚠️  Warning: Balance changes do not match expected values.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
