import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, TrendingUp, Shield, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const applicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  investmentAmount: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function InvestorApply() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      linkedinUrl: "",
      investmentAmount: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ApplicationForm) => {
      return await apiRequest("POST", "/api/investor/apply", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Thank you for your interest! Our team will review your application and get back to you soon.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApplicationForm) => {
    mutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Application Received!</CardTitle>
            <CardDescription>
              Thank you for your interest in investing in Flipside. Our team will review your application and contact you within 2-3 business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Our team reviews your application</li>
                  <li>If approved, you'll receive login credentials via email</li>
                  <li>Access your investor dashboard with exclusive insights</li>
                  <li>View platform roadmap, financials, and documentation</li>
                </ol>
              </div>
              <Button 
                onClick={() => setSubmitted(false)} 
                variant="outline" 
                className="w-full"
                data-testid="button-submit-another"
              >
                Submit Another Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Invest in Flipside</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join us in building the future of decentralized prediction markets on Ethereum
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Growth Potential</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tap into the rapidly growing prediction markets sector with Flipside's dual trading systems (CLOB + AMM).
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Transparent Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access real-time financial reports, development roadmap, and platform metrics through your investor dashboard.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Exclusive Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get early insights into new features, strategic partnerships, and monetization opportunities.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Investor Application</CardTitle>
            <CardDescription>
              Fill out the form below and our team will review your application. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormDescription>
                        We'll use this email to send your login credentials if approved
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company / Organization</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Acme Ventures" 
                          {...field} 
                          data-testid="input-company"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://linkedin.com/in/johndoe" 
                          {...field} 
                          data-testid="input-linkedin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investmentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Interest</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-investment">
                            <SelectValue placeholder="Select investment range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="$10K - $50K">$10K - $50K</SelectItem>
                          <SelectItem value="$50K - $100K">$50K - $100K</SelectItem>
                          <SelectItem value="$100K - $250K">$100K - $250K</SelectItem>
                          <SelectItem value="$250K - $500K">$250K - $500K</SelectItem>
                          <SelectItem value="$500K+">$500K+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your investment goals, background, and why you're interested in Flipside..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="input-message"
                        />
                      </FormControl>
                      <FormDescription>
                        Please share your investment thesis and any questions you have about Flipside
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={mutation.isPending}
                  data-testid="button-submit-application"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
