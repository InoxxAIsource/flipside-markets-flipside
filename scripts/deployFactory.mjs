import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Contract addresses
  const MOCK_USDT = "0xAf24D4DDbA993F6b11372528C678edb718a097Aa";
  const CONDITIONAL_TOKENS = "0xdC8CB01c328795C007879B2C030AbF1c1b580D84";
  
  // Setup provider and wallet
  const rpcUrl = "https://sepolia.gateway.tenderly.co";
  const privateKey = process.env.OWNER_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("OWNER_PRIVATE_KEY not set");
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const TREASURY = wallet.address;
  
  console.log("Deploying with account:", wallet.address);
  console.log("Account balance:", ethers.formatEther(await provider.getBalance(wallet.address)));
  
  // Load compiled contract
  const artifactPath = path.join(__dirname, '../artifacts/contracts/AMMPoolFactorySimple.sol/AMMPoolFactorySimple.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  console.log("\nDeploying AMMPoolFactorySimple...");
  console.log("MockUSDT:", MOCK_USDT);
  console.log("ConditionalTokens:", CONDITIONAL_TOKENS);
  console.log("Treasury:", TREASURY);
  
  // Deploy contract with explicit gas settings
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log("Estimating gas...");
  const deployTx = factory.getDeployTransaction(MOCK_USDT, CONDITIONAL_TOKENS, TREASURY);
  const gasEstimate = await provider.estimateGas(deployTx);
  console.log("Gas estimate:", gasEstimate.toString());
  
  const contract = await factory.deploy(MOCK_USDT, CONDITIONAL_TOKENS, TREASURY, {
    gasLimit: gasEstimate * 120n / 100n // 20% buffer
  });
  
  const txHash = contract.deploymentTransaction().hash;
  console.log("Transaction sent:", txHash);
  console.log("Waiting for 2 confirmations...");
  
  await contract.deploymentTransaction().wait(2);
  const address = await contract.getAddress();
  
  console.log("\n✅ AMMPoolFactorySimple deployed to:", address);
  console.log("\nUpdate server/config/contracts.ts with:");
  console.log(`  AMMPoolFactory: '${address}',`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
