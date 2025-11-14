import { ethers } from 'ethers';
import { CTFExchangeABI } from '../contracts/abis';
import { CONTRACT_ADDRESSES } from '../contracts/web3Service';

/**
 * Diagnostic script to check who is admin on CTFExchange
 */
async function checkContractAdmin() {
  console.log('🔍 Checking CTFExchange Contract Admins\n');

  // Setup provider
  let rpcUrl = 'https://rpc.sepolia.org';
  if (process.env.ALCHEMY_API_KEY) {
    const alchemyKey = process.env.ALCHEMY_API_KEY;
    if (alchemyKey.startsWith('http')) {
      rpcUrl = alchemyKey;
    } else {
      rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
    }
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Get addresses to check
  const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY!, provider);
  const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!);
  
  console.log('📋 Addresses:');
  console.log(`   Owner: ${ownerWallet.address}`);
  console.log(`   Relayer: ${relayerWallet.address}`);
  console.log(`   CTFExchange: ${CONTRACT_ADDRESSES.CTFExchange}\n`);

  // Create contract instance
  const ctfExchange = new ethers.Contract(
    CONTRACT_ADDRESSES.CTFExchange,
    CTFExchangeABI,
    provider
  );

  // Check if owner is admin
  console.log('🔍 Checking admin status:');
  try {
    const ownerIsAdmin = await ctfExchange.isAdmin(ownerWallet.address);
    console.log(`   Owner is admin: ${ownerIsAdmin ? '✅ YES' : '❌ NO'}`);
  } catch (error: any) {
    console.log(`   ❌ Error checking owner admin status: ${error.message}`);
  }

  // Check if relayer is already an operator
  console.log('\n🔍 Checking operator status:');
  try {
    const relayerIsOperator = await ctfExchange.isOperator(relayerWallet.address);
    console.log(`   Relayer is operator: ${relayerIsOperator ? '✅ YES' : '❌ NO'}`);
  } catch (error: any) {
    console.log(`   ❌ Error checking relayer operator status: ${error.message}`);
  }

  // Try to get the contract deployer from creation transaction
  console.log('\n🔍 Additional contract info:');
  try {
    const code = await provider.getCode(CONTRACT_ADDRESSES.CTFExchange);
    if (code === '0x') {
      console.log('   ⚠️ WARNING: No contract code at this address!');
    } else {
      console.log(`   ✅ Contract exists (${code.length} bytes)`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error checking contract code: ${error.message}`);
  }

  // Try calling the function directly to see the revert reason
  console.log('\n🔍 Attempting to call addOperator to see revert reason:');
  try {
    // Don't actually send, just estimate gas to see the revert
    await ctfExchange.addOperator.staticCall(relayerWallet.address, {
      from: ownerWallet.address
    });
    console.log('   ✅ Call would succeed!');
  } catch (error: any) {
    console.log(`   ❌ Call would revert: ${error.message}`);
    if (error.data) {
      console.log(`   Error data: ${error.data}`);
    }
  }
}

// Run the script
checkContractAdmin()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });
