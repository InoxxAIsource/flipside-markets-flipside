import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Loader2, Rocket, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/Web3Provider';
import { useProxyWallet, useDeployProxyWallet } from '@/hooks/use-proxy-wallet';
import { useToast } from '@/hooks/use-toast';
import { formatUnits } from 'ethers';

export function DepositWithdrawPanel() {
  const { account } = useWallet();
  const { proxyBalance, deposit, withdraw, isDepositing, isWithdrawing, deployed, proxyAddress } = useProxyWallet();
  const { mutate: deployProxy, isPending: isDeploying } = useDeployProxyWallet();
  const { toast } = useToast();
  
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const isConnected = !!account;

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Pass human-readable amount - hook will handle parseUnits
      await deposit(depositAmount);
      setDepositAmount('');
      toast({
        title: 'Deposit Successful',
        description: `Deposited ${depositAmount} USDT to ProxyWallet`,
      });
    } catch (error: any) {
      toast({
        title: 'Deposit Failed',
        description: error.message || 'Failed to deposit USDT',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Pass human-readable amount - hook will handle parseUnits
      const txId = await withdraw(withdrawAmount);
      setWithdrawAmount('');
      toast({
        title: 'Withdrawal Submitted',
        description: `Gasless withdrawal submitted (ID: ${txId.slice(0, 8)}...)`,
      });
    } catch (error: any) {
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to withdraw USDT',
        variant: 'destructive',
      });
    }
  };

  if (!isConnected) {
    return (
      <Card data-testid="card-deposit-withdraw-panel">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Connect your wallet to deposit and withdraw
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const proxyBalanceFormatted = proxyBalance 
    ? formatUnits(proxyBalance, 6)
    : '0.00';

  // Show deploy prompt if wallet not deployed
  if (isConnected && !deployed) {
    return (
      <Card data-testid="card-deposit-withdraw-panel">
        <CardHeader>
          <CardTitle className="text-lg">ProxyWallet Setup Required</CardTitle>
          <CardDescription>Deploy your gasless trading wallet to start trading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert data-testid="alert-proxy-not-deployed">
            <Rocket className="h-4 w-4" />
            <AlertTitle>One-Time Setup</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Deploy your ProxyWallet to enable gasless trading. This is a one-time transaction
                that will cost a small amount of ETH (~0.001-0.003 ETH on Sepolia).
              </p>
              <p className="text-xs text-muted-foreground">
                After deployment, all trading operations will be gasless via our relayer.
              </p>
            </AlertDescription>
          </Alert>

          {proxyAddress && (
            <div className="rounded-md bg-muted p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Your Proxy Address</p>
              <p className="text-xs font-mono break-all">{proxyAddress}</p>
            </div>
          )}

          <Button
            onClick={() => deployProxy()}
            disabled={isDeploying}
            className="w-full"
            size="lg"
            data-testid="button-deploy-proxy"
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy ProxyWallet
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You'll be prompted to confirm the deployment transaction in MetaMask
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-deposit-withdraw-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">ProxyWallet</CardTitle>
            <CardDescription>Deposit USDT for gasless trading</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-xl font-mono font-bold" data-testid="text-proxy-balance">
              {proxyBalanceFormatted} USDT
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" data-testid="tab-deposit">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" data-testid="tab-withdraw">
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (USDT)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isDepositing}
                data-testid="input-deposit-amount"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Requires one-time approval and deposit transaction
              </p>
            </div>
            <Button
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount}
              className="w-full"
              data-testid="button-deposit"
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Depositing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Deposit USDT
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (USDT)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isWithdrawing}
                data-testid="input-withdraw-amount"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Gasless withdrawal via meta-transaction
              </p>
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount}
              className="w-full"
              data-testid="button-withdraw"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Withdraw USDT
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
