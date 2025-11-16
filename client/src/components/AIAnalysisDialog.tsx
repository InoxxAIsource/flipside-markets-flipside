import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface AIAnalysisResult {
  probability: number;
  confidence: number;
  reasoning: string[];
  timestamp: string;
}

interface AIAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketId: string;
  marketQuestion: string;
}

export function AIAnalysisDialog({
  open,
  onOpenChange,
  marketId,
  marketQuestion,
}: AIAnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest<AIAnalysisResult>(`/api/markets/${marketId}/ai-analysis`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: (data) => {
      setAnalysis(data);
    },
  });

  const handleAnalyze = () => {
    setAnalysis(null);
    analysisMutation.mutate();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return "text-green-600 dark:text-green-400";
    if (confidence >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return "text-green-600 dark:text-green-400";
    if (probability >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-ai-analysis">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Market Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Market Question</h3>
            <p className="text-base">{marketQuestion}</p>
          </div>

          {!analysis && !analysisMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Sparkles className="h-16 w-16 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Get AI-powered analysis including probability prediction, confidence level, and detailed reasoning.
              </p>
              <Button
                onClick={handleAnalyze}
                size="lg"
                data-testid="button-generate-analysis"
              >
                <Brain className="h-4 w-4 mr-2" />
                Generate Analysis
              </Button>
            </div>
          )}

          {analysisMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin">
                <Brain className="h-12 w-12 text-primary" />
              </div>
              <p className="text-center text-muted-foreground">
                AI is analyzing the market...
              </p>
            </div>
          )}

          {analysisMutation.isError && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">Analysis Failed</h4>
                <p className="text-sm text-destructive/80 mt-1">
                  {analysisMutation.error?.message || "Failed to generate AI analysis. Please try again."}
                </p>
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">YES Probability</h3>
                  </div>
                  <div className={`text-5xl font-bold ${getProbabilityColor(analysis.probability)}`} data-testid="text-probability">
                    {analysis.probability}%
                  </div>
                  <Progress value={analysis.probability} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Confidence Level</h3>
                  </div>
                  <div className={`text-5xl font-bold ${getConfidenceColor(analysis.confidence)}`} data-testid="text-confidence">
                    {analysis.confidence}%
                  </div>
                  <Progress value={analysis.confidence} className="h-2" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Key Reasoning</h3>
                <ul className="space-y-2">
                  {analysis.reasoning.map((reason, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
                      data-testid={`reasoning-${index}`}
                    >
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Analysis generated at {new Date(analysis.timestamp).toLocaleString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  data-testid="button-refresh-analysis"
                >
                  <Brain className="h-3 w-3 mr-2" />
                  Refresh Analysis
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
