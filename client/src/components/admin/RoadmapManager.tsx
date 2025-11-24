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
  description: z.string().min(1, "Description is required"),
  status: z.enum(["planned", "in_progress", "completed"]),
  quarter: z.string().optional(),
  visibility: z.enum(["public", "investors_only"]),
  targetDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function RoadmapManager() {
  const { toast } = useToast();
  const { account } = useWallet();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "planned",
      quarter: "",
      visibility: "public",
      targetDate: "",
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/investor/roadmap"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/admin/roadmap", {
        ...data,
        walletAddress: account,
        category: "core",
        priority: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor/roadmap"] });
      toast({ title: "Success", description: "Roadmap item created" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormValues> }) => {
      return await apiRequest("PUT", `/api/admin/roadmap/${id}`, {
        ...data,
        walletAddress: account,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor/roadmap"] });
      toast({ title: "Success", description: "Roadmap item updated" });
      setIsDialogOpen(false);
      form.reset();
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/roadmap/${id}`, { walletAddress: account });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investor/roadmap"] });
      toast({ title: "Success", description: "Roadmap item deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description || "",
      status: item.status,
      quarter: item.quarter || "",
      visibility: item.visibility,
      targetDate: item.targetDate ? new Date(item.targetDate).toISOString().split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-roadmap-manager-title">
            Roadmap Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and manage product roadmap items
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingItem(null); form.reset(); }} data-testid="button-add-roadmap-item">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Create"} Roadmap Item</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update" : "Add"} a roadmap item for investors to see
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
                        <Input {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quarter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quarter</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Q1 2025" data-testid="input-quarter" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-visibility">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="investors_only">Investors Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-target-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap Items</CardTitle>
          <CardDescription>Manage all roadmap items visible to investors</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : items && Array.isArray(items) && items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item: any, index: number) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                  data-testid={`roadmap-item-${index}`}
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <h4 className="font-medium" data-testid={`roadmap-item-${index}-title`}>{item.title}</h4>
                      <Badge variant="secondary" data-testid={`roadmap-item-${index}-status`}>{item.status}</Badge>
                      {item.visibility === "investors_only" && (
                        <Badge variant="outline" data-testid={`roadmap-item-${index}-visibility`}>Investor Only</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`roadmap-item-${index}-description`}>{item.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {item.quarter} {item.targetDate && `• Target: ${new Date(item.targetDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-${index}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(item.id)}
                      data-testid={`button-delete-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-items">
              No roadmap items yet. Click "Add Item" to create one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
