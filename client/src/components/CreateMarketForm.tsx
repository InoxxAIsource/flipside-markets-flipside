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
import { CalendarIcon, CheckCircle2, Clock, Loader2, ExternalLink, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { TransactionStatus } from '@/pages/CreateMarket';

const formSchema = z.object({
  marketType: z.enum(['CLOB', 'POOL']).default('CLOB'),
  question: z.string().min(10, 'Question must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  imageUrl: z.string().refine(
    (val) => {
      if (!val || val === '') return true; // Optional field
      // Accept both absolute URLs and relative paths
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    },
    { message: 'Please enter a valid URL or path' }
  ).optional().or(z.literal('')),
  category: z.string().min(1, 'Please select a category'),
  expiresAt: z.date({ required_error: 'Please select an expiration date' }),
  pythPriceFeedId: z.string().optional(),
  baselinePrice: z.string().transform(val => val === '' ? undefined : Number(val)).optional(),
  // Pool-specific fields
  initialYesLiquidity: z.string().optional(),
  initialNoLiquidity: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateMarketFormProps {
  onSubmit?: (data: FormData) => void;
  isSubmitting?: boolean;
  txStatus?: TransactionStatus;
  txHash?: string | null;
}

export function CreateMarketForm({ onSubmit, isSubmitting = false, txStatus = 'idle', txHash = null }: CreateMarketFormProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      marketType: 'CLOB',
      question: '',
      description: '',
      imageUrl: '',
      category: '',
    },
  });

  const marketType = form.watch('marketType');

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/markets/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      return response.json();
    },
    onSuccess: (data: { imageUrl: string }) => {
      setUploadedImageUrl(data.imageUrl);
      form.setValue('imageUrl', data.imageUrl);
      toast({
        title: 'Image uploaded',
        description: 'Your image has been resized to 800x450px and uploaded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPG, PNG, or WebP image',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    uploadImageMutation.mutate(file);
  };

  const clearImage = () => {
    setUploadedImageUrl('');
    setImagePreview('');
    form.setValue('imageUrl', '');
  };

  const handleSubmit = (data: FormData) => {
    onSubmit?.(data);
  };

  const getStatusBanner = () => {
    if (txStatus === 'walletPrompt') {
      return (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
            <div>
              <p className="font-medium text-blue-500">Waiting for Wallet Confirmation</p>
              <p className="text-sm text-muted-foreground">Please confirm the transaction in MetaMask</p>
            </div>
          </div>
        </div>
      );
    }

    if (txStatus === 'pending') {
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
            <div className="flex-1">
              <p className="font-medium text-yellow-500">Transaction Pending</p>
              <p className="text-sm text-muted-foreground">
                Waiting for blockchain confirmation...
              </p>
            </div>
            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                data-testid="link-etherscan"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      );
    }

    if (txStatus === 'confirmed') {
      return (
        <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-green-500">Transaction Confirmed</p>
              <p className="text-sm text-muted-foreground">Saving market to database...</p>
            </div>
          </div>
        </div>
      );
    }

    if (txStatus === 'addingLiquidity') {
      return (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
            <div>
              <p className="font-medium text-purple-500">Adding Initial Liquidity</p>
              <p className="text-sm text-muted-foreground">
                Splitting USDT into tokens and adding to pool...
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      {getStatusBanner()}
      
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
            name="marketType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Market Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-market-type">
                      <SelectValue placeholder="Select market type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CLOB">Order Book (CLOB) - Limit/Market Orders</SelectItem>
                    <SelectItem value="POOL">LP Pool (AMM) - Constant-Sum Pricing</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {marketType === 'CLOB' 
                    ? 'Traditional order book with limit and market orders'
                    : 'Automated market maker with constant-sum pricing (x + y = k)'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>Market Image (Optional)</Label>
            
            {imagePreview ? (
              <div className="relative">
                <div className="relative w-full h-48 rounded-md overflow-hidden bg-muted">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={clearImage}
                  className="absolute top-2 right-2"
                  data-testid="button-clear-image"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploadImageMutation.isPending}
                  data-testid="button-upload-image"
                >
                  {uploadImageMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-image-file"
                />
                <span className="text-sm text-muted-foreground">
                  Recommended: 800×450px (16:9), max 5MB
                </span>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Upload a custom image for your market. Images are automatically resized to 800×450px. Crypto markets auto-detect logos if no image is uploaded.
            </p>
          </div>

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
              name="pythPriceFeedId"
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
                      <SelectItem value="0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43">BTC/USD</SelectItem>
                      <SelectItem value="0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace">ETH/USD</SelectItem>
                      <SelectItem value="0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d">SOL/USD</SelectItem>
                      <SelectItem value="0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c">DOGE/USD</SelectItem>
                      <SelectItem value="0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8">XRP/USD</SelectItem>
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

          {marketType === 'POOL' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-md border">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Initial Liquidity for AMM Pool</h3>
                <p className="text-xs text-muted-foreground">
                  Provide initial liquidity to bootstrap the automated market maker. Equal amounts create a 50/50 starting price.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="initialYesLiquidity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial YES Liquidity (USDT)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="100.00"
                          className="font-mono"
                          data-testid="input-initial-yes-liquidity"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount of USDT for YES tokens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialNoLiquidity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial NO Liquidity (USDT)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="100.00"
                          className="font-mono"
                          data-testid="input-initial-no-liquidity"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount of USDT for NO tokens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-xs text-muted-foreground">
                <p>
                  <strong>Initial Price:</strong> YES price = YES liquidity ÷ (YES liquidity + NO liquidity)
                </p>
                <p>
                  Example: 100 YES + 100 NO = 50% starting price for both
                </p>
              </div>
            </div>
          )}

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
