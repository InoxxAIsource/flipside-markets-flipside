import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface TradingPanelProps {
  yesPrice: number;
  noPrice: number;
  onTrade?: (side: 'yes' | 'no', amount: number) => void;
}

export function TradingPanel({ yesPrice, noPrice, onTrade }: TradingPanelProps) {
  const [yesAmount, setYesAmount] = useState('');
  const [noAmount, setNoAmount] = useState('');

  const handleYesTrade = () => {
    const amount = parseFloat(yesAmount);
    if (amount > 0) {
      onTrade?.('yes', amount);
      console.log('Buy YES:', amount);
      setYesAmount('');
    }
  };

  const handleNoTrade = () => {
    const amount = parseFloat(noAmount);
    if (amount > 0) {
      onTrade?.('no', amount);
      console.log('Buy NO:', amount);
      setNoAmount('');
    }
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="yes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="yes" data-testid="tab-buy-yes">
            <TrendingUp className="mr-2 h-4 w-4" />
            Buy YES
          </TabsTrigger>
          <TabsTrigger value="no" data-testid="tab-buy-no">
            <TrendingDown className="mr-2 h-4 w-4" />
            Buy NO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yes" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="text-2xl font-mono font-bold text-primary">
              {Math.round(yesPrice * 100)}¢
            </span>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="yes-amount">Amount (USDT)</Label>
            <Input
              id="yes-amount"
              type="number"
              placeholder="0.00"
              value={yesAmount}
              onChange={(e) => setYesAmount(e.target.value)}
              data-testid="input-yes-amount"
              className="font-mono"
            />
          </div>

          {yesAmount && parseFloat(yesAmount) > 0 && (
            <div className="space-y-2 p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shares</span>
                <span className="font-mono">
                  {(parseFloat(yesAmount) / yesPrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Return</span>
                <span className="font-mono text-primary">
                  ${((parseFloat(yesAmount) / yesPrice) - parseFloat(yesAmount)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fees (2.5%)</span>
                <span className="font-mono">
                  ${(parseFloat(yesAmount) * 0.025).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleYesTrade}
            disabled={!yesAmount || parseFloat(yesAmount) <= 0}
            data-testid="button-buy-yes"
          >
            Buy YES Shares
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              You'll receive shares that pay $1.00 if the market resolves to YES, $0.00 otherwise.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="no" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="text-2xl font-mono font-bold text-destructive">
              {Math.round(noPrice * 100)}¢
            </span>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="no-amount">Amount (USDT)</Label>
            <Input
              id="no-amount"
              type="number"
              placeholder="0.00"
              value={noAmount}
              onChange={(e) => setNoAmount(e.target.value)}
              data-testid="input-no-amount"
              className="font-mono"
            />
          </div>

          {noAmount && parseFloat(noAmount) > 0 && (
            <div className="space-y-2 p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shares</span>
                <span className="font-mono">
                  {(parseFloat(noAmount) / noPrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Return</span>
                <span className="font-mono text-primary">
                  ${((parseFloat(noAmount) / noPrice) - parseFloat(noAmount)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fees (2.5%)</span>
                <span className="font-mono">
                  ${(parseFloat(noAmount) * 0.025).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            size="lg"
            variant="destructive"
            onClick={handleNoTrade}
            disabled={!noAmount || parseFloat(noAmount) <= 0}
            data-testid="button-buy-no"
          >
            Buy NO Shares
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              You'll receive shares that pay $1.00 if the market resolves to NO, $0.00 otherwise.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
