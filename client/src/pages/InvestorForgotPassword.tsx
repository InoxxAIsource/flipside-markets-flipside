import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";

export default function InvestorForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const requestResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/investor/request-reset", { email });
      return res;
    },
    onSuccess: () => {
      setSuccess(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      requestResetMutation.mutate(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle data-testid="text-title">Reset Password</CardTitle>
          <CardDescription data-testid="text-description">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert data-testid="alert-success">
                <AlertDescription data-testid="text-success-message">
                  If an account exists with that email, a password reset link has been sent.
                  Please check your inbox.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => setLocation("/investor/login")}
                variant="outline"
                className="w-full"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" data-testid="label-email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  required
                  disabled={requestResetMutation.isPending}
                  data-testid="input-email"
                />
              </div>

              {requestResetMutation.error && (
                <Alert variant="destructive" data-testid="alert-error">
                  <AlertDescription data-testid="text-error-message">
                    {(requestResetMutation.error as any).message || "Failed to send reset link"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/investor/login")}
                  disabled={requestResetMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={requestResetMutation.isPending || !email}
                  className="flex-1"
                  data-testid="button-submit"
                >
                  {requestResetMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Reset Link
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
