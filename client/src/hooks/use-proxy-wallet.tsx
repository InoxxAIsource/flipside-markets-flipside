import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from './use-wallet';
import { useToast } from './use-toast';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useProxyWallet as useProxyWalletStatus } from './use-proxy-wallet.ts';

const ProxyWalletABI = [
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function executeSplit(bytes32 conditionId, uint256 amount, bytes memory signature, uint256 deadline)",
  "function executeMerge(bytes32 conditionId, uint256 amount, bytes memory signature, uint256 deadline)",
  "function getBalance(address user) view returns (uint256)",
  "function getPositionBalance(address user, uint256 tokenId) view returns (uint256)",
  "function getNonce(address user) view returns (uint256)",
] as const;

const MockUSDTABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
] as const;

// EIP-712 domain will be dynamically created with actual proxy address
const getEIP712Domain = (proxyAddress: string) => ({
  name: 'ProxyWallet',
  version: '1',
  chainId: 11155111,
  verifyingContract: proxyAddress,
});

const META_TRANSACTION_TYPES = {
  MetaTransaction: [
    { name: 'user', type: 'address' },
    { name: 'target', type: 'address' },
    { name: 'data', type: 'bytes' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

interface ProxyWalletBalance {
  balance: string;
}

interface ProxyWalletNonce {
  nonce: number;
}

interface MetaTransactionResponse {
  success: boolean;
  txId?: string;
  error?: string;
}

// Local nonce tracking helpers (contract doesn't have getNonce)
const getNonce = (address: string): number => {
  const key = `proxy_wallet_nonce_${address.toLowerCase()}`;
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) : 0;
};

const incrementNonce = (address: string): number => {
  const currentNonce = getNonce(address);
  const nextNonce = currentNonce + 1;
  const key = `proxy_wallet_nonce_${address.toLowerCase()}`;
  localStorage.setItem(key, nextNonce.toString());
  return currentNonce; // Return current nonce for use
};

export function useProxyWallet() {
  const { account } = useWallet();
  const { toast } = useToast();
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  // Get user's deployed proxy wallet address
  const { proxyAddress, deployed } = useProxyWalletStatus();

  // Query for ProxyWallet USDT balance
  const { data: proxyBalanceData, isLoading: isLoadingBalance } = useQuery<ProxyWalletBalance>({
    queryKey: ['/api/proxy/balance', account],
    enabled: !!account,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const proxyBalance = proxyBalanceData?.balance || '0';

  /**
   * Get position token balance from ProxyWallet
   */
  const getPositionBalance = async (tokenId: string): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`/api/proxy/positions/${account}/${tokenId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch position balance');
      }
      const data = await response.json();
      return data.balance;
    } catch (error: any) {
      console.error('Error fetching position balance:', error);
      throw error;
    }
  };

  /**
   * Deposit USDT to ProxyWallet
   */
  const deposit = async (amount: string): Promise<string> => {
    if (!account || !window.ethereum) {
      throw new Error('Wallet not connected');
    }

    if (!proxyAddress || !deployed) {
      throw new Error('Proxy wallet not deployed. Please deploy your proxy wallet first.');
    }

    setIsDepositing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const usdtContract = new ethers.Contract(
        CONTRACT_ADDRESSES.MockUSDT,
        MockUSDTABI,
        signer
      );

      const proxyWalletContract = new ethers.Contract(
        proxyAddress, // Use user's deployed proxy address
        ProxyWalletABI,
        signer
      );

      const amountWei = ethers.parseUnits(amount, 6); // USDT has 6 decimals

      // Check allowance
      const allowance = await usdtContract.allowance(account, proxyAddress);

      // Approve if needed
      if (allowance < amountWei) {
        toast({
          title: 'Approval Required',
          description: 'Please approve USDT spending...',
        });

        const approveTx = await usdtContract.approve(
          proxyAddress, // Approve user's proxy wallet
          amountWei
        );

        toast({
          title: 'Approval Pending',
          description: 'Waiting for approval confirmation...',
        });

        await approveTx.wait();

        toast({
          title: 'Approval Confirmed',
          description: 'USDT spending approved',
        });
      }

      // Deposit to ProxyWallet
      toast({
        title: 'Deposit Pending',
        description: 'Depositing USDT to ProxyWallet...',
      });

      const depositTx = await proxyWalletContract.deposit(amountWei);
      
      toast({
        title: 'Deposit Submitted',
        description: 'Waiting for deposit confirmation...',
      });

      const receipt = await depositTx.wait();

      toast({
        title: 'Deposit Successful',
        description: `Deposited ${amount} USDT to ProxyWallet`,
      });

      // Refresh balance
      await queryClient.invalidateQueries({ queryKey: ['/api/proxy/balance', account] });

      return receipt.hash;
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: 'Deposit Failed',
        description: error.message || 'Failed to deposit USDT',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsDepositing(false);
    }
  };

  /**
   * Sign and submit a meta-transaction to the relayer
   */
  const signAndSubmitMetaTransaction = async (
    target: string,
    data: string,
    operationName: string
  ): Promise<string> => {
    if (!account || !window.ethereum) {
      throw new Error('Wallet not connected');
    }

    if (!proxyAddress) {
      throw new Error('Proxy wallet not available');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Create deadline (10 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + 600;

    // Get current nonce (don't increment yet - wait for success)
    const currentNonce = getNonce(account);

    // Create meta-transaction message
    const message = {
      user: account,
      target,
      data,
      nonce: BigInt(currentNonce),
      deadline: BigInt(deadline),
    };

    // Sign using EIP-712 with actual proxy address
    const domain = getEIP712Domain(proxyAddress);
    const signature = await signer.signTypedData(
      domain,
      META_TRANSACTION_TYPES,
      message
    );

    // Submit to relayer
    const response = await apiRequest(
      'POST',
      '/api/proxy/meta-transaction',
      {
        user: account,
        target,
        data,
        signature,
        deadline,
      }
    );

    const result: MetaTransactionResponse = await response.json();

    if (!result.success || !result.txId) {
      throw new Error(result.error || 'Failed to submit meta-transaction');
    }

    // Only increment nonce after successful submission
    incrementNonce(account);

    return result.txId;
  };

  /**
   * Withdraw USDT from ProxyWallet (meta-transaction)
   */
  const withdraw = async (amount: string): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsWithdrawing(true);
    try {
      toast({
        title: 'Withdrawal Pending',
        description: 'Signing withdrawal transaction...',
      });

      const amountWei = ethers.parseUnits(amount, 6); // USDT has 6 decimals

      // Encode withdraw function call
      const proxyWalletInterface = new ethers.Interface(ProxyWalletABI);
      const data = proxyWalletInterface.encodeFunctionData('withdraw', [amountWei]);

      if (!proxyAddress) {
        throw new Error('Proxy wallet not deployed');
      }

      const txId = await signAndSubmitMetaTransaction(
        proxyAddress, // Use user's proxy address
        data,
        'Withdraw'
      );

      toast({
        title: 'Withdrawal Submitted',
        description: `Withdrawing ${amount} USDT from ProxyWallet`,
      });

      // Refresh balance after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/proxy/balance', account] });
      }, 5000);

      return txId;
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to withdraw USDT',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsWithdrawing(false);
    }
  };

  /**
   * Split USDT into YES+NO tokens (meta-transaction)
   */
  const split = async (conditionId: string, amount: string): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsSplitting(true);
    try {
      toast({
        title: 'Split Pending',
        description: 'Signing split transaction...',
      });

      const amountWei = ethers.parseUnits(amount, 6); // USDT has 6 decimals

      // Encode executeSplit function call
      const proxyWalletInterface = new ethers.Interface(ProxyWalletABI);
      
      // For split, we pass empty signature and current timestamp as deadline
      // The actual signature is the meta-transaction signature
      const data = proxyWalletInterface.encodeFunctionData('executeSplit', [
        conditionId,
        amountWei,
        '0x',
        Math.floor(Date.now() / 1000) + 600
      ]);

      if (!proxyAddress) {
        throw new Error('Proxy wallet not deployed');
      }

      const txId = await signAndSubmitMetaTransaction(
        proxyAddress, // Use user's proxy address
        data,
        'Split'
      );

      toast({
        title: 'Split Submitted',
        description: `Splitting ${amount} USDT into YES+NO tokens`,
      });

      // Refresh balances after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/proxy/balance', account] });
      }, 5000);

      return txId;
    } catch (error: any) {
      console.error('Split error:', error);
      toast({
        title: 'Split Failed',
        description: error.message || 'Failed to split tokens',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSplitting(false);
    }
  };

  /**
   * Merge YES+NO tokens back to USDT (meta-transaction)
   */
  const merge = async (conditionId: string, amount: string): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsMerging(true);
    try {
      toast({
        title: 'Merge Pending',
        description: 'Signing merge transaction...',
      });

      const amountWei = ethers.parseUnits(amount, 6); // USDT has 6 decimals

      // Encode executeMerge function call
      const proxyWalletInterface = new ethers.Interface(ProxyWalletABI);
      
      // For merge, we pass empty signature and current timestamp as deadline
      // The actual signature is the meta-transaction signature
      const data = proxyWalletInterface.encodeFunctionData('executeMerge', [
        conditionId,
        amountWei,
        '0x',
        Math.floor(Date.now() / 1000) + 600
      ]);

      if (!proxyAddress) {
        throw new Error('Proxy wallet not deployed');
      }

      const txId = await signAndSubmitMetaTransaction(
        proxyAddress, // Use user's proxy address
        data,
        'Merge'
      );

      toast({
        title: 'Merge Submitted',
        description: `Merging ${amount} YES+NO tokens to USDT`,
      });

      // Refresh balances after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/proxy/balance', account] });
      }, 5000);

      return txId;
    } catch (error: any) {
      console.error('Merge error:', error);
      toast({
        title: 'Merge Failed',
        description: error.message || 'Failed to merge tokens',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsMerging(false);
    }
  };

  return {
    // Balance data
    proxyBalance,
    isLoading: isLoadingBalance,
    
    // Functions
    getPositionBalance,
    deposit,
    withdraw,
    split,
    merge,
    
    // Loading states
    isDepositing,
    isWithdrawing,
    isSplitting,
    isMerging,
  };
}
