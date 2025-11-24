import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

// Extend Express Request to include investor
declare global {
  namespace Express {
    interface Request {
      investor?: {
        id: string;
        email: string;
        name: string;
        status: string;
      };
    }
  }
}

export async function authenticateInvestor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.investor_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource' 
      });
      return;
    }
    
    // Get JWT secret from environment (fail fast if not set)
    const jwtSecret = process.env.INVESTOR_JWT_SECRET;
    if (!jwtSecret) {
      console.error('INVESTOR_JWT_SECRET environment variable is not set');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }
    
    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as { 
      investorId: string; 
      email: string; 
      name: string 
    };
    
    // Get fresh investor data from database
    const investor = await storage.getInvestorById(decoded.investorId);
    
    if (!investor) {
      res.status(401).json({ 
        error: 'Invalid session',
        message: 'Investor account not found' 
      });
      return;
    }
    
    // Check if account is still active
    if (investor.status !== 'active') {
      res.status(403).json({ 
        error: 'Account not active',
        message: 'Your investor account has been deactivated' 
      });
      return;
    }
    
    // Attach investor info to request
    req.investor = {
      id: investor.id,
      email: investor.email,
      name: investor.name,
      status: investor.status,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.' 
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'Invalid authentication token' 
      });
      return;
    }
    
    console.error('Investor authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
