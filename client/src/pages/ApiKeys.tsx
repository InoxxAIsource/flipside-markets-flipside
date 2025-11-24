import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Key, Trash2, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useAccount } from "@web3modal/ethers/react";

interface ApiKey {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  rateLimit: number;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  requestCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ApiKeys() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isKeyCreated, setIsKeyCreated] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyTier, setNewKeyTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['/api/user/api-keys', address],
    enabled: !!address,
    queryFn: async () => {
      const response = await fetch(`/api/user/api-keys?walletAddress=${address}`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      return response.json();
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Wallet not connected');
      
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          name: newKeyName,
          tier: newKeyTier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedKey(data.apiKey);
      setIsKeyCreated(true);
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated. Save it securely!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      if (!address) throw new Error('Wallet not connected');
      
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
      toast({
        title: "API Key Revoked",
        description: "The API key has been successfully revoked.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for your API key",
        variant: "destructive",
      });
      return;
    }

    createKeyMutation.mutate();
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setIsKeyCreated(false);
    setGeneratedKey(null);
    setNewKeyName("");
    setNewKeyTier('free');
    setCopiedKey(false);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast({
      title: "Copied to clipboard",
      description: "API key copied successfully",
    });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'default';
      case 'enterprise':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!address) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to manage API keys
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">API Keys</h1>
          <p className="text-lg text-muted-foreground">
            Manage your API keys for programmatic access
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-api-key">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-api-key">
            {!isKeyCreated ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for programmatic access to Flipside
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">API Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="My Production App"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      data-testid="input-api-key-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key-tier">Tier</Label>
                    <Select value={newKeyTier} onValueChange={(value: 'free' | 'pro' | 'enterprise') => setNewKeyTier(value)}>
                      <SelectTrigger data-testid="select-api-key-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (100 req/hour)</SelectItem>
                        <SelectItem value="pro">Pro (1,000 req/hour)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (Unlimited)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateKey}
                    disabled={createKeyMutation.isPending}
                    data-testid="button-generate-key"
                  >
                    {createKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Save this key securely. You won't be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="bg-muted p-4 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Your API Key</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generatedKey && copyToClipboard(generatedKey)}
                        data-testid="button-copy-key"
                      >
                        {copiedKey ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <code className="text-sm break-all block" data-testid="text-generated-key">
                      {generatedKey}
                    </code>
                  </div>

                  <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Store this API key securely. It won't be shown again and grants access to your account.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleCloseDialog} data-testid="button-close-dialog">
                    I've Saved My Key
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Loading API keys...</div>
            </CardContent>
          </Card>
        ) : apiKeys.length === 0 ? (
          <Card data-testid="card-no-keys">
            <CardHeader>
              <CardTitle>No API Keys</CardTitle>
              <CardDescription>
                You haven't created any API keys yet. Create one to get started with the API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  API keys allow you to access Flipside's API programmatically
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-key">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id} data-testid={`card-api-key-${key.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {key.name}
                      <Badge variant={getTierBadgeVariant(key.tier)}>
                        {key.tier.toUpperCase()}
                      </Badge>
                      {!key.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </CardTitle>
                    <CardDescription>
                      <code className="text-xs">{key.keyPrefix}...</code>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteKeyMutation.mutate(key.id)}
                    disabled={deleteKeyMutation.isPending}
                    data-testid={`button-delete-key-${key.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Rate Limit</div>
                  <div className="font-semibold">{key.rateLimit}/hour</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Requests Made</div>
                  <div className="font-semibold">{key.requestCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Last Used</div>
                  <div className="text-sm">
                    {key.lastUsedAt 
                      ? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })
                      : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Created</div>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
