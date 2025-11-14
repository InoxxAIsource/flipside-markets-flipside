import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { eventIndexer } from "./services/eventIndexer";
import { pythWorker } from "./services/pythWorker";
import { relayerService } from "./services/relayerService";
import { web3Service } from "./contracts/web3Service";
import { getSplitMergeService } from "./services/splitMergeService";
import { getProxyWalletService } from "./services/proxyWalletService";
import { CONTRACT_ADDRESSES } from "./config/contracts";

// Global BigInt serializer - converts all BigInt values to strings in JSON
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Initialize service dependencies
    const proxyWalletService = getProxyWalletService(
      web3Service,
      CONTRACT_ADDRESSES.proxyWalletFactory,
      CONTRACT_ADDRESSES.proxyWalletImpl
    );
    const splitMergeService = getSplitMergeService(web3Service);
    
    // Wire up service dependencies
    splitMergeService.setProxyWalletService(proxyWalletService);
    splitMergeService.setRelayerService(relayerService);
    
    // Start background services after server is running
    eventIndexer.start();
    pythWorker.start();
    
    // Relayer service starts automatically on initialization
    const relayerAddress = (relayerService as any).relayerWallet.address;
    log(`Relayer service initialized (address: ${relayerAddress})`);
    log(`✓ CTFExchange is permissionless - anyone can call fillOrder()`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received, stopping services...');
    eventIndexer.stop();
    pythWorker.stop();
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });
})();
