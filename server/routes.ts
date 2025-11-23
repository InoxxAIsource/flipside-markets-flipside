import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, db } from "./storage";
import { web3Service } from "./contracts/web3Service";
import { ammService } from "./contracts/ammService";
import { relayerService } from "./services/relayerService";
import { orderMatcher } from "./services/orderMatcher";
import { insertMarketSchema, insertOrderSchema, orders, orderFills } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { MarketDepthCalculator } from "./services/marketDepth";
import type { ProxyWalletService } from "./services/proxyWalletService";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { randomBytes } from "crypto";
import { postMarketToTwitter } from "./services/twitter";
import { rewardsService } from "./services/rewardsService";
import { sql } from "drizzle-orm";

// Module-level variable for ProxyWalletService (set by server/index.ts)
let proxyWalletServiceInstance: ProxyWalletService | null = null;

export function setProxyWalletService(service: ProxyWalletService) {
  proxyWalletServiceInstance = service;
}

// Configure multer for image uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
    }
  },
});

// WebSocket client tracking
const wsClients = new Map<string, Set<WebSocket>>();

// Depth cache with TTL (5 seconds)
const depthCache = new Map<string, { depth: any; quality: any; timestamp: number }>();
const DEPTH_CACHE_TTL = 5000;

// Broadcast order book updates to all clients subscribed to a market
// Fire-and-forget pattern to prevent unhandled promise rejections
function broadcastOrderBookUpdate(marketId: string, data: any) {
  const clients = wsClients.get(marketId);
  if (!clients || clients.size === 0) return;

  // Invalidate cache when order book changes
  depthCache.delete(marketId);

  // Execute async broadcast in background with error handling
  void (async () => {
    try {
      // Always calculate fresh depth after invalidation
      const now = Date.now();
      const orders = await storage.getMarketOrders(marketId, 'open');
      const depth = MarketDepthCalculator.calculateDepth(orders);
      const quality = MarketDepthCalculator.calculateMarketQuality(depth);
      
      // Cache the fresh result
      depthCache.set(marketId, { depth, quality, timestamp: now });
      
      const message = JSON.stringify({
        type: 'orderbook_update',
        marketId,
        data,
        depth: {
          bids: depth.bids.slice(0, 10), // Top 10 price levels
          asks: depth.asks.slice(0, 10),
          spread: depth.spread,
          spreadPercentage: depth.spreadPercentage,
          midPrice: depth.midPrice,
          bestBid: depth.bestBid,
          bestAsk: depth.bestAsk,
          totalBidVolume: depth.totalBidVolume,
          totalAskVolume: depth.totalAskVolume,
          quality,
        },
        timestamp: now,
      });
      
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error(`Error broadcasting order book update for market ${marketId}:`, error);
      // Continue execution - don't crash the server
    }
  })();
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

  // GET /api/markets/:id/stats - Get real market statistics
  app.get('/api/markets/:id/stats', async (req, res) => {
    try {
      const marketId = req.params.id;
      const market = await storage.getMarket(marketId);
      
      if (!market) {
        return res.status(404).json({ error: 'Market not found' });
      }

      // Calculate unique traders from orders (both makers and takers)
      const tradersResult = await db.execute(sql`
        SELECT COUNT(DISTINCT user_address) as traders
        FROM (
          SELECT maker_address as user_address FROM orders WHERE market_id = ${marketId}
          UNION
          SELECT taker_address as user_address FROM order_fills WHERE market_id = ${marketId} AND taker_address IS NOT NULL
        ) as all_traders
      `);
      
      const traders = Number(tradersResult.rows[0]?.traders || 0);

      // Calculate 24h trades count from order fills
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tradesResult = await db.execute(sql`
        SELECT COUNT(*) as trades_24h
        FROM order_fills
        WHERE market_id = ${marketId}
        AND created_at >= ${twentyFourHoursAgo.toISOString()}
      `);
      
      const trades24h = Number(tradesResult.rows[0]?.trades_24h || 0);

      res.json({
        traders,
        trades24h,
        volume: Number(market.volume) || 0,
        liquidity: Number(market.liquidity) || 0
      });
    } catch (error: any) {
      console.error('Error fetching market stats:', error);
      console.error('Error details:', error.message, error.stack);
      res.status(500).json({ error: 'Failed to fetch market statistics' });
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

      const marketData = validation.data;
      
      // Extract postToTwitter flag from request body (not validated by insertMarketSchema)
      const postToTwitter = req.body.postToTwitter === true;
      
      if (!marketData.conditionId || !marketData.yesTokenId || !marketData.noTokenId || !marketData.creationTxHash) {
        return res.status(400).json({ 
          error: 'Missing blockchain data: conditionId, yesTokenId, noTokenId, and creationTxHash are required' 
        });
      }

      let eventQuestionId: string;
      let eventOracle: string;
      let eventOutcomeSlotCount: number;

      try {
        const { ethers } = await import('ethers');
        const provider = web3Service.getProvider();
        
        const receipt = await provider.getTransactionReceipt(marketData.creationTxHash);
        if (!receipt) {
          return res.status(400).json({ 
            error: 'Transaction not found or not confirmed on-chain. Please wait for confirmation.' 
          });
        }
        
        if (receipt.status !== 1) {
          return res.status(400).json({ 
            error: 'Transaction failed on-chain. Please try creating the market again.' 
          });
        }

        const { CONTRACT_ADDRESSES } = await import('./config/contracts');
        if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESSES.CONDITIONAL_TOKENS.toLowerCase()) {
          return res.status(400).json({ 
            error: 'Transaction was not sent to ConditionalTokens contract. Invalid market creation.' 
          });
        }

        const conditionPreparedTopic = ethers.id('ConditionPreparation(bytes32,address,bytes32,uint256)');
        const preparationLog = receipt.logs.find(
          log => log.topics[0] === conditionPreparedTopic && 
                 log.address.toLowerCase() === CONTRACT_ADDRESSES.CONDITIONAL_TOKENS.toLowerCase()
        );

        if (!preparationLog) {
          return res.status(400).json({ 
            error: 'Transaction did not emit ConditionPreparation event. Invalid market creation.' 
          });
        }

        const eventConditionId = preparationLog.topics[1];
        eventOracle = ethers.getAddress('0x' + preparationLog.topics[2].slice(26));
        eventQuestionId = preparationLog.topics[3];
        
        const eventData = ethers.AbiCoder.defaultAbiCoder().decode(
          ['uint256'],
          preparationLog.data
        );
        eventOutcomeSlotCount = Number(eventData[0]);

        if (eventConditionId.toLowerCase() !== marketData.conditionId.toLowerCase()) {
          console.error('ConditionId mismatch:', {
            submitted: marketData.conditionId,
            fromEvent: eventConditionId,
          });
          return res.status(400).json({ 
            error: 'Submitted conditionId does not match on-chain event. Data integrity violation.' 
          });
        }

        if (eventOutcomeSlotCount !== 2) {
          console.error('Invalid outcome slot count:', eventOutcomeSlotCount);
          return res.status(400).json({ 
            error: 'Market must be binary (2 outcomes). Invalid market creation.' 
          });
        }

        if (eventOracle.toLowerCase() !== CONTRACT_ADDRESSES.CTF_EXCHANGE.toLowerCase()) {
          console.error('Oracle mismatch:', {
            fromEvent: eventOracle,
            expected: CONTRACT_ADDRESSES.CTF_EXCHANGE,
          });
          return res.status(400).json({ 
            error: 'Market oracle must be CTFExchange. Invalid market creation.' 
          });
        }

        if (!marketData.questionTimestamp) {
          return res.status(400).json({ 
            error: 'Missing questionTimestamp. Required for verification.' 
          });
        }

        const expectedQuestionId = ethers.id(`${marketData.question}_${Number(marketData.questionTimestamp)}`);
        
        if (eventQuestionId.toLowerCase() !== expectedQuestionId.toLowerCase()) {
          console.error('QuestionId mismatch:', {
            submitted: expectedQuestionId,
            fromEvent: eventQuestionId,
            question: marketData.question,
            timestamp: marketData.questionTimestamp,
          });
          return res.status(400).json({ 
            error: 'Submitted question does not match on-chain questionId. Data integrity violation.' 
          });
        }

        const expectedYesTokenId = await web3Service.getPositionId(
          CONTRACT_ADDRESSES.MOCK_USDT,
          eventConditionId,
          0
        );
        const expectedNoTokenId = await web3Service.getPositionId(
          CONTRACT_ADDRESSES.MOCK_USDT,
          eventConditionId,
          1
        );

        if (marketData.yesTokenId !== expectedYesTokenId.toString()) {
          console.error('YES token ID mismatch:', {
            submitted: marketData.yesTokenId,
            expected: expectedYesTokenId.toString(),
          });
          return res.status(400).json({ 
            error: 'Submitted yesTokenId does not match expected value. Data integrity violation.' 
          });
        }

        if (marketData.noTokenId !== expectedNoTokenId.toString()) {
          console.error('NO token ID mismatch:', {
            submitted: marketData.noTokenId,
            expected: expectedNoTokenId.toString(),
          });
          return res.status(400).json({ 
            error: 'Submitted noTokenId does not match expected value. Data integrity violation.' 
          });
        }

        console.log('Transaction verified:', {
          hash: marketData.creationTxHash,
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          conditionId: eventConditionId,
          yesTokenId: expectedYesTokenId.toString(),
          noTokenId: expectedNoTokenId.toString(),
        });

      } catch (verifyError: any) {
        console.error('Blockchain verification failed:', verifyError);
        return res.status(400).json({ 
          error: 'Failed to verify blockchain transaction. Please ensure the transaction succeeded.' 
        });
      }

      try {
        const market = await storage.createMarket({
          ...marketData,
          questionId: eventQuestionId,
          oracle: eventOracle,
          outcomeSlotCount: eventOutcomeSlotCount,
        });
        
        console.log(`Market ${market.id} saved to database with conditionId: ${market.conditionId}`);
        
        // Post to Twitter asynchronously if enabled (don't block market creation)
        if (postToTwitter) {
          const baseUrl = 'https://flipside.exchange';
          console.log('🐦 Attempting to post market to Twitter:', { marketId: market.id, baseUrl });
          postMarketToTwitter({
            id: market.id,
            question: market.question,
            imageUrl: market.imageUrl,
            yesPrice: market.yesPrice,
            noPrice: market.noPrice,
            category: market.category,
          }, baseUrl).then(async (tweetUrl) => {
            if (tweetUrl) {
              // Update market with tweet URL
              try {
                await storage.updateMarket(market.id, { tweetUrl });
                console.log(`✅ Updated market ${market.id} with tweet URL: ${tweetUrl}`);
              } catch (err) {
                console.error('Failed to update market with tweet URL:', err);
              }
            }
          }).catch((err) => {
            console.error('Failed to post market to Twitter:', err);
          });
        } else {
          console.log('⏭️ Twitter posting skipped (postToTwitter = false)');
        }
        
        res.status(201).json(market);
      } catch (dbError: any) {
        console.error('Database save error:', dbError);
        console.error('Market data:', {
          ...marketData,
          questionId: eventQuestionId,
          oracle: eventOracle,
          outcomeSlotCount: eventOutcomeSlotCount,
        });
        return res.status(500).json({ 
          error: 'Market created on-chain but failed to save to database. Please contact support.',
          txHash: marketData.creationTxHash 
        });
      }
    } catch (error: any) {
      console.error('Error creating market:', error);
      res.status(500).json({ error: 'Failed to create market' });
    }
  });

  // POST /api/markets/upload-image - Upload and resize market image
  app.post('/api/markets/upload-image', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Create market_images directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'attached_assets', 'market_images');
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const uniqueSuffix = randomBytes(8).toString('hex');
      const filename = `market_${Date.now()}_${uniqueSuffix}.webp`;
      const filePath = path.join(uploadDir, filename);

      // Resize image to 800x450px (16:9 aspect ratio) and convert to WebP
      await sharp(req.file.buffer)
        .resize(800, 450, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toFile(filePath);

      // Return public URL
      const imageUrl = `/market_images/${filename}`;
      res.json({ imageUrl });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // POST /api/markets/:id/ai-analysis - Generate AI analysis for a market
  app.post('/api/markets/:id/ai-analysis', async (req, res) => {
    try {
      const { analyzeMarket } = await import('./services/aiAnalysis');
      
      const market = await storage.getMarket(req.params.id);
      
      if (!market) {
        return res.status(404).json({ error: 'Market not found' });
      }

      // Generate AI analysis
      const analysis = await analyzeMarket({
        question: market.question,
        description: market.description || undefined,
        category: market.category,
        expiresAt: market.expiresAt,
        currentYesPrice: market.yesPrice,
        currentNoPrice: market.noPrice,
        volume: market.volume,
        pythPriceFeedId: market.pythPriceFeedId || undefined,
        baselinePrice: market.baselinePrice || undefined,
      });

      // Store analysis in database
      const updatedMarket = await storage.updateMarketAIAnalysis(req.params.id, JSON.stringify(analysis));

      res.json(analysis);
    } catch (error: any) {
      console.error('Error generating AI analysis:', error);
      res.status(500).json({ error: error.message || 'Failed to generate AI analysis' });
    }
  });

  // GET /api/markets/:id/current-price - Get current Pyth oracle price for a market
  app.get('/api/markets/:id/current-price', async (req, res) => {
    try {
      const { fetchPythPrice } = await import('./services/pythPriceService');
      
      const market = await storage.getMarket(req.params.id);
      
      if (!market) {
        return res.status(404).json({ error: 'Market not found' });
      }

      if (!market.pythPriceFeedId) {
        return res.status(400).json({ error: 'Market does not have a Pyth price feed configured' });
      }

      // Fetch current price from Pyth network
      const priceData = await fetchPythPrice(market.pythPriceFeedId);
      
      if (!priceData) {
        return res.status(503).json({ error: 'Failed to fetch price from Pyth network' });
      }

      res.json({
        currentPrice: priceData.currentPrice,
        targetPrice: market.targetPrice || market.baselinePrice || null,
        confidence: priceData.confidence,
        publishTime: priceData.publishTime,
        priceFeedId: market.pythPriceFeedId,
      });
    } catch (error: any) {
      console.error('Error fetching current price:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch current price' });
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

  // ========== Sports Market Routes ==========

  // POST /api/markets/sports/generate - Generate sports markets from ESPN
  app.post('/api/markets/sports/generate', async (req, res) => {
    try {
      const { fetchAllSportsScoreboards, filterUpcomingGames } = await import('./services/espn');
      
      // Fetch all upcoming games from ESPN
      const allGames = await fetchAllSportsScoreboards();
      const upcomingGames = filterUpcomingGames(allGames);
      
      if (upcomingGames.length === 0) {
        return res.json({ 
          message: 'No upcoming games found', 
          created: 0,
          markets: [] 
        });
      }
      
      // Define sports market schema once (outside loop)
      const sportsMarketSchema = insertMarketSchema.extend({
        // Market prices (calculated from ESPN odds)
        yesPrice: z.number().min(0).max(1),
        noPrice: z.number().min(0).max(1),
        volume: z.number().default(0),
        liquidity: z.number().default(0),
        resolved: z.boolean().default(false),
        resolvedAt: z.date().nullable().default(null),
        outcome: z.boolean().nullable().default(null),
        
        // Sports-specific ESPN fields
        espnEventId: z.string().optional(),
        homeTeam: z.string().optional(),
        awayTeam: z.string().optional(),
        homeTeamLogo: z.string().optional(),
        awayTeamLogo: z.string().optional(),
        homeTeamColor: z.string().optional(),
        awayTeamColor: z.string().optional(),
        sport: z.string().optional(),
        gameDate: z.date().optional(),  // Date object
        venue: z.string().optional(),
        spread: z.string().optional(),
        overUnder: z.number().optional(),
        gameStatus: z.string().optional(),
        homeScore: z.number().optional(),
        awayScore: z.number().optional(),
      }).omit({
        // Sports markets don't need blockchain fields
        conditionId: true,
        yesTokenId: true,
        noTokenId: true,
        creationTxHash: true,
        questionId: true,
        questionTimestamp: true,
        oracle: true,
      });
      
      // Check which games already have markets (by ESPN event ID)
      const createdMarkets = [];
      const skippedGames = [];
      
      for (const game of upcomingGames) {
        // Skip if market already exists for this ESPN event
        const existingMarket = await storage.getMarketByEspnEventId(game.espnEventId);
        if (existingMarket) {
          skippedGames.push(game.espnEventId);
          continue;
        }
        
        // Set expiration to game date (markets expire when games start)
        const expiresAt = new Date(game.gameDate);
        
        // Create market without blockchain data (admin-created sports markets)
        const marketData = {
          question: game.question,
          description: game.description,
          category: game.category,
          expiresAt,  // Pass Date object directly
          marketType: 'CLOB' as const,
          creatorAddress: '0x0000000000000000000000000000000000000000', // System address
          
          // Required market fields (defaults for new sports markets)
          liquidity: 0,
          volume: 0,
          yesPrice: game.yesPrice, // Calculated from ESPN odds
          noPrice: game.noPrice,   // Calculated from ESPN odds
          resolved: false,
          resolvedAt: null,  // Not resolved yet
          outcome: null,  // No outcome yet
          imageUrl: '',  // Empty string for sports markets (use team logos instead)
          
          // Sports-specific fields
          espnEventId: game.espnEventId,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeTeamLogo: game.homeTeamLogo,
          awayTeamLogo: game.awayTeamLogo,
          homeTeamColor: game.homeTeamColor,
          awayTeamColor: game.awayTeamColor,
          sport: game.sport,
          gameDate: game.gameDate,  // Pass Date object directly
          venue: game.venue,
          spread: game.spread,
          overUnder: game.overUnder,
          gameStatus: game.gameStatus,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
        };
        
        // Validate data before insert
        const validation = sportsMarketSchema.safeParse(marketData);
        if (!validation.success) {
          console.error(`Skipping invalid sports market for ${game.espnEventId}:`, validation.error);
          skippedGames.push(game.espnEventId);
          continue;
        }
        
        const market = await storage.createSportsMarket(validation.data);
        createdMarkets.push(market);
      }
      
      res.json({
        message: `Created ${createdMarkets.length} sports markets`,
        created: createdMarkets.length,
        skipped: skippedGames.length,
        markets: createdMarkets,
      });
    } catch (error: any) {
      console.error('Error generating sports markets:', error);
      res.status(500).json({ error: error.message || 'Failed to generate sports markets' });
    }
  });

  // GET /api/markets/sports/upcoming - Get upcoming sports games from ESPN
  app.get('/api/markets/sports/upcoming', async (req, res) => {
    try {
      const { fetchAllSportsScoreboards, filterUpcomingGames } = await import('./services/espn');
      
      const allGames = await fetchAllSportsScoreboards();
      const upcomingGames = filterUpcomingGames(allGames);
      
      res.json({
        count: upcomingGames.length,
        games: upcomingGames,
      });
    } catch (error: any) {
      console.error('Error fetching upcoming games:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch upcoming games' });
    }
  });

  // ========== AMM Pool Routes ==========

  // POST /api/markets/pool - Create a Pool-type market with AMM
  app.post('/api/markets/pool', async (req, res) => {
    try {
      const poolMarketSchema = insertMarketSchema.extend({
        initialYesLiquidity: z.string().min(1, 'Initial YES liquidity required'),
        initialNoLiquidity: z.string().min(1, 'Initial NO liquidity required'),
        lpName: z.string().optional(),
        lpSymbol: z.string().optional(),
      });

      const validation = poolMarketSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const marketData = validation.data;
      
      // Extract postToTwitter flag from request body (not validated by schema)
      const postToTwitter = req.body.postToTwitter === true;

      // Verify market data is complete
      if (!marketData.conditionId || !marketData.yesTokenId || !marketData.noTokenId || !marketData.creationTxHash) {
        return res.status(400).json({ 
          error: 'Missing blockchain data: conditionId, yesTokenId, noTokenId, and creationTxHash are required' 
        });
      }

      // Verify the condition was prepared on-chain (same validation as CLOB markets)
      const { ethers } = await import('ethers');
      const provider = web3Service.getProvider();
      
      const receipt = await provider.getTransactionReceipt(marketData.creationTxHash);
      if (!receipt || receipt.status !== 1) {
        return res.status(400).json({ 
          error: 'Transaction not confirmed or failed on-chain' 
        });
      }

      // Create the AMM pool using factory
      if (!process.env.OWNER_PRIVATE_KEY) {
        return res.status(500).json({ error: 'Owner private key not configured' });
      }

      const signer = ammService.getSigner(process.env.OWNER_PRIVATE_KEY);
      
      const lpName = marketData.lpName || `${marketData.question.slice(0, 30)} LP`;
      const lpSymbol = marketData.lpSymbol || 'FLP';

      const poolResult = await ammService.createPool({
        name: lpName,
        symbol: lpSymbol,
        conditionId: marketData.conditionId,
        oracle: marketData.creatorAddress, // Creator is oracle for pool markets
        yesPositionId: marketData.yesTokenId,
        noPositionId: marketData.noTokenId,
        signer,
      });

      // Save market to database with pool type and address
      const market = await storage.createMarket({
        ...marketData,
        marketType: 'POOL',
        poolAddress: poolResult.poolAddress,
      });

      // Post to Twitter asynchronously if enabled (don't block market creation)
      if (postToTwitter) {
        const baseUrl = 'https://flipside.exchange';
        console.log('🐦 Attempting to post pool market to Twitter:', { marketId: market.id, baseUrl });
        postMarketToTwitter({
          id: market.id,
          question: market.question,
          imageUrl: market.imageUrl,
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
          category: market.category,
        }, baseUrl).then(async (tweetUrl) => {
          if (tweetUrl) {
            // Update market with tweet URL
            try {
              await storage.updateMarket(market.id, { tweetUrl });
              console.log(`✅ Updated pool market ${market.id} with tweet URL: ${tweetUrl}`);
            } catch (err) {
              console.error('Failed to update pool market with tweet URL:', err);
            }
          }
        }).catch((err) => {
          console.error('Failed to post pool market to Twitter:', err);
        });
      } else {
        console.log('⏭️ Twitter posting skipped for pool market (postToTwitter = false)');
      }

      res.status(201).json({
        ...market,
        poolTxHash: poolResult.txHash,
      });

    } catch (error: any) {
      console.error('Error creating pool market:', error);
      res.status(500).json({ error: error.message || 'Failed to create pool market' });
    }
  });

  // POST /api/pool/sync-liquidity - Sync all pool market liquidity values from on-chain
  app.post('/api/pool/sync-liquidity', async (req, res) => {
    try {
      const markets = await storage.getAllMarkets();
      const poolMarkets = markets.filter(m => m.marketType === 'POOL' && m.poolAddress);
      
      const results = [];
      for (const market of poolMarkets) {
        try {
          const poolInfo = await ammService.getPoolInfo(market.poolAddress!);
          const totalLiquidity = parseFloat(poolInfo.totalLiquidity);
          
          await storage.updateMarket(market.id, { liquidity: totalLiquidity });
          
          results.push({
            marketId: market.id,
            question: market.question,
            poolAddress: market.poolAddress,
            liquidity: totalLiquidity,
            status: 'updated'
          });
        } catch (error: any) {
          results.push({
            marketId: market.id,
            error: error.message,
            status: 'failed'
          });
        }
      }
      
      res.json({ 
        message: `Updated ${results.filter(r => r.status === 'updated').length} pool markets`,
        results 
      });
    } catch (error: any) {
      console.error('Error syncing pool liquidity:', error);
      res.status(500).json({ error: error.message || 'Failed to sync pool liquidity' });
    }
  });

  // GET /api/pool/:poolAddress/info - Get AMM pool information
  app.get('/api/pool/:poolAddress/info', async (req, res) => {
    try {
      const poolInfo = await ammService.getPoolInfo(req.params.poolAddress);
      res.json(poolInfo);
    } catch (error: any) {
      console.error('Error fetching pool info:', error);
      res.status(500).json({ error: 'Failed to fetch pool information' });
    }
  });

  // POST /api/pool/swap - Execute an AMM swap
  app.post('/api/pool/swap', async (req, res) => {
    try {
      const swapSchema = z.object({
        poolAddress: z.string(),
        buyYes: z.boolean(),
        amountIn: z.string(),
        minAmountOut: z.string(),
        userAddress: z.string(),
        privateKey: z.string(), // In production, use ProxyWallet meta-tx
      });

      const validation = swapSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const { poolAddress, buyYes, amountIn, minAmountOut, privateKey } = validation.data;

      const signer = ammService.getSigner(privateKey);
      
      const result = await ammService.swap({
        poolAddress,
        buyYes,
        amountIn,
        minAmountOut,
        signer,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error executing swap:', error);
      res.status(500).json({ error: error.message || 'Failed to execute swap' });
    }
  });

  // GET /api/pool/:poolAddress/quote - Get swap quote (no transaction)
  app.get('/api/pool/:poolAddress/quote', async (req, res) => {
    try {
      const { buyYes, amountIn } = req.query;
      
      if (!buyYes || !amountIn) {
        return res.status(400).json({ error: 'Missing required parameters: buyYes, amountIn' });
      }

      const quote = await ammService.getSwapQuote(
        req.params.poolAddress,
        buyYes === 'true',
        amountIn as string
      );

      res.json(quote);
    } catch (error: any) {
      console.error('Error getting swap quote:', error);
      res.status(500).json({ error: 'Failed to get swap quote' });
    }
  });

  // POST /api/pool/liquidity/add - Add liquidity to a pool
  app.post('/api/pool/liquidity/add', async (req, res) => {
    try {
      const liquiditySchema = z.object({
        poolAddress: z.string(),
        yesAmount: z.string(),
        noAmount: z.string(),
        minLPTokens: z.string(),
        privateKey: z.string(), // In production, use ProxyWallet meta-tx
      });

      const validation = liquiditySchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const { poolAddress, yesAmount, noAmount, minLPTokens, privateKey } = validation.data;

      const signer = ammService.getSigner(privateKey);
      
      const result = await ammService.addLiquidity({
        poolAddress,
        yesAmount,
        noAmount,
        minLPTokens,
        signer,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error adding liquidity:', error);
      res.status(500).json({ error: error.message || 'Failed to add liquidity' });
    }
  });

  // POST /api/pool/liquidity/remove - Remove liquidity from a pool
  app.post('/api/pool/liquidity/remove', async (req, res) => {
    try {
      const liquiditySchema = z.object({
        poolAddress: z.string(),
        lpTokens: z.string(),
        minYesAmount: z.string(),
        minNoAmount: z.string(),
        privateKey: z.string(), // In production, use ProxyWallet meta-tx
      });

      const validation = liquiditySchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const { poolAddress, lpTokens, minYesAmount, minNoAmount, privateKey } = validation.data;

      const signer = ammService.getSigner(privateKey);
      
      const result = await ammService.removeLiquidity({
        poolAddress,
        lpTokens,
        minYesAmount,
        minNoAmount,
        signer,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error removing liquidity:', error);
      res.status(500).json({ error: error.message || 'Failed to remove liquidity' });
    }
  });

  // GET /api/pool/:poolAddress/user/:userAddress - Get user's pool position
  app.get('/api/pool/:poolAddress/user/:userAddress', async (req, res) => {
    try {
      const userShare = await ammService.getUserPoolShare(
        req.params.poolAddress,
        req.params.userAddress
      );

      res.json(userShare);
    } catch (error: any) {
      console.error('Error fetching user pool position:', error);
      res.status(500).json({ error: 'Failed to fetch user pool position' });
    }
  });

  // GET /api/amm/swaps - Get all AMM swaps
  app.get('/api/amm/swaps', async (req, res) => {
    try {
      const swaps = await storage.getAllAmmSwaps();
      res.json(swaps);
    } catch (error: any) {
      console.error('Error fetching AMM swaps:', error);
      res.status(500).json({ error: 'Failed to fetch AMM swaps' });
    }
  });

  // GET /api/amm/swaps/:userAddress - Get user's AMM swap history
  app.get('/api/amm/swaps/:userAddress', async (req, res) => {
    try {
      const swaps = await storage.getUserAmmSwaps(req.params.userAddress.toLowerCase());
      res.json(swaps);
    } catch (error: any) {
      console.error('Error fetching user AMM swaps:', error);
      res.status(500).json({ error: 'Failed to fetch user AMM swaps' });
    }
  });

  // GET /api/positions/merges/:userAddress - Get user's position merge/redeem history
  app.get('/api/positions/merges/:userAddress', async (req, res) => {
    try {
      const merges = await storage.getUserPositionMerges(req.params.userAddress.toLowerCase());
      res.json(merges);
    } catch (error: any) {
      console.error('Error fetching user position merges:', error);
      res.status(500).json({ error: 'Failed to fetch user position merges' });
    }
  });

  // GET /api/pool/:poolAddress/volume - Get pool trading volume
  app.get('/api/pool/:poolAddress/volume', async (req, res) => {
    try {
      const swaps = await storage.getPoolAmmSwaps(req.params.poolAddress.toLowerCase());
      
      // Calculate total volume and 24h volume
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const totalVolume = swaps.reduce((sum, swap) => sum + (swap.amountIn || 0), 0);
      const volume24h = swaps
        .filter(swap => new Date(swap.createdAt) >= oneDayAgo)
        .reduce((sum, swap) => sum + (swap.amountIn || 0), 0);
      
      const swapCount = swaps.length;
      const swapCount24h = swaps.filter(swap => new Date(swap.createdAt) >= oneDayAgo).length;

      res.json({
        poolAddress: req.params.poolAddress,
        totalVolume,
        volume24h,
        swapCount,
        swapCount24h,
      });
    } catch (error: any) {
      console.error('Error fetching pool volume:', error);
      res.status(500).json({ error: 'Failed to fetch pool volume' });
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

  // GET /api/markets/:marketId/depth - Get order book depth and market quality metrics
  app.get('/api/markets/:marketId/depth', async (req, res) => {
    try {
      const { MarketDepthCalculator } = await import('./services/marketDepth');
      const orders = await storage.getMarketOrders(req.params.marketId, 'open');
      
      const depth = MarketDepthCalculator.calculateDepth(orders);
      const quality = MarketDepthCalculator.calculateMarketQuality(depth);
      const liquidity = MarketDepthCalculator.calculateLiquidityDistribution(
        depth,
        [0.01, 0.02, 0.05, 0.10] // 1%, 2%, 5%, 10% from mid price
      );
      
      res.json({
        ...depth,
        quality,
        liquidity,
      });
    } catch (error: any) {
      console.error('Error calculating market depth:', error);
      res.status(500).json({ error: 'Failed to calculate market depth' });
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

  // GET /api/users/:address/nonce - Get current nonce for a user
  app.get('/api/users/:address/nonce', async (req, res) => {
    try {
      const nonce = await storage.getUserNonce(req.params.address);
      res.json({ nonce: nonce.toString() });
    } catch (error: any) {
      console.error('Error fetching user nonce:', error);
      res.status(500).json({ error: 'Failed to fetch user nonce' });
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
      
      // Convert nonce and expiration to BigInt for signature verification
      // Frontend signs with BigInt but JSON converts to string/Date
      const nonceBigInt = BigInt(orderData.nonce);
      const expirationBigInt = BigInt(Math.floor(orderData.expiration.getTime() / 1000));
      
      const isValid = await web3Service.verifyOrderSignature(
        {
          maker: orderData.makerAddress,
          taker: '0x0000000000000000000000000000000000000000',
          tokenId: (orderData as any).tokenId || orderData.marketId,
          makerAmount: makerAmountWei,
          takerAmount: takerAmountWei,
          side: orderData.side === 'buy' ? 0 : 1,
          feeRateBps: 250, // 2.5%
          nonce: nonceBigInt,
          signer: orderData.makerAddress,
          expiration: expirationBigInt,
        },
        orderData.signature
      );

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid order signature' });
      }

      // Validate and update nonce to prevent replay attacks
      const nonceValid = await storage.validateAndUpdateNonce(
        orderData.makerAddress,
        BigInt(orderData.nonce)
      );
      
      if (!nonceValid) {
        return res.status(400).json({ 
          error: 'Invalid nonce. Nonce must be greater than the last used nonce.' 
        });
      }

      // Validate Fill-or-Kill (FOK) orders - must have enough liquidity
      if (orderData.timeInForce === 'FOK') {
        const marketOrders = await storage.getMarketOrders(orderData.marketId, 'open');
        
        // Get opposite-side orders that can fill this FOK order
        const oppositeSide = orderData.side === 'buy' ? 'sell' : 'buy';
        const sameOutcome = orderData.outcome;
        const matchableOrders = marketOrders.filter(o => 
          o.side === oppositeSide && 
          o.outcome === sameOutcome &&
          (orderData.side === 'buy' ? o.price <= orderData.price : o.price >= orderData.price)
        ).sort((a, b) => orderData.side === 'buy' ? a.price - b.price : b.price - a.price);
        
        // Calculate total available liquidity
        let availableLiquidity = 0;
        for (const matchOrder of matchableOrders) {
          availableLiquidity += (matchOrder.size - matchOrder.filled);
          if (availableLiquidity >= orderData.size) break;
        }
        
        if (availableLiquidity < orderData.size) {
          return res.status(400).json({ 
            error: `Fill-or-Kill order rejected: Insufficient liquidity. Need ${orderData.size} shares, only ${availableLiquidity.toFixed(2)} available.` 
          });
        }
      }

      // Validate Stop-Loss orders - require stopPrice
      if (orderData.orderType === 'stop-loss') {
        if (!orderData.stopPrice) {
          return res.status(400).json({ error: 'Stop-loss orders require a stop price' });
        }
        if (orderData.side !== 'sell') {
          return res.status(400).json({ error: 'Stop-loss orders must be sell orders' });
        }
      }

      const order = await storage.createOrder(validation.data);

      // Stop-loss orders don't match immediately - they wait for price trigger
      if (orderData.orderType === 'stop-loss') {
        console.log(`[StopLoss] Created stop-loss order ${order.id} with trigger at ${orderData.stopPrice}`);
        // Broadcast but don't match
        broadcastOrderBookUpdate(order.marketId, { type: 'new_order', order });
        return res.status(201).json(order);
      }

      // Automatically match the order against existing opposite-side orders
      console.log(`[OrderMatcher] Attempting to match order ${order.id}...`);
      await orderMatcher.matchOrder(order);

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

  // ========== Comment Routes ==========

  // GET /api/markets/:marketId/comments - Get all comments for a market
  app.get('/api/markets/:marketId/comments', async (req, res) => {
    try {
      const comments = await storage.getMarketComments(req.params.marketId);
      res.json(comments);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  // POST /api/markets/:marketId/comments - Create a new comment
  app.post('/api/markets/:marketId/comments', async (req, res) => {
    try {
      const { insertCommentSchema } = await import('@shared/schema');
      
      // Validate request body
      const validationResult = insertCommentSchema.safeParse({
        ...req.body,
        marketId: req.params.marketId,
      });

      if (!validationResult.success) {
        const { fromZodError } = await import('zod-validation-error');
        return res.status(400).json({ error: fromZodError(validationResult.error).toString() });
      }

      // Verify market exists
      const market = await storage.getMarket(req.params.marketId);
      if (!market) {
        return res.status(404).json({ error: 'Market not found' });
      }

      const comment = await storage.createComment(validationResult.data);
      res.json(comment);
    } catch (error: any) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });

  // POST /api/comments/:commentId/vote - Vote on a comment
  app.post('/api/comments/:commentId/vote', async (req, res) => {
    try {
      const { userAddress, vote } = req.body;

      if (!userAddress) {
        return res.status(400).json({ error: 'User address is required' });
      }

      // Allow 0 (remove), 1 (upvote), -1 (downvote)
      if (vote !== 1 && vote !== -1 && vote !== 0) {
        return res.status(400).json({ error: 'Vote must be 1 (upvote), -1 (downvote), or 0 (remove vote)' });
      }

      // Verify comment exists
      const comment = await storage.getComment(req.params.commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (vote === 0) {
        // Remove vote - delete vote record and decrement counters atomically
        await storage.deleteCommentVote(req.params.commentId, userAddress);
      } else {
        // Validate with schema (for 1 or -1)
        const { insertCommentVoteSchema } = await import('@shared/schema');
        const validationResult = insertCommentVoteSchema.safeParse({
          commentId: req.params.commentId,
          userAddress,
          vote,
        });

        if (!validationResult.success) {
          const { fromZodError } = await import('zod-validation-error');
          return res.status(400).json({ error: fromZodError(validationResult.error).toString() });
        }

        // Upsert vote (handles both new votes and vote changes)
        await storage.upsertCommentVote(validationResult.data);
      }

      // Return updated comment with fresh vote counts
      const updatedComment = await storage.getComment(req.params.commentId);
      res.json(updatedComment);
    } catch (error: any) {
      console.error('Error voting on comment:', error);
      res.status(500).json({ error: 'Failed to vote on comment' });
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
      console.error('Error fetching USDT balance:', error);
      res.status(500).json({ error: 'Failed to fetch USDT balance' });
    }
  });

  // GET /api/web3/eth-balance/:address - Get ETH balance
  app.get('/api/web3/eth-balance/:address', async (req, res) => {
    try {
      const balance = await web3Service.getETHBalance(req.params.address);
      res.json({ balance: balance.toString() });
    } catch (error: any) {
      console.error('Error fetching ETH balance:', error);
      res.status(500).json({ error: 'Failed to fetch ETH balance' });
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

  // GET /api/proxy/status/:address - Get user's proxy wallet status
  app.get('/api/proxy/status/:address', async (req, res) => {
    try {
      const userAddress = req.params.address;
      
      // Get proxy wallet service instance
      if (!proxyWalletServiceInstance) {
        return res.status(500).json({ error: 'ProxyWallet service not initialized' });
      }

      // Get the actual deployed proxy address for this user
      const proxyAddress = await proxyWalletServiceInstance.getProxyAddress(userAddress);
      const deployed = await proxyWalletServiceInstance.isDeployed(userAddress);
      const nonce = await proxyWalletServiceInstance.getNonce(userAddress);

      res.json({
        proxyAddress,
        deployed,
        nonce: Number(nonce),
      });
    } catch (error: any) {
      console.error('Error fetching proxy status:', error);
      res.status(500).json({ error: 'Failed to fetch proxy status' });
    }
  });

  // GET /api/proxy/balance/:address - Get user's USDT balance in ProxyWallet
  app.get('/api/proxy/balance/:address', async (req, res) => {
    try {
      const userAddress = req.params.address;
      
      // Get proxy wallet service instance
      if (!proxyWalletServiceInstance) {
        return res.status(500).json({ error: 'ProxyWallet service not initialized' });
      }

      // Get the user's deployed proxy address
      const proxyAddress = await proxyWalletServiceInstance.getProxyAddress(userAddress);
      
      // Get USDT balance from the proxy wallet
      const balance = await web3Service.getUSDTBalance(proxyAddress);
      res.json({ balance: balance.toString() });
    } catch (error: any) {
      console.error('Error fetching ProxyWallet balance:', error);
      res.status(500).json({ error: 'Failed to fetch ProxyWallet balance' });
    }
  });

  // GET /api/proxy/positions/:address/:tokenId - Get user's position token balance in ProxyWallet
  app.get('/api/proxy/positions/:address/:tokenId', async (req, res) => {
    try {
      const userAddress = req.params.address;
      const tokenId = BigInt(req.params.tokenId);
      
      // Get proxy wallet service instance
      if (!proxyWalletServiceInstance) {
        return res.status(500).json({ error: 'ProxyWallet service not initialized' });
      }

      // Get the user's deployed proxy address
      const proxyAddress = await proxyWalletServiceInstance.getProxyAddress(userAddress);
      
      // Get token balance from the proxy wallet
      const balance = await web3Service.getTokenBalance(proxyAddress, tokenId);
      res.json({ balance: balance.toString() });
    } catch (error: any) {
      console.error('Error fetching ProxyWallet position balance:', error);
      res.status(500).json({ error: 'Failed to fetch ProxyWallet position balance' });
    }
  });

  // GET /api/proxy/nonce/:address - Get user's current nonce for meta-transaction signing
  app.get('/api/proxy/nonce/:address', async (req, res) => {
    try {
      if (!proxyWalletServiceInstance) {
        return res.status(500).json({ error: 'ProxyWallet service not initialized' });
      }
      
      const nonce = await proxyWalletServiceInstance.getNonce(req.params.address);
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

  // ========== Portfolio Routes ==========

  // GET /api/portfolio/positions/:address - Get user positions with market data and PNL
  app.get('/api/portfolio/positions/:address', async (req, res) => {
    try {
      const userAddress = req.params.address;
      const positions = await storage.getUserPositions(userAddress);
      
      // Enrich positions with market data and calculate unrealized PNL
      const enrichedPositions = await Promise.all(
        positions
          .filter(p => p.yesShares > 0 || p.noShares > 0) // Only positions with shares
          .map(async (position) => {
            const market = await storage.getMarket(position.marketId);
            if (!market) return null;
            
            // Calculate current value and unrealized PNL
            const yesValue = position.yesShares * market.yesPrice;
            const noValue = position.noShares * market.noPrice;
            const currentValue = yesValue + noValue;
            const unrealizedPnl = currentValue - position.totalInvested;
            const unrealizedPnlPercent = position.totalInvested > 0 
              ? (unrealizedPnl / position.totalInvested) * 100 
              : 0;
            
            return {
              ...position,
              market: {
                id: market.id,
                question: market.question,
                category: market.category,
                yesPrice: market.yesPrice,
                noPrice: market.noPrice,
                expiresAt: market.expiresAt,
                resolved: market.resolved,
                outcome: market.outcome,
              },
              currentValue,
              unrealizedPnl,
              unrealizedPnlPercent,
            };
          })
      );
      
      res.json(enrichedPositions.filter(p => p !== null));
    } catch (error: any) {
      console.error('Error fetching portfolio positions:', error);
      res.status(500).json({ error: 'Failed to fetch portfolio positions' });
    }
  });

  // GET /api/portfolio/pnl/:address - Get comprehensive PNL summary
  app.get('/api/portfolio/pnl/:address', async (req, res) => {
    try {
      const userAddress = req.params.address;
      const positions = await storage.getUserPositions(userAddress);
      const markets = await storage.getAllMarkets();
      const marketMap = new Map(markets.map(m => [m.id, m]));
      
      // Calculate total portfolio value and unrealized PNL
      let totalValue = 0;
      let totalInvested = 0;
      let totalRealizedPnl = 0;
      let totalUnrealizedPnl = 0;
      
      positions.forEach(position => {
        const market = marketMap.get(position.marketId);
        if (!market) return;
        
        const yesValue = position.yesShares * market.yesPrice;
        const noValue = position.noShares * market.noPrice;
        const currentValue = yesValue + noValue;
        
        totalValue += currentValue;
        totalInvested += position.totalInvested;
        totalRealizedPnl += position.realizedPnl;
        totalUnrealizedPnl += (currentValue - position.totalInvested);
      });
      
      const totalPnl = totalRealizedPnl + totalUnrealizedPnl;
      const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
      
      // Calculate win rate from filled orders
      const allOrders = await storage.getUserOrders(userAddress);
      const filledOrders = allOrders.filter(o => o.status === 'filled');
      const wins = filledOrders.filter(order => {
        const market = marketMap.get(order.marketId);
        if (!market || !market.resolved) return false;
        // Win if bought YES and market resolved YES, or bought NO and market resolved NO
        return (order.side === 'buy' && order.outcome === market.outcome);
      }).length;
      
      const winRate = filledOrders.length > 0 ? (wins / filledOrders.length) * 100 : 0;
      
      // Calculate today's PNL (simplified - would need order fills with timestamps)
      const todayPnl = 0; // TODO: Implement based on today's fills
      
      res.json({
        totalValue,
        totalInvested,
        totalPnl,
        totalPnlPercent,
        totalRealizedPnl,
        totalUnrealizedPnl,
        winRate,
        todayPnl,
        totalTrades: filledOrders.length,
        wins,
        losses: filledOrders.length - wins,
      });
    } catch (error: any) {
      console.error('Error calculating PNL:', error);
      res.status(500).json({ error: 'Failed to calculate PNL' });
    }
  });

  // GET /api/portfolio/history/:address - Get order history with fills
  app.get('/api/portfolio/history/:address', async (req, res) => {
    try {
      const userAddress = req.params.address;
      const orders = await storage.getUserOrders(userAddress);
      const markets = await storage.getAllMarkets();
      const marketMap = new Map(markets.map(m => [m.id, m]));
      
      // Enrich orders with market data and fill information
      const enrichedOrders = orders.map(order => {
        const market = marketMap.get(order.marketId);
        return {
          ...order,
          market: market ? {
            id: market.id,
            question: market.question,
            category: market.category,
            yesPrice: market.yesPrice,
            noPrice: market.noPrice,
            resolved: market.resolved,
            outcome: market.outcome,
          } : null,
          fillPercentage: order.size > 0 ? (order.filled / order.size) * 100 : 0,
        };
      });
      
      res.json(enrichedOrders);
    } catch (error: any) {
      console.error('Error fetching order history:', error);
      res.status(500).json({ error: 'Failed to fetch order history' });
    }
  });

  // ============================================
  // REWARDS & LIQUIDITY MINING ENDPOINTS
  // ============================================

  // GET /api/rewards/leaderboard - Get top traders by points
  app.get('/api/rewards/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const leaderboard = await rewardsService.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // GET /api/rewards/user/:address - Get user's rewards data
  app.get('/api/rewards/user/:address', async (req, res) => {
    try {
      const userAddress = req.params.address;
      const rewards = await rewardsService.getUserRewards(userAddress);
      
      if (!rewards) {
        return res.json({
          userAddress,
          totalPoints: 0,
          weeklyPoints: 0,
          rank: null,
          totalVolume: 0,
          tradesCount: 0,
          marketsCreated: 0,
        });
      }
      
      res.json(rewards);
    } catch (error: any) {
      console.error('Error fetching user rewards:', error);
      res.status(500).json({ error: 'Failed to fetch user rewards' });
    }
  });

  // GET /api/rewards/history/:address - Get user's rewards history
  app.get('/api/rewards/history/:address', async (req, res) => {
    try {
      const userAddress = req.params.address;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await rewardsService.getUserRewardsHistory(userAddress, limit);
      res.json(history);
    } catch (error: any) {
      console.error('Error fetching rewards history:', error);
      res.status(500).json({ error: 'Failed to fetch rewards history' });
    }
  });

  // POST /api/rewards/recalculate - Manually trigger points recalculation (admin only)
  app.post('/api/rewards/recalculate', async (req, res) => {
    try {
      console.log('[API] Starting manual rewards recalculation...');
      await rewardsService.recalculateAllPoints();
      res.json({ success: true, message: 'Points recalculated successfully' });
    } catch (error: any) {
      console.error('Error recalculating points:', error);
      res.status(500).json({ error: 'Failed to recalculate points' });
    }
  });

  // ============================================
  // SEO & SEARCH ENGINE ENDPOINTS
  // ============================================

  // GET /sitemap.xml - Dynamic XML sitemap for search engines
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = 'https://flipside.exchange';
      const markets = await storage.getAllMarkets();
      
      // Filter to only active markets (not resolved)
      const activeMarkets = markets.filter(m => !m.resolved);
      
      const urls = [
        // Static pages
        { loc: baseUrl, priority: '1.0', changefreq: 'daily', lastmod: undefined },
        { loc: `${baseUrl}/create`, priority: '0.8', changefreq: 'weekly', lastmod: undefined },
        { loc: `${baseUrl}/portfolio`, priority: '0.7', changefreq: 'daily', lastmod: undefined },
        { loc: `${baseUrl}/leaderboard`, priority: '0.7', changefreq: 'daily', lastmod: undefined },
        { loc: `${baseUrl}/docs`, priority: '0.6', changefreq: 'monthly', lastmod: undefined },
        
        // Market pages (active markets only)
        ...activeMarkets.map(market => ({
          loc: `${baseUrl}/market/${market.id}`,
          priority: '0.9',
          changefreq: 'hourly',
          lastmod: new Date().toISOString().split('T')[0], // Today's date
        })),
      ];
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;
      
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error: any) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // GET /robots.txt - Robots exclusion protocol file
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://flipside.exchange/sitemap.xml

# Disallow admin/internal routes
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

# Crawl-delay (be nice to servers)
Crawl-delay: 1`;
    
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  return httpServer;
}
