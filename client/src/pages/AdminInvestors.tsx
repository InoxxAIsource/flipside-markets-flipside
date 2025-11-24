import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/Web3Provider";
import { Loader2, CheckCircle, XCircle, Copy, AlertCircle, Mail, Building, DollarSign } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function AdminInvestors() {
  const { toast } = useToast();
  const { account } = useWallet();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Fetch all applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['/api/admin/investor-applications'],
  });

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Approve application
  const approveMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return await apiRequest("POST", `/api/admin/investor-applications/${id}/approve`, {
        walletAddress: account,
        password
      });
    },
    onSuccess: (data: any, variables) => {
      setGeneratedPassword(data.generatedPassword);
      setSelectedEmail(data.investor.email);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investor-applications'] });
      toast({
        title: "Application Approved",
        description: "Investor account created successfully. Save the password to send to the investor.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve application",
        variant: "destructive",
      });
    },
  });

  // Reject application
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/admin/investor-applications/${id}/reject`, {
        walletAddress: account
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investor-applications'] });
      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject application",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string) => {
    const password = generatePassword();
    approveMutation.mutate({ id, password });
  };

  const handleReject = (id: string) => {
    if (confirm("Are you sure you want to reject this application?")) {
      rejectMutation.mutate(id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    });
  };

  if (!account) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to access the admin panel
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const allApps = (applications as any[]) || [];
  const pending = allApps.filter((app: any) => app.status === 'pending');
  const approved = allApps.filter((app: any) => app.status === 'approved');
  const rejected = allApps.filter((app: any) => app.status === 'rejected');

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investor Applications</h1>
        <p className="text-muted-foreground">
          Review and manage investor applications
        </p>
      </div>

      {generatedPassword && selectedEmail && (
        <Alert className="mb-6 bg-primary/5 border-primary">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">Investor account created successfully!</div>
              <div className="text-sm">
                <div className="mb-1"><strong>Email:</strong> {selectedEmail}</div>
                <div className="flex items-center gap-2">
                  <strong>Password:</strong>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{generatedPassword}</code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(generatedPassword)}
                    data-testid="button-copy-password"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-2 text-muted-foreground">
                  Please send these credentials to the investor via email
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setGeneratedPassword(null);
                  setSelectedEmail(null);
                }}
                data-testid="button-dismiss"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No pending applications
              </CardContent>
            </Card>
          ) : (
            pending.map((app: any) => (
              <Card key={app.id} data-testid={`card-application-${app.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{app.name}</CardTitle>
                      <CardDescription>{app.email}</CardDescription>
                    </div>
                    <Badge variant="secondary">{app.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {app.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{app.company}</span>
                      </div>
                    )}
                    {app.investmentAmount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{app.investmentAmount}</span>
                      </div>
                    )}
                    {app.linkedinUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={app.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>

                  {app.message && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-semibold mb-2">Message:</div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {app.message}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Applied: {format(new Date(app.createdAt), 'MMM dd, yyyy h:mm a')}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(app.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-${app.id}`}
                    >
                      {approveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve & Create Account
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(app.id)}
                      disabled={rejectMutation.isPending}
                      data-testid={`button-reject-${app.id}`}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approved.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No approved applications
              </CardContent>
            </Card>
          ) : (
            approved.map((app: any) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{app.name}</CardTitle>
                      <CardDescription>{app.email}</CardDescription>
                    </div>
                    <Badge className="bg-green-500">{app.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Approved: {app.reviewedAt ? format(new Date(app.reviewedAt), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejected.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No rejected applications
              </CardContent>
            </Card>
          ) : (
            rejected.map((app: any) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{app.name}</CardTitle>
                      <CardDescription>{app.email}</CardDescription>
                    </div>
                    <Badge variant="destructive">{app.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Rejected: {app.reviewedAt ? format(new Date(app.reviewedAt), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
