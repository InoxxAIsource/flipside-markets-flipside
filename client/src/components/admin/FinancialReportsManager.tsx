import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/Web3Provider";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  period: z.string().min(1, "Period is required"),
  summary: z.string().optional(),
  published: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function FinancialReportsManager() {
  const { toast } = useToast();
  const { account } = useWallet();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      period: "",
      summary: "",
      published: true,
    },
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/investor/financials"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const now = new Date();
      return await apiRequest("POST", "/api/admin/financials", {
        ...data,
        walletAddress: account,
        periodStart: now.toISOString(),
        periodEnd: now.toISOString(),
        tradingFeeRevenue: 0,
        apiRevenue: 0,
        otherRevenue: 0,
        totalRevenue: 0,
        infrastructureCosts: 0,
        developmentCosts: 0,
        marketingCosts: 0,
        operationalCosts: 0,
        totalExpenses: 0,
        burnRate: 0,
        activeUsers: 0,
        newUsers: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor/financials"] });
      toast({ title: "Success", description: "Financial report created" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormValues> }) => {
      return await apiRequest("PUT", `/api/admin/financials/${id}`, {
        ...data,
        walletAddress: account,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor/financials"] });
      toast({ title: "Success", description: "Financial report updated" });
      setIsDialogOpen(false);
      form.reset();
      setEditingReport(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/financials/${id}`, { walletAddress: account });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor/financials"] });
      toast({ title: "Success", description: "Financial report deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (report: any) => {
    setEditingReport(report);
    form.reset({
      title: report.title,
      period: report.period,
      summary: report.summary || "",
      published: report.published,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-reports-manager-title">
            Financial Reports Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and manage financial reports for investors
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingReport(null); form.reset(); }} data-testid="button-add-report">
              <Plus className="mr-2 h-4 w-4" />
              Add Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingReport ? "Edit" : "Create"} Financial Report</DialogTitle>
              <DialogDescription>
                {editingReport ? "Update" : "Add"} a financial report for investors
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Q1 2025 Financial Report" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Q1 2025" data-testid="input-period" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} placeholder="Brief summary of financial performance..." data-testid="textarea-summary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "published")} value={field.value ? "published" : "draft"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-published">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingReport ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>Manage all financial reports visible to investors</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reports && Array.isArray(reports) && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report: any, index: number) => (
                <div
                  key={report.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                  data-testid={`report-${index}`}
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <h4 className="font-medium" data-testid={`report-${index}-title`}>{report.title}</h4>
                      <Badge variant={report.published ? "default" : "secondary"} data-testid={`report-${index}-status`}>
                        {report.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`report-${index}-period`}>{report.period}</p>
                    {report.summary && (
                      <p className="text-sm text-muted-foreground mt-2" data-testid={`report-${index}-summary`}>{report.summary}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(report)}
                      data-testid={`button-edit-${index}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(report.id)}
                      data-testid={`button-delete-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-reports">
              No financial reports yet. Click "Add Report" to create one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
