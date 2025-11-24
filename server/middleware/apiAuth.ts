import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';

// Extend Express Request to include apiKey and user
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        userId: string;
        tier: string;
        rateLimit: number;
      };
      user?: {
        id: string;
        walletAddress: string;
      };
    }
  }
}

export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKeyHeader = req.headers['x-api-key'];
    
    if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
      res.status(401).json({ 
        error: 'API key required',
        message: 'Please provide an API key in the X-API-Key header' 
      });
      return;
    }
    
    // Hash the incoming API key to search in database
    // Since we store bcrypt hashes, we need to fetch all active keys and compare
    // For better performance in production, consider using a faster hash for lookup
    // and bcrypt only for verification
    const keyPrefix = apiKeyHeader.substring(0, 8);
    
    // Get all active API keys
    const allKeys = await storage.getActiveApiKeys();
    
    // Find matching key by comparing hashes
    // First filter by prefix for performance, then verify with bcrypt
    let matchedKey = null;
    for (const key of allKeys.filter(k => k.keyPrefix === keyPrefix)) {
      const isMatch = await bcrypt.compare(apiKeyHeader, key.keyHash);
      if (isMatch) {
        matchedKey = key;
        break;
      }
    }
    
    if (!matchedKey) {
      res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is invalid or has been revoked' 
      });
      return;
    }
    
    // Update last used timestamp
    await storage.updateApiKeyUsage(matchedKey.id);
    
    // Attach API key info to request
    req.apiKey = {
      id: matchedKey.id,
      userId: matchedKey.userId,
      tier: matchedKey.tier,
      rateLimit: matchedKey.rateLimit,
    };
    
    // Optionally attach user info
    // const user = await storage.getUserById(matchedKey.userId);
    // if (user) {
    //   req.user = user;
    // }
    
    next();
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
