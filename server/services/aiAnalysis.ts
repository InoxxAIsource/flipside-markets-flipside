import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export interface AIAnalysisResult {
  probability: number;
  confidence: number;
  reasoning: string[];
  timestamp: string;
}

interface MarketData {
  question: string;
  description?: string;
  category: string;
  expiresAt: Date;
  currentYesPrice?: number;
  currentNoPrice?: number;
  volume?: number;
  pythPriceFeedId?: string;
  baselinePrice?: number;
}

export async function analyzeMarket(marketData: MarketData): Promise<AIAnalysisResult> {
  const systemPrompt = `You are an expert prediction market analyst. Analyze the given market and provide:
1. A probability estimate (0-100) for the YES outcome
2. A confidence level (0-100) in your prediction
3. Key reasoning points (3-5 bullet points)

Be objective, data-driven, and consider:
- Historical patterns and precedents
- Current market conditions and trends
- Time remaining until resolution
- Category-specific factors
- Any oracle price data provided

Format your response as JSON with this exact structure:
{
  "probability": <number 0-100>,
  "confidence": <number 0-100>,
  "reasoning": ["point 1", "point 2", "point 3"]
}`;

  const timeRemaining = Math.max(0, marketData.expiresAt.getTime() - Date.now());
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let marketContext = `Market Question: ${marketData.question}\n`;
  if (marketData.description) {
    marketContext += `Description: ${marketData.description}\n`;
  }
  marketContext += `Category: ${marketData.category}\n`;
  marketContext += `Time Until Resolution: ${daysRemaining} days, ${hoursRemaining} hours\n`;
  
  if (marketData.currentYesPrice !== undefined) {
    marketContext += `Current Market Prices: YES ${(marketData.currentYesPrice * 100).toFixed(1)}%, NO ${(marketData.currentNoPrice! * 100).toFixed(1)}%\n`;
  }
  
  if (marketData.volume) {
    marketContext += `Trading Volume: $${marketData.volume.toFixed(2)} USDT\n`;
  }

  if (marketData.pythPriceFeedId && marketData.baselinePrice) {
    marketContext += `Oracle Resolution: Pyth Network price feed\n`;
    marketContext += `Baseline Price: $${marketData.baselinePrice.toFixed(2)}\n`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: marketContext }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }

    const analysis = JSON.parse(responseContent);

    return {
      probability: Math.min(100, Math.max(0, analysis.probability)),
      confidence: Math.min(100, Math.max(0, analysis.confidence)),
      reasoning: Array.isArray(analysis.reasoning) ? analysis.reasoning : [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("AI analysis error:", error);
    throw new Error("Failed to generate AI analysis");
  }
}
