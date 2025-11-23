import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw new Error("Failed to generate embedding");
  }
}

export async function generateMarketEmbedding(question: string, description?: string): Promise<number[]> {
  const combinedText = description
    ? `${question}\n\n${description}`
    : question;
  
  return generateEmbedding(combinedText);
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export interface SimilarMarket {
  marketId: string;
  question: string;
  category: string;
  similarity: number;
  yesPrice: number;
  noPrice: number;
}

export function findSimilarMarkets(
  targetEmbedding: number[],
  candidateMarkets: Array<{
    id: string;
    question: string;
    category: string;
    embedding: number[] | null;
    yesPrice: number;
    noPrice: number;
  }>,
  topK: number = 5
): SimilarMarket[] {
  const similarities = candidateMarkets
    .filter(m => m.embedding !== null && m.embedding.length > 0)
    .map(market => ({
      marketId: market.id,
      question: market.question,
      category: market.category,
      similarity: cosineSimilarity(targetEmbedding, market.embedding!),
      yesPrice: market.yesPrice,
      noPrice: market.noPrice,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return similarities;
}
