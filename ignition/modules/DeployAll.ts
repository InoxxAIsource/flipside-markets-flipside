import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Complete Polymarket-style deployment
 * Deploys all contracts in dependency order
 */
export default buildModule("PolymarketDeploy", (m) => {
  // Step 1: Deploy MockUSDT (collateral token)
  const mockUSDT = m.contract("MockUSDT");

  // Step 2: Deploy ConditionalTokens
  const conditionalTokens = m.contract("ConditionalTokens");

  // Step 3: Deploy ProxyWallet implementation
  // Use a dummy address for initialization, ProxyWalletFactory will create instances with real owners
  const dummyOwner = m.getParameter("dummyOwner", "0x0000000000000000000000000000000000000001");
  const proxyWalletImpl = m.contract("ProxyWallet", [dummyOwner]);

  // Step 4: Deploy ProxyWalletFactory
  const proxyWalletFactory = m.contract("ProxyWalletFactory");

  // Step 5: Set implementation on ProxyWalletFactory
  m.call(proxyWalletFactory, "setImplementation", [proxyWalletImpl]);

  // Step 6: Deploy CTFExchange
  // Parameters: collateral, ctf, proxyFactory, safeFactory (address(0) for now)
  const safeFactory = "0x0000000000000000000000000000000000000000";
  const ctfExchange = m.contract("CTFExchange", [
    mockUSDT,
    conditionalTokens,
    proxyWalletFactory,
    safeFactory,
  ]);

  return {
    mockUSDT,
    conditionalTokens,
    proxyWalletImpl,
    proxyWalletFactory,
    ctfExchange,
  };
});
