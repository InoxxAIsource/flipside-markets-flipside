import type { Request, Response, NextFunction } from 'express';

// In-memory rate limit tracker
// Structure: Map<keyId, Map<hourWindow, requestCount>>
const rateLimitCache = new Map<string, Map<number, number>>();

// Cleanup old entries every 2 hours
setInterval(() => {
  const now = Date.now();
  const twoHoursAgo = now - (2 * 60 * 60 * 1000);
  
  rateLimitCache.forEach((hourMap, keyId) => {
    hourMap.forEach((count, hourWindow) => {
      if (hourWindow < twoHoursAgo) {
        hourMap.delete(hourWindow);
      }
    });
    
    if (hourMap.size === 0) {
      rateLimitCache.delete(keyId);
    }
  });
}, 2 * 60 * 60 * 1000); // Run every 2 hours

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Only rate limit authenticated requests
  if (!req.apiKey) {
    next();
    return;
  }
  
  const { id: keyId, tier, rateLimit } = req.apiKey;
  
  // Enterprise tier has unlimited requests
  if (tier === 'enterprise') {
    next();
    return;
  }
  
  // Calculate current hour window (UTC timestamp truncated to hour)
  const now = Date.now();
  const currentHourWindow = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
  
  // Get or create rate limit tracker for this key
  if (!rateLimitCache.has(keyId)) {
    rateLimitCache.set(keyId, new Map());
  }
  
  const keyRateLimits = rateLimitCache.get(keyId)!;
  const currentCount = keyRateLimits.get(currentHourWindow) || 0;
  
  // Check if limit exceeded
  if (currentCount >= rateLimit) {
    const resetTime = new Date(currentHourWindow + (60 * 60 * 1000));
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You have exceeded the rate limit of ${rateLimit} requests per hour for the ${tier} tier`,
      limit: rateLimit,
      remaining: 0,
      reset: resetTime.toISOString(),
      tier,
    });
    return;
  }
  
  // Increment request count
  keyRateLimits.set(currentHourWindow, currentCount + 1);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', rateLimit.toString());
  res.setHeader('X-RateLimit-Remaining', (rateLimit - currentCount - 1).toString());
  res.setHeader('X-RateLimit-Reset', new Date(currentHourWindow + (60 * 60 * 1000)).toISOString());
  res.setHeader('X-RateLimit-Tier', tier);
  
  next();
}
