import { ethers } from "hardhat";
import { CONTRACT_ADDRESSES } from "../server/config/contracts";

async function main() {
  const CTFExchange = await ethers.getContractAt("CTFExchange", CONTRACT_ADDRESSES.CTF_EXCHANGE);
  
  const OPERATOR_ROLE = await CTFExchange.OPERATOR_ROLE();
  const relayerAddress = "0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0";
  
  const hasRole = await CTFExchange.hasRole(OPERATOR_ROLE, relayerAddress);
  
  console.log("🔍 Checking OPERATOR_ROLE status:");
  console.log("   CTFExchange:", CONTRACT_ADDRESSES.CTF_EXCHANGE);
  console.log("   Relayer:", relayerAddress);
  console.log("   OPERATOR_ROLE:", OPERATOR_ROLE);
  console.log("   hasRole:", hasRole ? "✅ YES" : "❌ NO");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
