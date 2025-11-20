import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowRight, TrendingDown, TrendingUp, Info, AlertTriangle, Plus, Minus, Droplet } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface AMMSwapPanelProps {
  poolAddress: string;
  marketId: string;
}

interface PoolInfo {
  yesReserve: string;
  noReserve: string;
  totalSupply: string;
  lpTokenAddress: string;
  yesPrice: number;
  noPrice: number;
  totalLiquidity: string;
}

interface SwapQuote {
  amountOut: string;
  priceImpact: number;
  effectivePrice: number;
  feeAmount: string;
}

interface UserPosition {
  lpBalance: string;
  yesTokens?: string;
  noTokens?: string;
  poolShare: number;
}

export function AMMSwapPanel({ poolAddress, marketId }: AMMSwapPanelProps) {
  const [buyYes, setBuyYes] = useState(true);
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState('1.0');
  const [sellMode, setSellMode] = useState(false); // Toggle between buy (USDT→tokens) and sell (tokens→opposite token)
  const { account } = useWallet();
  const { toast } = useToast();

  // Fetch market data to get conditionId and positionIds
  const { data: market } = useQuery<any>({
    queryKey: ['/api/markets', marketId],
  });

  // Fetch pool info
  const { data: poolInfo, isLoading: poolLoading } = useQuery<PoolInfo>({
    queryKey: ['/api/pool', poolAddress, 'info'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch user's YES/NO token balances
  const { data: userBalances } = useQuery<{ yesBalance: string; noBalance: string }>({
    queryKey: ['/api/user-balances', account, market?.conditionId],
    queryFn: async () => {
      if (!account || !market?.conditionId) {
        return { yesBalance: '0', noBalance: '0' };
      }

      const { ethers } = await import('ethers');
      const CONDITIONAL_TOKENS = '0xdC8CB01c328795C007879B2C030AbF1c1b580D84';
      const USDT = '0xAf24D4DDbA993F6b11372528C678edb718a097Aa';
      
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const conditionalTokensABI = [
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function getPositionId(address collateralToken, bytes32 collectionId) view returns (uint256)',
      ];
      const ct = new ethers.Contract(CONDITIONAL_TOKENS, conditionalTokensABI, provider);

      // Calculate position IDs for YES (outcome 0) and NO (outcome 1) using on-chain method
      const getPositionId = async (conditionId: string, outcomeIndex: number): Promise<bigint> => {
        // Collection ID formula: keccak256(conditionId, indexSet)
        const collectionId = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['bytes32', 'uint256'],
            [conditionId, 1 << outcomeIndex]
          )
        );
        // Call on-chain getPositionId to get the exact token ID
        return await ct.getPositionId(USDT, collectionId);
      };

      const [yesTokenId, noTokenId, yesBalance, noBalance] = await Promise.all([
        getPositionId(market.conditionId, 0),
        getPositionId(market.conditionId, 1),
        (async () => {
          const yesId = await getPositionId(market.conditionId, 0);
          return await ct.balanceOf(account, yesId);
        })(),
        (async () => {
          const noId = await getPositionId(market.conditionId, 1);
          return await ct.balanceOf(account, noId);
        })(),
      ]);

      return {
        yesBalance: yesBalance.toString(),
        noBalance: noBalance.toString(),
      };
    },
    enabled: !!account && !!market?.conditionId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch swap quote when amount changes
  const { data: quote, isLoading: quoteLoading } = useQuery<SwapQuote>({
    queryKey: ['/api/pool', poolAddress, 'quote', { buyYes, amountIn }],
    queryFn: async () => {
      // Convert amountIn from human-readable to wei (6 decimals for USDT)
      const amountInWei = Math.floor(parseFloat(amountIn) * 1e6).toString();
      const params = new URLSearchParams({
        buyYes: buyYes.toString(),
        amountIn: amountInWei,
      });
      const response = await fetch(`/api/pool/${poolAddress}/quote?${params}`);
      if (!response.ok) throw new Error('Failed to fetch quote');
      return response.json();
    },
    enabled: !!amountIn && parseFloat(amountIn) > 0,
    refetchInterval: 5000,
  });

  // Calculate minimum amount out based on slippage (using BigInt to avoid truncation)
  const minAmountOutWei = quote
    ? (BigInt(quote.amountOut) * BigInt(10000 - Math.floor(parseFloat(slippage) * 100))) / BigInt(10000)
    : BigInt(0);

  // Swap mutation (user-pays-gas like deposits/withdrawals)
  const swapMutation = useMutation({
    mutationFn: async () => {
      if (!account) {
        throw new Error('Please connect your wallet');
      }
      if (!quote) {
        throw new Error('No quote available');
      }
      if (!market) {
        throw new Error('Market data not loaded');
      }

      const amountInWei = BigInt(Math.floor(parseFloat(amountIn) * 1e6));

      console.log('🔄 AMM Swap Flow (4 Steps):', {
        buyYes,
        amountIn,
        amountInWei: amountInWei.toString(),
        minAmountOutWei: minAmountOutWei.toString(),
        slippage: `${slippage}%`,
        note: 'After split, we have equal YES+NO. We swap unwanted for more wanted.',
      });

      // Contract addresses
      const CONDITIONAL_TOKENS = '0xdC8CB01c328795C007879B2C030AbF1c1b580D84';
      const USDT = '0xAf24D4DDbA993F6b11372528C678edb718a097Aa';

      // Contract ABIs
      const usdtABI = ['function approve(address spender, uint256 amount) returns (bool)'];
      const conditionalTokensABI = [
        'function splitPosition(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)',
        'function setApprovalForAll(address operator, bool approved)',
      ];
      const poolABI = ['function swap(bool buyYes, uint256 amountIn, uint256 minAmountOut) returns (uint256)'];

      // Create contract instances
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const userSigner = await provider.getSigner();
      
      const usdt = new ethers.Contract(USDT, usdtABI, userSigner);
      const ct = new ethers.Contract(CONDITIONAL_TOKENS, conditionalTokensABI, userSigner);
      const pool = new ethers.Contract(poolAddress, poolABI, userSigner);

      console.log('✅ Step 1: Approving USDT to ConditionalTokens...');
      // Step 1: Approve USDT to ConditionalTokens contract
      const approveTx = await usdt.approve(CONDITIONAL_TOKENS, amountInWei);
      await approveTx.wait();
      console.log('✅ USDT approved');

      console.log('✅ Step 2: Splitting USDT into YES + NO tokens...');
      // Step 2: Split USDT into complete set (YES + NO tokens)
      const parentCollectionId = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const partition = [1, 2]; // Binary outcome: [YES, NO]
      const splitTx = await ct.splitPosition(
        USDT,
        parentCollectionId,
        market.conditionId,
        partition,
        amountInWei
      );
      await splitTx.wait();
      console.log('✅ Split completed - received YES + NO tokens');

      console.log('✅ Step 3: Approving outcome tokens to pool and swapping...');
      // Step 3: Approve outcome tokens to pool
      const approveTokensTx = await ct.setApprovalForAll(poolAddress, true);
      await approveTokensTx.wait();
      console.log('✅ Tokens approved to pool');

      console.log('✅ Step 4: Executing swap...');
      // Step 4: Swap unwanted tokens for wanted tokens
      const swapTx = await pool.swap(buyYes, amountInWei, minAmountOutWei);
      const receipt = await swapTx.wait();
      console.log('✅ Swap completed:', receipt.hash);

      return {
        amountOut: quote.amountOut,
        txHash: receipt.hash,
      };
    },
    onSuccess: (data) => {
      toast({
        title: 'Swap Successful!',
        description: `Received ${(parseFloat(data.amountOut) / 1e6).toFixed(4)} ${buyYes ? 'YES' : 'NO'} tokens`,
      });
      
      // Reset form
      setAmountIn('');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/pool', poolAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/markets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-balances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/amm/swaps'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Swap Failed',
        description: error.message || 'Failed to execute swap',
        variant: 'destructive',
      });
    },
  });

  const handleSwap = () => {
    if (!account) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to swap',
        variant: 'destructive',
      });
      return;
    }
    
    swapMutation.mutate();
  };

  // Sell mutation to convert specified side (YES or NO) to USDT
  const sellToUsdtMutation = useMutation({
    mutationFn: async (params: { sellYes: boolean }) => {
      try {
        if (!account || !userBalances || !market) {
          throw new Error('Missing required data');
        }

        let yesBalance = parseFloat(userBalances.yesBalance) / 1e6;
        let noBalance = parseFloat(userBalances.noBalance) / 1e6;
        
        const targetBalance = params.sellYes ? yesBalance : noBalance;
        if (targetBalance === 0) {
          throw new Error(`No ${params.sellYes ? 'YES' : 'NO'} tokens to sell`);
        }

        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();

        const CONDITIONAL_TOKENS = '0xdC8CB01c328795C007879B2C030AbF1c1b580D84';
        const USDT = '0xAf24D4DDbA993F6b11372528C678edb718a097Aa';

        const conditionalTokensABI = [
          'function setApprovalForAll(address operator, bool approved)',
          'function mergePositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] partition, uint256 amount)',
          'function balanceOf(address account, uint256 id) view returns (uint256)',
          'function getPositionId(address collateralToken, bytes32 collectionId) view returns (uint256)',
        ];
        const poolABI = ['function swap(bool buyYes, uint256 amountIn, uint256 minAmountOut) returns (uint256)'];

        const ct = new ethers.Contract(CONDITIONAL_TOKENS, conditionalTokensABI, signer);
        const pool = new ethers.Contract(poolAddress, poolABI, signer);

        console.log(`💰 Selling ${params.sellYes ? 'YES' : 'NO'} tokens to USDT:`, {
          yesBalance,
          noBalance,
          targetSide: params.sellYes ? 'YES' : 'NO',
          targetAmount: targetBalance,
        });

        // Step 1: Approve tokens to pool (do this once upfront)
        console.log('📝 Requesting approval...');
        const approveTx = await ct.setApprovalForAll(poolAddress, true);
        console.log('⏳ Waiting for approval confirmation...');
        await approveTx.wait();
        console.log('✅ Tokens approved');

      let totalMerged = 0;
      const DUST_THRESHOLD = 0.001; // Minimum amount worth processing
      const getPositionId = async (conditionId: string, outcomeIndex: number): Promise<bigint> => {
        const collectionId = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['bytes32', 'uint256'],
            [conditionId, 1 << outcomeIndex]
          )
        );
        return await ct.getPositionId(USDT, collectionId);
      };

      // Step 2: Loop until the target side is fully sold
      while (true) {
        // Fetch current on-chain balances
        const yesTokenId = await getPositionId(market.conditionId, 0);
        const noTokenId = await getPositionId(market.conditionId, 1);

        const [yesBalanceWei, noBalanceWei] = await Promise.all([
          ct.balanceOf(account, yesTokenId),
          ct.balanceOf(account, noTokenId),
        ]);

        yesBalance = Number(yesBalanceWei) / 1e6;
        noBalance = Number(noBalanceWei) / 1e6;

        const currentTargetBalance = params.sellYes ? yesBalance : noBalance;
        
        console.log(`📊 Current balances: YES=${yesBalance.toFixed(4)}, NO=${noBalance.toFixed(4)}`);

        // Exit if target side is below dust threshold
        if (currentTargetBalance < DUST_THRESHOLD) {
          console.log(`✅ Target ${params.sellYes ? 'YES' : 'NO'} balance below dust threshold`);
          break;
        }

        // Step 3: Merge any existing equal YES+NO pairs
        const mergeableAmount = Math.min(yesBalance, noBalance);
        if (mergeableAmount >= DUST_THRESHOLD) {
          console.log(`🔀 Merging ${mergeableAmount.toFixed(4)} YES+NO → USDT...`);
          
          const mergeAmountWei = BigInt(Math.floor(mergeableAmount * 1e6));
          const parentCollectionId = '0x0000000000000000000000000000000000000000000000000000000000000000';
          const partition = [1, 2];

          const mergeTx = await ct.mergePositions(
            USDT,
            parentCollectionId,
            market.conditionId,
            partition,
            mergeAmountWei
          );
          await mergeTx.wait();
          totalMerged += mergeableAmount;
          console.log(`✅ Merged ${mergeableAmount.toFixed(4)} USDT`);
          
          // Update balances after merge
          yesBalance -= mergeableAmount;
          noBalance -= mergeableAmount;
        }

        // Step 4: Check if target side still has surplus
        const remainingTarget = params.sellYes ? yesBalance : noBalance;
        const oppositeBalance = params.sellYes ? noBalance : yesBalance;

        if (remainingTarget < DUST_THRESHOLD) {
          console.log(`✅ Target side fully sold`);
          break;
        }

        if (remainingTarget <= oppositeBalance) {
          // Already balanced or opposite side has more - merge handled it
          break;
        }

        // Step 5: Swap surplus of target side to create a pair for next merge iteration
        const swapAmount = Math.min(remainingTarget - oppositeBalance, remainingTarget / 2);
        
        console.log(`🔄 Swapping ${swapAmount.toFixed(4)} ${params.sellYes ? 'YES' : 'NO'} to create pair...`);
        
        // Get quote from backend API
        const swapAmountWei = Math.floor(swapAmount * 1e6);
        const quoteParams = new URLSearchParams({
          buyYes: params.sellYes ? 'false' : 'true', // Selling target side
          amountIn: swapAmountWei.toString(),
        });
        const quoteResponse = await fetch(`/api/pool/${poolAddress}/quote?${quoteParams}`);
        if (!quoteResponse.ok) throw new Error('Failed to get swap quote');
        const quoteData = await quoteResponse.json();
        
        // Apply 5% slippage tolerance
        const expectedOut = parseFloat(quoteData.amountOut) / 1e6;
        const minOut = expectedOut * 0.95;
        const minOutWei = BigInt(Math.floor(minOut * 1e6));
        
        console.log(`📊 Swap quote: ${swapAmount.toFixed(4)} → ~${expectedOut.toFixed(4)}, impact: ${quoteData.priceImpact.toFixed(2)}%`);
        
        const swapTx = await pool.swap(
          params.sellYes ? false : true, // buyYes = opposite of selling side
          BigInt(swapAmountWei),
          minOutWei
        );
        await swapTx.wait();
        console.log(`✅ Swap completed`);
        
        // Continue loop to merge the newly created pair
      }

        return {
          mergedAmount: totalMerged,
          side: params.sellYes ? 'YES' : 'NO',
        };
      } catch (error: any) {
        console.error('❌ Sell All Error:', {
          code: error.code,
          message: error.message,
          reason: error.reason,
          fullError: error
        });
        
        // Map specific blockchain errors to user-friendly messages
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
          throw new Error('Transaction was rejected in your wallet');
        } else if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
          throw new Error('Insufficient ETH for gas fees. Please add ETH to your wallet.');
        } else if (error.message?.includes('insufficient') && error.message?.includes('balance')) {
          throw new Error('Insufficient token balance to complete the swap');
        } else if (error.message?.includes('slippage') || error.message?.includes('MIN_AMOUNT_OUT')) {
          throw new Error('Slippage too high - pool liquidity may be low. Try a smaller amount.');
        } else if (error.message?.includes('user rejected')) {
          throw new Error('Transaction was rejected in your wallet');
        } else if (error.reason) {
          throw new Error(`Blockchain error: ${error.reason}`);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: `Sold ${data.side} Tokens!`,
        description: `Converted to ${data.mergedAmount.toFixed(2)} USDT`,
      });

      // Invalidate queries to refresh all transaction data
      queryClient.invalidateQueries({ queryKey: ['/api/user-balances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pool', poolAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/markets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/positions/merges/${account}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/amm/swaps/${account}`] });
    },
    onError: (error: any) => {
      console.error('Sell mutation error:', error);
      toast({
        title: 'Sell Failed',
        description: error.message || 'Failed to sell tokens. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const priceImpactColor = (impact: number) => {
    if (impact < 1) return 'text-green-500';
    if (impact < 3) return 'text-yellow-500';
    return 'text-destructive';
  };

  if (poolLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  if (!poolInfo) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load pool information</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AMM Swap</h3>
          <Badge variant="outline" className="text-xs">
            Constant-Sum AMM
          </Badge>
        </div>

        {/* User Balances (if wallet connected) */}
        {account && userBalances && poolInfo && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Your Position
              </div>
              {(() => {
                const yesValue = (parseFloat(userBalances.yesBalance) / 1e6) * poolInfo.yesPrice;
                const noValue = (parseFloat(userBalances.noBalance) / 1e6) * poolInfo.noPrice;
                const totalValue = yesValue + noValue;
                return totalValue > 0 ? (
                  <div className="text-sm font-semibold">
                    Total: <span className="font-mono text-primary">${totalValue.toFixed(2)}</span>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">YES:</span>
                  <Badge variant="outline" className="font-mono bg-green-500/10 text-green-600 dark:text-green-400">
                    {(parseFloat(userBalances.yesBalance) / 1e6).toFixed(4)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    (${((parseFloat(userBalances.yesBalance) / 1e6) * poolInfo.yesPrice).toFixed(2)})
                  </span>
                </div>
                {parseFloat(userBalances.yesBalance) > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => sellToUsdtMutation.mutate({ sellYes: true })}
                    disabled={sellToUsdtMutation.isPending}
                    data-testid="button-sell-yes"
                  >
                    {sellToUsdtMutation.isPending ? 'Selling...' : 'Sell All'}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">NO:</span>
                  <Badge variant="outline" className="font-mono bg-red-500/10 text-red-600 dark:text-red-400">
                    {(parseFloat(userBalances.noBalance) / 1e6).toFixed(4)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    (${((parseFloat(userBalances.noBalance) / 1e6) * poolInfo.noPrice).toFixed(2)})
                  </span>
                </div>
                {parseFloat(userBalances.noBalance) > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => sellToUsdtMutation.mutate({ sellYes: false })}
                    disabled={sellToUsdtMutation.isPending}
                    data-testid="button-sell-no"
                  >
                    {sellToUsdtMutation.isPending ? 'Selling...' : 'Sell All'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
          <div>
            <div className="text-xs text-muted-foreground mb-1">YES Reserve</div>
            <div className="text-lg font-mono font-semibold text-primary">
              ${(parseFloat(poolInfo.yesReserve) / 1e6).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">NO Reserve</div>
            <div className="text-lg font-mono font-semibold">
              ${(parseFloat(poolInfo.noReserve) / 1e6).toFixed(2)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Current Prices</div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono">
                YES: <span className="text-primary font-semibold">{(poolInfo.yesPrice * 100).toFixed(1)}¢</span>
              </span>
              <span className="text-sm font-mono">
                NO: <span className="font-semibold">{(poolInfo.noPrice * 100).toFixed(1)}¢</span>
              </span>
            </div>
          </div>
        </div>

        {/* Swap Interface */}
        <Tabs defaultValue="swap" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="swap">Swap</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          </TabsList>

          <TabsContent value="swap" className="space-y-4 mt-4">
            {/* Buy YES/NO Toggle */}
            <div className="flex gap-2">
              <Button
                variant={buyYes ? 'default' : 'outline'}
                onClick={() => setBuyYes(true)}
                className="flex-1"
                data-testid="button-buy-yes"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Buy YES
              </Button>
              <Button
                variant={!buyYes ? 'default' : 'outline'}
                onClick={() => setBuyYes(false)}
                className="flex-1"
                data-testid="button-buy-no"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Buy NO
              </Button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amountIn">Amount (USDT)</Label>
              <Input
                id="amountIn"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="font-mono text-lg"
                data-testid="input-swap-amount"
              />
              <div className="flex gap-2 mt-2">
                {['10', '50', '100'].map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    onClick={() => setAmountIn(amount)}
                    className="text-xs"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="p-2 bg-muted rounded-full">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Expected Output */}
            <div className="space-y-2">
              <Label>You Receive ({buyYes ? 'YES' : 'NO'} tokens)</Label>
              <div className="p-4 bg-muted/30 rounded-lg border">
                {quoteLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : quote ? (
                  <div className="text-2xl font-mono font-bold" data-testid="text-swap-quote">
                    {(parseFloat(quote.amountOut) / 1e6).toFixed(6)}
                  </div>
                ) : (
                  <div className="text-2xl font-mono text-muted-foreground" data-testid="text-swap-quote">0.00</div>
                )}
              </div>
            </div>

            {/* Swap Details */}
            {quote && (
              <div className="space-y-2 p-4 bg-muted/20 rounded-lg border border-border/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Effective Price</span>
                  <span className="font-mono font-medium">
                    {(quote.effectivePrice * 100).toFixed(2)}¢
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Price Impact</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          The difference between market price and your execution price due to trade size
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className={`font-semibold ${priceImpactColor(quote.priceImpact)}`}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trading Fee (2%)</span>
                  <span className="font-mono">
                    ${(parseFloat(quote.feeAmount) / 1e6).toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Minimum Received</span>
                  <span className="font-mono font-medium">
                    {(Number(minAmountOutWei) / 1e6).toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            {/* Slippage Setting */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slippage">Slippage Tolerance</Label>
                <span className="text-sm text-muted-foreground">{slippage}%</span>
              </div>
              <div className="flex gap-2">
                {['0.5', '1.0', '2.0'].map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={slippage === value ? 'default' : 'outline'}
                    onClick={() => setSlippage(value)}
                    className="flex-1 text-xs"
                  >
                    {value}%
                  </Button>
                ))}
                <Input
                  id="slippage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-20 text-xs font-mono"
                />
              </div>
            </div>

            {/* Swap Button */}
            <Button
              size="lg"
              className="w-full"
              disabled={!amountIn || parseFloat(amountIn) <= 0 || !quote || swapMutation.isPending || !account}
              onClick={handleSwap}
              data-testid="button-execute-swap"
            >
              {!account
                ? 'Connect Wallet'
                : !amountIn || parseFloat(amountIn) <= 0
                ? 'Enter Amount'
                : quoteLoading
                ? 'Calculating...'
                : swapMutation.isPending
                ? 'Swapping...'
                : `Swap for ${buyYes ? 'YES' : 'NO'}`}
            </Button>

            {quote && quote.priceImpact > 5 && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-destructive">High Price Impact</p>
                  <p className="text-muted-foreground">
                    This trade will significantly move the market price. Consider trading a smaller amount.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liquidity" className="space-y-4 mt-4">
            <LiquidityPanel poolAddress={poolAddress} poolInfo={poolInfo} />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

// Liquidity Panel Component
interface LiquidityPanelProps {
  poolAddress: string;
  poolInfo: PoolInfo | undefined;
}

function LiquidityPanel({ poolAddress, poolInfo }: LiquidityPanelProps) {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [yesAmount, setYesAmount] = useState('');
  const [noAmount, setNoAmount] = useState('');
  const [lpTokens, setLpTokens] = useState('');
  const { account } = useWallet();

  // Fetch user's pool position
  const { data: userPosition, isLoading: positionLoading } = useQuery<UserPosition>({
    queryKey: ['/api/pool', poolAddress, 'user', account],
    enabled: !!account,
    refetchInterval: 10000,
  });

  if (!poolInfo) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Unable to load pool information</p>
      </div>
    );
  }

  // Calculate pool share percentage
  const poolShare = userPosition && poolInfo
    ? (parseFloat(userPosition.lpBalance) / parseFloat(poolInfo.totalSupply)) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* User Position Summary */}
      {account && (
        <div className="p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Your Position</span>
            </div>
            {positionLoading && <Skeleton className="h-4 w-16" />}
          </div>
          
          {userPosition ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">LP Tokens</div>
                <div className="text-lg font-mono font-semibold">
                  {(parseFloat(userPosition.lpBalance) / 1e18).toFixed(6)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Pool Share</div>
                <div className="text-lg font-mono font-semibold text-primary">
                  {poolShare.toFixed(4)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">YES Tokens</div>
                <div className="text-sm font-mono">
                  {userPosition.yesTokens ? (parseFloat(userPosition.yesTokens) / 1e6).toFixed(4) : '0.00'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">NO Tokens</div>
                <div className="text-sm font-mono">
                  {userPosition.noTokens ? (parseFloat(userPosition.noTokens) / 1e6).toFixed(4) : '0.00'}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No liquidity provided yet
            </p>
          )}
        </div>
      )}

      {/* Add/Remove Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'add' ? 'default' : 'outline'}
          onClick={() => setMode('add')}
          className="flex-1"
          data-testid="button-add-liquidity"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Liquidity
        </Button>
        <Button
          variant={mode === 'remove' ? 'default' : 'outline'}
          onClick={() => setMode('remove')}
          className="flex-1"
          data-testid="button-remove-liquidity"
        >
          <Minus className="h-4 w-4 mr-2" />
          Remove Liquidity
        </Button>
      </div>

      {mode === 'add' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yesAmount">YES Tokens (USDT value)</Label>
            <Input
              id="yesAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={yesAmount}
              onChange={(e) => setYesAmount(e.target.value)}
              className="font-mono"
              data-testid="input-yes-amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="noAmount">NO Tokens (USDT value)</Label>
            <Input
              id="noAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={noAmount}
              onChange={(e) => setNoAmount(e.target.value)}
              className="font-mono"
              data-testid="input-no-amount"
            />
          </div>

          <div className="p-3 bg-muted/20 rounded-md border text-xs">
            <div className="flex items-center gap-1 mb-2">
              <Info className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">Liquidity Tips</span>
            </div>
            <ul className="space-y-1 text-muted-foreground ml-4 list-disc">
              <li>Add equal value of YES and NO for balanced liquidity</li>
              <li>Earn 1.5% of all trading fees automatically compounded</li>
              <li>Your LP tokens represent your share of the pool</li>
            </ul>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!yesAmount || !noAmount || parseFloat(yesAmount) <= 0 || parseFloat(noAmount) <= 0}
            data-testid="button-submit-add-liquidity"
          >
            {!yesAmount || !noAmount || parseFloat(yesAmount) <= 0 || parseFloat(noAmount) <= 0
              ? 'Enter Amounts'
              : 'Add Liquidity'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lpTokens">LP Tokens to Remove</Label>
            <Input
              id="lpTokens"
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.000000"
              value={lpTokens}
              onChange={(e) => setLpTokens(e.target.value)}
              className="font-mono"
              data-testid="input-lp-tokens"
            />
            {userPosition && (
              <div className="flex gap-2 mt-2">
                {['25', '50', '75', '100'].map((percentage) => (
                  <Button
                    key={percentage}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const amount = (parseFloat(userPosition.lpBalance) * parseFloat(percentage)) / 100 / 1e18;
                      setLpTokens(amount.toFixed(6));
                    }}
                    className="flex-1 text-xs"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-muted/20 rounded-md border">
            <div className="text-xs text-muted-foreground mb-2">You will receive approximately:</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">YES Tokens</div>
                <div className="text-sm font-mono font-semibold">
                  {lpTokens && poolInfo.totalSupply
                    ? ((parseFloat(lpTokens) / (parseFloat(poolInfo.totalSupply) / 1e18)) *
                        (parseFloat(poolInfo.yesReserve) / 1e6)).toFixed(6)
                    : '0.00'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">NO Tokens</div>
                <div className="text-sm font-mono font-semibold">
                  {lpTokens && poolInfo.totalSupply
                    ? ((parseFloat(lpTokens) / (parseFloat(poolInfo.totalSupply) / 1e18)) *
                        (parseFloat(poolInfo.noReserve) / 1e6)).toFixed(6)
                    : '0.00'}
                </div>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            variant="destructive"
            className="w-full"
            disabled={!lpTokens || parseFloat(lpTokens) <= 0}
            data-testid="button-submit-remove-liquidity"
          >
            {!lpTokens || parseFloat(lpTokens) <= 0
              ? 'Enter LP Token Amount'
              : 'Remove Liquidity'}
          </Button>
        </div>
      )}
    </div>
  );
}
