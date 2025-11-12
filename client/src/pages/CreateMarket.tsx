import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CreateMarketForm } from '@/components/CreateMarketForm';
import { useToast } from '@/hooks/use-toast';

export default function CreateMarket() {
  const { toast } = useToast();

  const handleSubmit = (data: any) => {
    console.log('Create market:', data);
    toast({
      title: 'Market Created',
      description: 'Your prediction market has been created successfully',
    });
    // TODO: Navigate to market page after creation
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-create">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Markets
            </Button>
          </Link>
        </div>

        <CreateMarketForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
