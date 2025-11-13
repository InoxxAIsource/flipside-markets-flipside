import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { web3Service } from "./contracts/web3Service";
import { relayerService } from "./services/relayerService";
import { insertMarketSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// WebSocket client tracking
const wsClients = new Map<string, Set<WebSocket>>();

// Broadcast order book updates to all clients subscribed to a market
function broadcastOrderBookUpdate(marketId: string, data: any) {
  const clients = wsClients.get(marketId);
  if (clients) {
    const message = JSON.stringify({
      type: 'orderbook_update',
      marketId,
      data,
    });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'subscribe' && data.marketId) {
          // Subscribe to market updates
          if (!wsClients.has(data.marketId)) {
            wsClients.set(data.marketId, new Set());
          }
          wsClients.get(data.marketId)!.add(ws);
          console.log(`Client subscribed to market: ${data.marketId}`);
        } else if (data.type === 'unsubscribe' && data.marketId) {
          // Unsubscribe from market updates
          const clients = wsClients.get(data.marketId);
          if (clients) {
            clients.delete(ws);
          }
          console.log(`Client unsubscribed from market: ${data.marketId}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from all subscriptions
      wsClients.forEach((clients) => {
        clients.delete(ws);
      });
      console.log('WebSocket client disconnected');
    });
  });

  // ========== Market Routes ==========

  // GET /api/markets - Get all markets
  app.get('/api/markets', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      
      const markets = category
        ? await storage.getMarketsByCategory(category)
        : await storage.getAllMarkets();

      res.json(markets);
    } catch (error: any) {
      console.error('Error fetching markets:', error);
      res.status(500).json({ error: 'Failed to fetch markets' });
    }
  });

  // GET /api/markets/:id - Get market by ID
  app.get('/api/markets/:id', async (req, res) => {
    try {
      const market = await storage.getMarket(req.params.id);
      
      if (!market) {
        return res.status(404).json({ error: 'Market not found' });
      }

      res.json(market);
    } catch (error: any) {
      console.error('Error fetching market:', error);
      res.status(500).json({ error: 'Failed to fetch market' });
    }
  });

  // POST /api/markets - Create a new market
  app.post('/api/markets', async (req, res) => {
    try {
      const validation = insertMarketSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const market = await storage.createMarket(validation.data);
      res.status(201).json(market);
    } catch (error: any) {
      console.error('Error creating market:', error);
      res.status(500).json({ error: 'Failed to create market' });
    }
  });

  // PUT /api/markets/:id/resolve - Resolve a market
  app.put('/api/markets/:id/resolve', async (req, res) => {
    try {
      const { outcome } = req.body;
      
      if (typeof outcome !== 'boolean') {
        return res.status(400).json({ error: 'Outcome must be a boolean (true for YES, false for NO)' });
      }

      const market = await storage.resolveMarket(req.params.id, outcome);
      
      if (!market) {
        return res.status(404).json({ error: 'Market not found' });
      }

      res.json(market);
    } catch (error: any) {
      console.error('Error resolving market:', error);
      res.status(500).json({ error: 'Failed to resolve market' });
    }
  });

  // ========== Order Routes ==========

  // GET /api/markets/:marketId/orders - Get orders for a market
  app.get('/api/markets/:marketId/orders', async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const orders = await storage.getMarketOrders(req.params.marketId, status);
      res.json(orders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // GET /api/users/:address/orders - Get orders for a user
  app.get('/api/users/:address/orders', async (req, res) => {
    try {
      const orders = await storage.getUserOrders(req.params.address);
      res.json(orders);
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ error: 'Failed to fetch user orders' });
    }
  });

  // POST /api/orders - Create a new order
  app.post('/api/orders', async (req, res) => {
    try {
      const validation = insertOrderSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      // Verify signature
      const orderData = validation.data;
      
      // Convert amounts to wei (6 decimals) to match frontend signature
      const { ethers } = await import('ethers');
      const makerAmountWei = ethers.parseUnits(orderData.size.toString(), 6).toString();
      const takerAmountWei = ethers.parseUnits(orderData.price.toString(), 6).toString();
      
      const isValid = await web3Service.verifyOrderSignature(
        {
          maker: orderData.makerAddress,
          taker: '0x0000000000000000000000000000000000000000',
          tokenId: (orderData as any).tokenId || orderData.marketId,
          makerAmount: makerAmountWei,
          takerAmount: takerAmountWei,
          side: orderData.side === 'buy' ? 0 : 1,
          feeRateBps: 250, // 2.5%
          nonce: orderData.nonce,
          signer: orderData.makerAddress,
          expiration: Math.floor(orderData.expiration.getTime() / 1000),
        },
        orderData.signature
      );

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid order signature' });
      }

      const order = await storage.createOrder(validation.data);

      // Broadcast order book update
      broadcastOrderBookUpdate(order.marketId, { type: 'new_order', order });

      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // DELETE /api/orders/:id - Cancel an order
  app.delete('/api/orders/:id', async (req, res) => {
    try {
      await storage.cancelOrder(req.params.id);
      
      const order = await storage.getOrder(req.params.id);
      if (order) {
        broadcastOrderBookUpdate(order.marketId, { type: 'order_cancelled', orderId: req.params.id });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  });

  // ========== Position Routes ==========

  // GET /api/users/:address/positions - Get user positions
  app.get('/api/users/:address/positions', async (req, res) => {
    try {
      const positions = await storage.getUserPositions(req.params.address);
      res.json(positions);
    } catch (error: any) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ error: 'Failed to fetch positions' });
    }
  });

  // GET /api/users/:address/positions/:marketId - Get user position in a market
  app.get('/api/users/:address/positions/:marketId', async (req, res) => {
    try {
      const position = await storage.getUserPosition(req.params.address, req.params.marketId);
      
      if (!position) {
        return res.status(404).json({ error: 'Position not found' });
      }

      res.json(position);
    } catch (error: any) {
      console.error('Error fetching position:', error);
      res.status(500).json({ error: 'Failed to fetch position' });
    }
  });

  // ========== Order Fill Routes ==========

  // GET /api/markets/:marketId/fills - Get fills for a market
  app.get('/api/markets/:marketId/fills', async (req, res) => {
    try {
      const fills = await storage.getMarketFills(req.params.marketId);
      res.json(fills);
    } catch (error: any) {
      console.error('Error fetching fills:', error);
      res.status(500).json({ error: 'Failed to fetch fills' });
    }
  });

  // ========== User Routes ==========

  // POST /api/users - Create or get user by wallet
  app.post('/api/users', async (req, res) => {
    try {
      const { walletAddress, username } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }

      // Check if user exists
      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          walletAddress,
          username: username || null,
          passwordHash: null,
        });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Error creating/getting user:', error);
      res.status(500).json({ error: 'Failed to create/get user' });
    }
  });

  // GET /api/users/:address - Get user by wallet address
  app.get('/api/users/:address', async (req, res) => {
    try {
      const user = await storage.getUserByWallet(req.params.address);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // ========== Web3 Routes ==========

  // GET /api/web3/balance/:address - Get USDT balance
  app.get('/api/web3/balance/:address', async (req, res) => {
    try {
      const balance = await web3Service.getUSDTBalance(req.params.address);
      res.json({ balance: balance.toString() });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  });

  // GET /api/web3/token-balance/:address/:tokenId - Get conditional token balance
  app.get('/api/web3/token-balance/:address/:tokenId', async (req, res) => {
    try {
      const balance = await web3Service.getTokenBalance(
        req.params.address,
        BigInt(req.params.tokenId)
      );
      res.json({ balance: balance.toString() });
    } catch (error: any) {
      console.error('Error fetching token balance:', error);
      res.status(500).json({ error: 'Failed to fetch token balance' });
    }
  });

  // ========== ProxyWallet Routes ==========

  // POST /api/proxy/meta-transaction - Submit signed meta-transaction to relayer queue
  app.post('/api/proxy/meta-transaction', async (req, res) => {
    try {
      const { user, target, data, signature, deadline } = req.body;

      if (!user || !target || !data || !signature || !deadline) {
        return res.status(400).json({ 
          error: 'Missing required fields: user, target, data, signature, deadline' 
        });
      }

      const result = await relayerService.addMetaTransaction(
        user,
        target,
        data,
        signature,
        deadline
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error submitting meta-transaction:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to submit meta-transaction' 
      });
    }
  });

  // GET /api/proxy/meta-transaction/:txId - Get meta-transaction status
  app.get('/api/proxy/meta-transaction/:txId', async (req, res) => {
    try {
      const status = relayerService.getTransactionStatus(req.params.txId);

      if (!status) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json(status);
    } catch (error: any) {
      console.error('Error fetching meta-transaction status:', error);
      res.status(500).json({ error: 'Failed to fetch meta-transaction status' });
    }
  });

  // GET /api/proxy/balance/:address - Get user's USDT balance in ProxyWallet
  app.get('/api/proxy/balance/:address', async (req, res) => {
    try {
      const balance = await web3Service.getProxyWalletBalance(req.params.address);
      res.json({ balance: balance.toString() });
    } catch (error: any) {
      console.error('Error fetching ProxyWallet balance:', error);
      res.status(500).json({ error: 'Failed to fetch ProxyWallet balance' });
    }
  });

  // GET /api/proxy/positions/:address/:tokenId - Get user's position token balance in ProxyWallet
  app.get('/api/proxy/positions/:address/:tokenId', async (req, res) => {
    try {
      const balance = await web3Service.getProxyPositionBalance(
        req.params.address,
        BigInt(req.params.tokenId)
      );
      res.json({ balance: balance.toString() });
    } catch (error: any) {
      console.error('Error fetching ProxyWallet position balance:', error);
      res.status(500).json({ error: 'Failed to fetch ProxyWallet position balance' });
    }
  });

  // GET /api/proxy/nonce/:address - Get user's current nonce for meta-transaction signing
  app.get('/api/proxy/nonce/:address', async (req, res) => {
    try {
      const nonce = await web3Service.getProxyWalletNonce(req.params.address);
      res.json({ nonce: Number(nonce) });
    } catch (error: any) {
      console.error('Error fetching ProxyWallet nonce:', error);
      res.status(500).json({ error: 'Failed to fetch ProxyWallet nonce' });
    }
  });

  // GET /api/proxy/stats - Get relayer queue statistics
  app.get('/api/proxy/stats', async (req, res) => {
    try {
      const stats = relayerService.getQueueStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching relayer stats:', error);
      res.status(500).json({ error: 'Failed to fetch relayer stats' });
    }
  });

  return httpServer;
}
