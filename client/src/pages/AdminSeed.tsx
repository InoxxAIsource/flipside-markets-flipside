import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/Web3Provider";
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSeed() {
  const { toast } = useToast();
  const { account } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSeedMarkets = async () => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to seed markets",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/admin/seed-markets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Seeding failed');
      }

      setResult(data);
      toast({
        title: "Success!",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-seed-title">Admin Market Seeding</h1>
        <p className="text-muted-foreground">
          Seed new prediction markets to the production database after publishing
        </p>
      </div>

      <Card data-testid="card-seed-control">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Seed Production Markets
          </CardTitle>
          <CardDescription>
            This will insert new crypto and stock markets into the production database.
            Markets that already exist will be skipped automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Only authorized admin wallets can perform this action.
              Set your wallet address in the ADMIN_WALLET_ADDRESSES environment variable.
            </AlertDescription>
          </Alert>

          {!account && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet first using the "Connect Wallet" button in the top navigation.
              </AlertDescription>
            </Alert>
          )}

          {account && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm">
                <div className="font-semibold mb-1">Connected Wallet:</div>
                <div className="font-mono text-xs break-all">{account}</div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSeedMarkets}
            disabled={loading || !account}
            className="w-full"
            size="lg"
            data-testid="button-seed-markets"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Markets...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Seed Markets to Production
              </>
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-semibold mb-2">{result.message || result.error}</div>
                {result.results && (
                  <div className="space-y-1 text-sm">
                    <div>Markets Inserted: {result.results.inserted}</div>
                    <div>Markets Skipped (already exist): {result.results.skipped}</div>
                    {result.results.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="font-semibold">Errors:</div>
                        <ul className="list-disc list-inside">
                          {result.results.errors.map((error: string, i: number) => (
                            <li key={i} className="text-xs">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6" data-testid="card-seed-info">
        <CardHeader>
          <CardTitle>How to Use This Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Set Admin Wallet Address</h4>
            <p className="text-muted-foreground">
              In your production environment, set the ADMIN_WALLET_ADDRESSES environment variable
              to your wallet address (comma-separated for multiple admins).
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Publish Your App</h4>
            <p className="text-muted-foreground">
              After publishing your app with the latest code changes, navigate to this admin page.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Connect Wallet & Seed</h4>
            <p className="text-muted-foreground">
              Connect your authorized admin wallet and click the "Seed Markets" button.
              New markets will be added to production automatically.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Verify on Homepage</h4>
            <p className="text-muted-foreground">
              Check your homepage to confirm the new crypto and stock markets are now visible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
