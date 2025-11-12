import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const formSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  expiresAt: z.date({ required_error: 'Please select an expiration date' }),
  pythPriceFeed: z.string().optional(),
  baselinePrice: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateMarketFormProps {
  onSubmit?: (data: FormData) => void;
  isSubmitting?: boolean;
}

export function CreateMarketForm({ onSubmit, isSubmitting = false }: CreateMarketFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      description: '',
      category: '',
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit?.(data);
    console.log('Create market:', data);
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Create a New Market</h2>
            <p className="text-muted-foreground">
              Create a prediction market for any future event
            </p>
          </div>

          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Market Question</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Will Bitcoin reach $100,000 by the end of 2025?"
                    className="resize-none"
                    rows={3}
                    data-testid="input-market-question"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Ask a clear yes/no question about a future event
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description & Resolution Criteria</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="This market will resolve to YES if Bitcoin reaches $100,000 at any point before the expiration date..."
                    className="resize-none"
                    rows={4}
                    data-testid="input-market-description"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain how the market will be resolved
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="politics">Politics</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiration Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                          data-testid="button-date-picker"
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pythPriceFeed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pyth Price Feed (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-price-feed">
                        <SelectValue placeholder="Select price feed" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                      <SelectItem value="ETH/USD">ETH/USD</SelectItem>
                      <SelectItem value="SOL/USD">SOL/USD</SelectItem>
                      <SelectItem value="DOGE/USD">DOGE/USD</SelectItem>
                      <SelectItem value="XRP/USD">XRP/USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    For price-based markets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baselinePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baseline Price (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="font-mono"
                      data-testid="input-baseline-price"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Reference price for resolution
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button 
              type="submit" 
              size="lg" 
              className="flex-1" 
              disabled={isSubmitting}
              data-testid="button-create-market"
            >
              {isSubmitting ? 'Creating...' : 'Create Market'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="lg" 
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
