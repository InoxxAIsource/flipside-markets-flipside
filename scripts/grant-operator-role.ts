import { network } from "hardhat";

/**
 * Grant OPERATOR_ROLE to relayer account
 * Run: npx hardhat run scripts/grant-operator-role.ts --network sepolia
 */
async function main() {
  const { ethers } = await network.connect({ network: "sepolia" });
  const [deployer] = await ethers.getSigners();

  const CTF_EXCHANGE_ADDRESS = "0x3Bca0E519CC8Ec4c07b04d14E057AE50A9554bA3";
  const RELAYER_ADDRESS = "0x0FE96eFbb8aDE6996F36D76d05478b0fCaAB11A0";

  console.log("Granting OPERATOR_ROLE using account:", deployer.address);

  const CTFExchange = await ethers.getContractAt("CTFExchange", CTF_EXCHANGE_ADDRESS);
  const OPERATOR_ROLE = await CTFExchange.OPERATOR_ROLE();

  // Check if already granted
  const hasRole = await CTFExchange.hasRole(OPERATOR_ROLE, RELAYER_ADDRESS);
  if (hasRole) {
    console.log("✅ OPERATOR_ROLE already granted to relayer");
    return;
  }

  console.log("Granting OPERATOR_ROLE to:", RELAYER_ADDRESS);
  const tx = await CTFExchange.grantRole(OPERATOR_ROLE, RELAYER_ADDRESS);
  await tx.wait();

  console.log("✅ OPERATOR_ROLE granted successfully");
  console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
