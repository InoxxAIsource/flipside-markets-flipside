import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../server/config/contracts';

const MockUSDTABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount)',
];

const ProxyWalletFactoryABI = [
  'function getInstanceAddress(address user) view returns (address)',
  'function deployProxyWallet() returns (address)',
];

const ProxyWalletABI = [
  'function execute(address target, bytes data, uint256 value) returns (bytes memory)',
  'function executeMetaTransaction(address user, address target, bytes data, bytes signature, uint256 deadline) returns (bytes memory)',
  'function nonces(address user) view returns (uint256)',
];

const ConditionalTokensABI = [
  'function balanceOf(address owner, uint256 positionId) view returns (uint256)',
  'function splitPosition(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)',
  'function mergePositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)',
];

async function main() {
  console.log('🧪 Testing ProxyWallet Meta-Transaction Flow\n');

  // Setup provider and wallet (use Alchemy URL from environment)
  const rpcUrl = process.env.ALCHEMY_API_KEY || 'https://rpc.sepolia.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Use test private key (you can replace with your own test key)
  const testPrivateKey = process.env.TEST_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat test key
  const wallet = new ethers.Wallet(testPrivateKey, provider);
  const userAddress = wallet.address;

  console.log(`👤 Test wallet: ${userAddress}`);

  // Check ETH balance
  const ethBalance = await provider.getBalance(userAddress);
  console.log(`💰 ETH balance: ${ethers.formatEther(ethBalance)} ETH`);

  if (ethBalance < ethers.parseEther('0.01')) {
    console.log('⚠️  Low ETH balance - you may need Sepolia testnet ETH');
    console.log('   Get testnet ETH from: https://sepoliafaucet.com/');
  }

  // Initialize contracts
  const usdt = new ethers.Contract(CONTRACT_ADDRESSES.MOCK_USDT, MockUSDTABI, wallet);
  const factory = new ethers.Contract(CONTRACT_ADDRESSES.PROXY_WALLET_FACTORY, ProxyWalletFactoryABI, wallet);
  const conditionalTokens = new ethers.Contract(CONTRACT_ADDRESSES.CONDITIONAL_TOKENS, ConditionalTokensABI, wallet);

  // Step 1: Check if proxy wallet is deployed
  console.log('\n📍 Step 1: Check proxy wallet deployment');
  const proxyAddress = await factory.getInstanceAddress(userAddress);
  console.log(`   Proxy address (deterministic): ${proxyAddress}`);

  const proxyCode = await provider.getCode(proxyAddress);
  const isDeployed = proxyCode !== '0x';

  if (!isDeployed) {
    console.log('   ⚠️  Proxy not deployed yet - deploying now...');
    const deployTx = await factory.deployProxyWallet();
    console.log(`   Transaction: ${deployTx.hash}`);
    await deployTx.wait();
    console.log('   ✅ Proxy wallet deployed!');
  } else {
    console.log('   ✅ Proxy wallet already deployed');
  }

  const proxy = new ethers.Contract(proxyAddress, ProxyWalletABI, wallet);

  // Step 2: Check USDT balance and mint if needed
  console.log('\n📍 Step 2: Check USDT balance');
  let usdtBalance = await usdt.balanceOf(userAddress);
  console.log(`   User USDT balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);

  if (usdtBalance < ethers.parseUnits('20', 6)) {
    console.log('   💰 Minting 1000 test USDT...');
    const mintTx = await usdt.mint(userAddress, ethers.parseUnits('1000', 6));
    await mintTx.wait();
    usdtBalance = await usdt.balanceOf(userAddress);
    console.log(`   ✅ New balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
  }

  // Step 3: Deposit USDT to proxy
  console.log('\n📍 Step 3: Deposit USDT to proxy wallet');
  const depositAmount = ethers.parseUnits('10', 6);
  
  // Approve first
  console.log('   Approving USDT transfer...');
  const approveTx = await usdt.approve(proxyAddress, depositAmount);
  await approveTx.wait();
  
  // Transfer to proxy
  console.log('   Transferring USDT to proxy...');
  const transferTx = await usdt.transfer(proxyAddress, depositAmount);
  await transferTx.wait();
  
  const proxyBalance = await usdt.balanceOf(proxyAddress);
  console.log(`   ✅ Proxy USDT balance: ${ethers.formatUnits(proxyBalance, 6)} USDT`);

  // Step 4: Split via meta-transaction
  console.log('\n📍 Step 4: Split USDT into YES+NO tokens (gasless)');
  const splitAmount = ethers.parseUnits('5', 6);
  
  // Get a sample market's conditionId (we'll use the first market from API)
  const marketResponse = await fetch('http://localhost:5000/api/markets');
  const markets = await marketResponse.json();
  
  if (markets.length === 0) {
    console.log('   ⚠️  No markets available - skipping split/merge test');
  } else {
    const market = markets[0];
    const conditionId = market.conditionId;
    console.log(`   Using market: ${market.question}`);
    console.log(`   ConditionId: ${conditionId}`);

    // Encode splitPosition call
    const ctInterface = new ethers.Interface(ConditionalTokensABI);
    const splitData = ctInterface.encodeFunctionData('splitPosition', [
      CONTRACT_ADDRESSES.MOCK_USDT,
      ethers.ZeroHash, // parentCollectionId
      conditionId,
      [1, 2], // partition for binary outcome
      splitAmount,
    ]);

    // Encode proxy execute call
    const proxyInterface = new ethers.Interface(ProxyWalletABI);
    const executeData = proxyInterface.encodeFunctionData('execute', [
      CONTRACT_ADDRESSES.CONDITIONAL_TOKENS,
      splitData,
      0, // no ETH value
    ]);

    // Get nonce from contract
    const nonce = await proxy.nonces(userAddress);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

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
      target: proxyAddress,
      data: executeData,
      nonce,
      deadline,
    };

    console.log('   Signing EIP-712 meta-transaction...');
    const signature = await wallet.signTypedData(domain, types, value);
    console.log(`   Signature: ${signature.slice(0, 20)}...`);

    // Submit to relayer API
    console.log('   Submitting to relayer...');
    const metaTxResponse = await fetch('http://localhost:5000/api/proxy/meta-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: userAddress,
        target: proxyAddress,
        data: executeData,
        signature,
        deadline: deadline.toString(),
      }),
    });

    const metaTxResult = await metaTxResponse.json();
    
    if (!metaTxResult.success) {
      console.log(`   ❌ Failed: ${metaTxResult.error}`);
    } else {
      console.log(`   ✅ Meta-transaction submitted: ${metaTxResult.txId}`);
      console.log('   ⏳ Waiting for relayer to process...');
      
      // Poll for status
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await fetch(`http://localhost:5000/api/proxy/meta-transaction/${metaTxResult.txId}`);
        const status = await statusResponse.json();
        
        if (status.status === 'confirmed') {
          console.log(`   ✅ Split confirmed! Tx: ${status.txHash}`);
          break;
        } else if (status.status === 'failed') {
          console.log(`   ❌ Split failed: ${status.error}`);
          break;
        } else {
          console.log(`   ⏳ Status: ${status.status}`);
        }
      }
    }

    // Verify position balances
    const proxyBalanceAfterSplit = await usdt.balanceOf(proxyAddress);
    console.log(`   Proxy USDT after split: ${ethers.formatUnits(proxyBalanceAfterSplit, 6)} USDT`);
  }

  // Step 5: Withdraw via meta-transaction
  console.log('\n📍 Step 5: Withdraw USDT from proxy (gasless)');
  const withdrawAmount = ethers.parseUnits('2', 6);

  // Encode USDT transfer
  const usdtInterface = new ethers.Interface(MockUSDTABI);
  const transferData = usdtInterface.encodeFunctionData('transfer', [userAddress, withdrawAmount]);

  // Encode proxy execute
  const proxyInterface = new ethers.Interface(ProxyWalletABI);
  const withdrawExecuteData = proxyInterface.encodeFunctionData('execute', [
    CONTRACT_ADDRESSES.MOCK_USDT,
    transferData,
    0,
  ]);

  // Get updated nonce
  const withdrawNonce = await proxy.nonces(userAddress);
  const withdrawDeadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const withdrawDomain = {
    name: 'ProxyWallet',
    version: '1',
    chainId: 11155111,
    verifyingContract: proxyAddress,
  };

  const withdrawTypes = {
    MetaTransaction: [
      { name: 'user', type: 'address' },
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const withdrawValue = {
    user: userAddress,
    target: proxyAddress,
    data: withdrawExecuteData,
    nonce: withdrawNonce,
    deadline: withdrawDeadline,
  };

  console.log('   Signing withdrawal meta-transaction...');
  const withdrawSignature = await wallet.signTypedData(withdrawDomain, withdrawTypes, withdrawValue);

  console.log('   Submitting to relayer...');
  const withdrawMetaTxResponse = await fetch('http://localhost:5000/api/proxy/meta-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: userAddress,
      target: proxyAddress,
      data: withdrawExecuteData,
      signature: withdrawSignature,
      deadline: withdrawDeadline.toString(),
    }),
  });

  const withdrawMetaTxResult = await withdrawMetaTxResponse.json();

  if (!withdrawMetaTxResult.success) {
    console.log(`   ❌ Failed: ${withdrawMetaTxResult.error}`);
  } else {
    console.log(`   ✅ Withdrawal submitted: ${withdrawMetaTxResult.txId}`);
    console.log('   ⏳ Waiting for relayer...');

    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await fetch(`http://localhost:5000/api/proxy/meta-transaction/${withdrawMetaTxResult.txId}`);
      const status = await statusResponse.json();

      if (status.status === 'confirmed') {
        console.log(`   ✅ Withdrawal confirmed! Tx: ${status.txHash}`);
        break;
      } else if (status.status === 'failed') {
        console.log(`   ❌ Withdrawal failed: ${status.error}`);
        break;
      } else {
        console.log(`   ⏳ Status: ${status.status}`);
      }
    }
  }

  // Final balances
  console.log('\n📊 Final Balances:');
  const finalUserBalance = await usdt.balanceOf(userAddress);
  const finalProxyBalance = await usdt.balanceOf(proxyAddress);
  console.log(`   User USDT: ${ethers.formatUnits(finalUserBalance, 6)} USDT`);
  console.log(`   Proxy USDT: ${ethers.formatUnits(finalProxyBalance, 6)} USDT`);

  console.log('\n✅ Test completed!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
