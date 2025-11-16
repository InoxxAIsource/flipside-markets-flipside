import { TwitterApi } from 'twitter-api-v2';

// Validate Twitter credentials
const hasTwitterCredentials = Boolean(
  process.env.TWITTER_API_KEY &&
  process.env.TWITTER_API_SECRET &&
  process.env.TWITTER_ACCESS_TOKEN &&
  process.env.TWITTER_ACCESS_TOKEN_SECRET
);

if (!hasTwitterCredentials) {
  console.warn('⚠️  Twitter credentials not configured. Market auto-posting to X disabled.');
}

const twitterClient = hasTwitterCredentials ? new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
}) : null;

const rwClient = twitterClient?.readWrite;

interface MarketTweetData {
  id: string;
  question: string;
  imageUrl?: string | null;
  yesPrice: number;
  noPrice: number;
  category: string;
}

export async function postMarketToTwitter(market: MarketTweetData, baseUrl: string): Promise<string | null> {
  // Skip if Twitter credentials not configured
  if (!hasTwitterCredentials || !rwClient) {
    console.log('📭 Skipping Twitter post - credentials not configured');
    return null;
  }
  
  try {
    // Format the tweet text
    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = Math.round(market.noPrice * 100);
    
    // Shorten question if needed (Twitter has 280 char limit)
    let question = market.question;
    if (question.length > 160) {
      question = question.substring(0, 157) + '...';
    }
    
    // Generate hashtags based on category
    const hashtags = getHashtagsForCategory(market.category);
    
    // Build the market URL
    const marketUrl = `${baseUrl}/market/${market.id}`;
    
    // Compose tweet text
    const tweetText = `🔮 New market on Flipside!\n\n${question}\n\nCurrent odds:\n✅ YES ${yesPercent}%\n❌ NO ${noPercent}%\n\nTrade now: ${marketUrl}\n\n${hashtags}`;
    
    let mediaId: string | undefined;
    
    // If there's an image, upload it first
    if (market.imageUrl) {
      try {
        // Determine if it's a relative or absolute URL
        const imageUrl = market.imageUrl.startsWith('http') 
          ? market.imageUrl 
          : `${baseUrl}${market.imageUrl}`;
        
        // Download image
        const response = await fetch(imageUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          
          // Detect MIME type from response headers or file extension
          let mimeType = response.headers.get('content-type');
          
          // If MIME type is not available or not an image type, infer from file extension
          if (!mimeType || !mimeType.startsWith('image/')) {
            const ext = imageUrl.toLowerCase().split('.').pop();
            if (ext === 'webp') mimeType = 'image/webp';
            else if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else mimeType = 'image/jpeg'; // Default fallback
          }
          
          // Upload media to Twitter
          mediaId = await rwClient!.v1.uploadMedia(Buffer.from(buffer), {
            mimeType: mimeType as any,
          });
        }
      } catch (error) {
        console.error('Failed to upload image to Twitter:', error);
        // Continue without image
      }
    }
    
    // Post the tweet
    const tweet = await rwClient!.v2.tweet({
      text: tweetText,
      ...(mediaId && { media: { media_ids: [mediaId] } }),
    });
    
    // Return the tweet URL
    const tweetUrl = `https://twitter.com/i/web/status/${tweet.data.id}`;
    console.log('✅ Posted market to Twitter:', tweetUrl);
    
    return tweetUrl;
  } catch (error) {
    console.error('❌ Failed to post market to Twitter:', error);
    // Don't throw - we don't want to fail market creation if tweet fails
    return null;
  }
}

function getHashtagsForCategory(category: string): string {
  const categoryLower = category.toLowerCase();
  
  // Base hashtags
  let hashtags = ['#PredictionMarket'];
  
  // Add category-specific hashtags
  if (categoryLower.includes('crypto') || categoryLower.includes('bitcoin') || categoryLower.includes('ethereum')) {
    hashtags.push('#Crypto');
  }
  
  if (categoryLower.includes('sports')) {
    hashtags.push('#Sports');
  }
  
  if (categoryLower.includes('politics')) {
    hashtags.push('#Politics');
  }
  
  if (categoryLower.includes('tech')) {
    hashtags.push('#Tech');
  }
  
  return hashtags.join(' ');
}
