import { ethers } from 'ethers';
import { CTFExchangeABI } from '../contracts/abis';
import { CONTRACT_ADDRESSES } from '../contracts/web3Service';

/**
 * Script to authorize the relayer as an operator on CTFExchange
 * This enables the relayer to execute matched orders on-chain
 */
async function authorizeOperator() {
  console.log('🔐 Starting operator authorization process...\n');

  // Check for required environment variables
  if (!process.env.OWNER_PRIVATE_KEY) {
    throw new Error('OWNER_PRIVATE_KEY environment variable is required');
  }

  if (!process.env.RELAYER_PRIVATE_KEY) {
    throw new Error('RELAYER_PRIVATE_KEY environment variable is required');
  }

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

  // Create wallet from owner private key
  const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  
  // Derive relayer address
  const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY);
  const relayerAddress = relayerWallet.address;

  console.log('📋 Configuration:');
  console.log(`   Owner Address: ${ownerWallet.address}`);
  console.log(`   Relayer Address: ${relayerAddress}`);
  console.log(`   CTFExchange: ${CONTRACT_ADDRESSES.CTFExchange}`);
  console.log(`   Network: Sepolia Testnet\n`);

  // Get owner balance
  const ownerBalance = await provider.getBalance(ownerWallet.address);
  console.log(`💰 Owner ETH Balance: ${ethers.formatEther(ownerBalance)} ETH\n`);

  if (ownerBalance === 0n) {
    throw new Error('Owner wallet has no ETH to pay for gas fees');
  }

  // Create contract instance with owner as signer
  const ctfExchange = new ethers.Contract(
    CONTRACT_ADDRESSES.CTFExchange,
    CTFExchangeABI,
    ownerWallet
  );

  // Check if owner is an admin
  console.log('🔍 Checking owner admin status...');
  try {
    const isAdmin = await ctfExchange.isAdmin(ownerWallet.address);
    if (!isAdmin) {
      console.log('❌ Owner wallet is NOT an admin on CTFExchange');
      console.log('   Cannot authorize operators without admin rights\n');
      throw new Error('Owner wallet lacks admin privileges');
    }
    console.log('✅ Owner is an admin on CTFExchange\n');
  } catch (error: any) {
    if (error.message.includes('admin privileges')) throw error;
    console.log('⚠️  Could not verify admin status');
    console.log('   Proceeding anyway...\n');
  }

  // Check if relayer is already an operator
  console.log('🔍 Checking relayer operator status...');
  try {
    const isOperator = await ctfExchange.isOperator(relayerAddress);
    
    if (isOperator) {
      console.log('✅ Relayer is ALREADY authorized as an operator!');
      console.log('   No action needed.\n');
      return;
    }
    
    console.log('❌ Relayer is NOT currently an operator');
    console.log('   Proceeding with authorization...\n');
  } catch (error) {
    console.log('⚠️  Could not check operator status');
    console.log('   Attempting authorization anyway...\n');
  }

  // Call addOperator
  console.log('📝 Calling CTFExchange.addOperator(relayerAddress)...');
  try {
    const tx = await ctfExchange.addOperator(relayerAddress);
    console.log(`   Transaction hash: ${tx.hash}`);
    console.log('   Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}\n`);

    // Verify the operator was added
    console.log('🔍 Verifying operator status...');
    try {
      const isOperatorNow = await ctfExchange.isOperator(relayerAddress);
      if (isOperatorNow) {
        console.log('✅ SUCCESS! Relayer is now authorized as an operator!\n');
        console.log('🎉 The platform can now settle matched orders on-chain.');
      } else {
        console.log('⚠️  WARNING: Transaction succeeded but relayer still not showing as operator');
        console.log('   This might be a caching issue. Try checking again in a moment.');
      }
    } catch (error) {
      console.log('✅ Transaction successful (verification method unavailable)\n');
    }

  } catch (error: any) {
    console.error('❌ Failed to authorize operator:');
    if (error.reason) {
      console.error(`   Reason: ${error.reason}`);
    }
    if (error.message) {
      console.error(`   Message: ${error.message}`);
    }
    throw error;
  }
}

// Run the script
authorizeOperator()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });
