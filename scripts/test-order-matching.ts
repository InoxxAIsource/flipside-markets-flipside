import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../server/config/contracts';

const ProxyWalletFactoryABI = [
  'function getInstanceAddress(address implementation, address user) view returns (address)',
];

const ProxyWalletABI = [
  'function nonces(address user) view returns (uint256)',
];

async function main() {
  console.log('🧪 Testing Automatic Order Matching & Settlement\n');

  // Setup
  const rpcUrl = process.env.ALCHEMY_API_KEY || 'https://rpc.sepolia.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const testPrivateKey = process.env.TEST_PRIVATE_KEY || process.env.OWNER_PRIVATE_KEY!;
  const wallet = new ethers.Wallet(testPrivateKey, provider);
  const userAddress = wallet.address;

  console.log(`👤 Test wallet: ${userAddress}\n`);

  // Get market info
  const marketResponse = await fetch('http://localhost:5000/api/markets');
  const markets = await marketResponse.json();
  const market = markets[0];
  
  console.log(`📊 Market: ${market.question}`);
  console.log(`🆔 Market ID: ${market.id}`);
  console.log(`🎯 YES Token ID: ${market.yesTokenId}`);
  console.log(`🎯 NO Token ID: ${market.noTokenId}\n`);

  // Get user's proxy wallet
  const factory = new ethers.Contract(CONTRACT_ADDRESSES.PROXY_WALLET_FACTORY, ProxyWalletFactoryABI, provider);
  const proxyAddress = await factory.getInstanceAddress(
    CONTRACT_ADDRESSES.PROXY_WALLET_IMPL,
    userAddress
  );
  console.log(`📦 Proxy wallet: ${proxyAddress}\n`);

  // Get nonce for order signing
  const nonceResponse = await fetch(`http://localhost:5000/api/users/${userAddress}/nonce`);
  const { nonce: currentNonce } = await nonceResponse.json();
  const nextNonce = parseInt(currentNonce) + 1; // Next valid nonce must be > current
  console.log(`🔢 Current nonce: ${currentNonce}, Next nonce: ${nextNonce}\n`);

  // Helper function to sign and place an order
  async function placeOrder(side: 'buy' | 'sell', price: number, size: number, nonce: number) {
    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // EIP-712 domain for CTFExchange
    const domain = {
      name: 'CTFExchange',
      version: '1',
      chainId: 11155111,
      verifyingContract: CONTRACT_ADDRESSES.CTF_EXCHANGE,
    };

    const types = {
      Order: [
        { name: 'maker', type: 'address' },
        { name: 'taker', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'makerAmount', type: 'uint256' },
        { name: 'takerAmount', type: 'uint256' },
        { name: 'side', type: 'uint8' },
        { name: 'feeRateBps', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'signer', type: 'address' },
        { name: 'expiration', type: 'uint256' },
      ],
    };

    const makerAmount = ethers.parseUnits(size.toString(), 6);
    const takerAmount = ethers.parseUnits(price.toString(), 6);

    const value = {
      maker: userAddress,
      taker: '0x0000000000000000000000000000000000000000',
      tokenId: BigInt(market.yesTokenId), // Use YES token ID
      makerAmount,
      takerAmount,
      side: side === 'buy' ? 0 : 1,
      feeRateBps: 250, // 2.5%
      nonce: BigInt(nonce),
      signer: userAddress,
      expiration: BigInt(Math.floor(expiration.getTime() / 1000)),
    };

    const signature = await wallet.signTypedData(domain, types, value);

    // Submit order to API
    const orderData = {
      marketId: market.id,
      tokenId: market.yesTokenId, // YES token ID
      makerAddress: userAddress,
      outcome: true, // YES token
      side,
      price,
      size,
      salt: ethers.hexlify(ethers.randomBytes(32)), // Random salt
      nonce,
      expiration: expiration.toISOString(),
      signature,
    };

    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to place order: ${error.error}`);
    }

    return await response.json();
  }

  // Step 1: Place a BUY order
  console.log('📈 Step 1: Placing BUY order (YES @ 0.60, size: 10)');
  const buyOrder = await placeOrder('buy', 0.60, 10, nextNonce);
  console.log(`   ✅ Order placed: ${buyOrder.id}`);
  console.log(`   Status: ${buyOrder.status}, Filled: ${buyOrder.filled}/${buyOrder.size}\n`);

  // Wait a moment for order to be processed
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 2: Place a matching SELL order
  console.log('📉 Step 2: Placing SELL order (YES @ 0.60, size: 10)');
  console.log('   This should automatically match with the BUY order!\n');
  
  const sellOrder = await placeOrder('sell', 0.60, 10, nextNonce + 1);
  console.log(`   ✅ Order placed: ${sellOrder.id}`);
  console.log(`   Status: ${sellOrder.status}, Filled: ${sellOrder.filled}/${sellOrder.size}\n`);

  // Wait for matching to complete
  console.log('⏳ Waiting for automatic order matching...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 3: Check order status
  console.log('🔍 Step 3: Checking order status after matching\n');

  const allOrders = await (await fetch(`http://localhost:5000/api/markets/${market.id}/orders`)).json();
  const foundBuyOrder = allOrders.find((o: any) => o.id === buyOrder.id);
  const foundSellOrder = allOrders.find((o: any) => o.id === sellOrder.id);

  console.log('📊 BUY Order:');
  console.log(`   ID: ${foundBuyOrder?.id}`);
  console.log(`   Status: ${foundBuyOrder?.status}`);
  console.log(`   Filled: ${foundBuyOrder?.filled}/${foundBuyOrder?.size}`);
  console.log(`   Price: ${foundBuyOrder?.price}\n`);

  console.log('📊 SELL Order:');
  console.log(`   ID: ${foundSellOrder?.id}`);
  console.log(`   Status: ${foundSellOrder?.status}`);
  console.log(`   Filled: ${foundSellOrder?.filled}/${foundSellOrder?.size}`);
  console.log(`   Price: ${foundSellOrder?.price}\n`);

  // Step 4: Check order fills
  const fillsResponse = await fetch(`http://localhost:5000/api/markets/${market.id}/fills`);
  const fills = await fillsResponse.json();
  
  const ourFills = fills.filter((f: any) => 
    f.makerAddress === userAddress || f.takerAddress === userAddress
  );

  console.log(`💰 Order Fills (${ourFills.length} total):`);
  ourFills.forEach((fill: any, index: number) => {
    console.log(`   ${index + 1}. Size: ${fill.size}, Price: ${fill.price}`);
    console.log(`      Maker: ${fill.makerAddress.slice(0, 10)}...`);
    console.log(`      Taker: ${fill.takerAddress.slice(0, 10)}...`);
  });
  console.log();

  // Step 5: Check positions
  const positionsResponse = await fetch(`http://localhost:5000/api/users/${userAddress}/positions`);
  const positions = await positionsResponse.json();

  console.log('📈 User Positions:');
  positions.forEach((pos: any) => {
    if (pos.marketId === market.id) {
      console.log(`   Market: ${market.question}`);
      console.log(`   YES shares: ${pos.yesShares}`);
      console.log(`   NO shares: ${pos.noShares}`);
      console.log(`   Avg Price: $${pos.averagePrice?.toFixed(4) || 'N/A'}`);
    }
  });
  console.log();

  // Verification
  const buyFilled = foundBuyOrder?.status === 'filled' && foundBuyOrder?.filled === foundBuyOrder?.size;
  const sellFilled = foundSellOrder?.status === 'filled' && foundSellOrder?.filled === foundSellOrder?.size;
  const fillsExist = ourFills.length > 0;

  console.log('✅ Verification:');
  console.log(`   BUY order fully filled: ${buyFilled ? '✅' : '❌'}`);
  console.log(`   SELL order fully filled: ${sellFilled ? '✅' : '❌'}`);
  console.log(`   Order fills recorded: ${fillsExist ? '✅' : '❌'}`);

  if (buyFilled && sellFilled && fillsExist) {
    console.log('\n🎉 Automatic order matching working perfectly!');
    console.log('   Orders were matched and settled automatically when prices matched.');
  } else {
    console.log('\n⚠️  Order matching did not work as expected.');
    console.log('   Check the logs for errors.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
