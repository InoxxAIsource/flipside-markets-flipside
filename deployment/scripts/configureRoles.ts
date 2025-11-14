/**
 * Role Configuration Script
 * 
 * Configures admin and operator roles on CTFExchange after deployment.
 * Must be run by the contract deployer (owner).
 */

import { ethers } from "ethers";
import { sepoliaAddresses } from "../contractAddresses";

const SEPOLIA_RPC = process.env.ALCHEMY_API_KEY
  ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  : "https://rpc.sepolia.org";

// Role hashes (from OpenZeppelin AccessControl)
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));

async function configureRoles() {
  console.log("\n⚙️  Configuring CTFExchange Roles...\n");

  try {
    if (!process.env.OWNER_PRIVATE_KEY) {
      throw new Error("OWNER_PRIVATE_KEY not set in environment");
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const owner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
    
    console.log(`Owner Address: ${owner.address}`);
    console.log(`CTFExchange: ${sepoliaAddresses.ctfExchange}`);
    console.log(`Relayer: ${sepoliaAddresses.relayerAddress}\n`);

    // CTFExchange ABI (minimal for role management)
    const ctfExchangeABI = [
      "function grantRole(bytes32 role, address account) external",
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function getRoleAdmin(bytes32 role) view returns (bytes32)",
      "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    ];

    const ctfExchange = new ethers.Contract(
      sepoliaAddresses.ctfExchange,
      ctfExchangeABI,
      owner
    );

    // Check 1: Verify owner has DEFAULT_ADMIN_ROLE
    console.log("✓ Checking owner admin role...");
    const ownerIsAdmin = await ctfExchange.hasRole(DEFAULT_ADMIN_ROLE, owner.address);
    if (!ownerIsAdmin) {
      throw new Error("Owner does not have DEFAULT_ADMIN_ROLE. Check deployment.");
    }
    console.log("  ✅ Owner has DEFAULT_ADMIN_ROLE");

    // Check 2: Grant OPERATOR_ROLE to relayer
    console.log("\n✓ Granting OPERATOR_ROLE to relayer...");
    const relayerIsOperator = await ctfExchange.hasRole(OPERATOR_ROLE, sepoliaAddresses.relayerAddress);
    
    if (relayerIsOperator) {
      console.log("  ℹ️  Relayer already has OPERATOR_ROLE");
    } else {
      console.log("  📝 Sending transaction...");
      const tx = await ctfExchange.grantRole(OPERATOR_ROLE, sepoliaAddresses.relayerAddress);
      console.log(`  ⏳ Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`  ✅ OPERATOR_ROLE granted (block ${receipt.blockNumber})`);
    }

    // Verify relayer role
    const verified = await ctfExchange.hasRole(OPERATOR_ROLE, sepoliaAddresses.relayerAddress);
    if (!verified) {
      throw new Error("Role grant verification failed");
    }

    console.log("\n✅ All roles configured successfully!\n");
    console.log("Configuration Summary:");
    console.log(`  DEFAULT_ADMIN: ${owner.address}`);
    console.log(`  OPERATOR:      ${sepoliaAddresses.relayerAddress}\n`);
    console.log("Next steps:");
    console.log("1. Create test market via MarketFactory");
    console.log("2. Register market tokens on CTFExchange");
    console.log("3. Test order submission and matching\n");

  } catch (error) {
    console.error("\n❌ Role configuration failed:", error.message);
    process.exit(1);
  }
}

// Run configuration
configureRoles();
