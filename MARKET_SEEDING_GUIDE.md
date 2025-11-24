# Automated Market Seeding Guide

## Overview

This automated seeding system allows you to easily migrate new prediction markets from development to production with a single click, eliminating manual SQL execution.

## How It Works

### Components

1. **Seed Data File**: `server/seeds/markets.ts`
   - Contains all market data ready for production
   - Currently includes 12 markets (6 crypto + 6 stocks)
   - Easy to update with more markets

2. **Admin API Endpoint**: `POST /api/admin/seed-markets`
   - Protected by wallet-based authentication
   - Automatically skips duplicates
   - Returns detailed results

3. **Admin UI**: `/admin/seed`
   - Simple one-button interface
   - Shows connection status
   - Displays seeding results

## Setup Instructions

### Step 1: Configure Admin Wallet

Set your admin wallet address in the production environment:

1. Go to Replit Secrets/Environment Variables
2. Add a new variable:
   - **Key**: `ADMIN_WALLET_ADDRESSES`
   - **Value**: Your wallet address (e.g., `0xYourWalletAddress`)
   - For multiple admins: `0xWallet1,0xWallet2,0xWallet3`

**Important**: Use lowercase addresses for consistency.

### Step 2: Publish Your App

After configuring the admin wallet:
1. Click "Publish" in Replit
2. Wait for deployment to complete
3. Your code changes will be live on production

### Step 3: Seed Markets to Production

1. Navigate to your production domain: `https://your-domain.replit.app/admin/seed`
2. Connect your admin wallet using the "Connect Wallet" button in the top nav
3. Verify your wallet address matches the configured admin address
4. Click "Seed Markets to Production" button
5. Wait for confirmation message

### Step 4: Verify Success

1. Go to your homepage: `https://your-domain.replit.app`
2. Filter by "Crypto" and "Stocks" categories
3. You should see all 12 new markets displayed

## Current Seed Markets

### Crypto Markets (6)
1. Will ETH hit $5,000 by end of Q1 2025?
2. Will Bitcoin reach new ATH above $110k in 2025?
3. Will Solana flip BNB by market cap in 2025?
4. Will Ethereum Spot ETF approval happen by March 2025?
5. Will DOGE reach $1 in 2025?
6. Will XRP win SEC lawsuit by June 2025?

### Stock Markets (6)
1. Will NVIDIA stock hit $200 by Q2 2025?
2. Will Tesla deliver 2M vehicles in 2025?
3. Will Apple reach $4 trillion market cap in 2025?
4. Will Microsoft stock outperform Google in 2025?
5. Will Amazon stock hit $250 by end of Q1 2025?
6. Will Meta Reality Labs turn profitable in 2025?

## Adding New Markets

### Method 1: Update Seed File (Recommended)

1. Edit `server/seeds/markets.ts`
2. Add new market objects to the `seedMarkets` array:

```typescript
{
  question: 'Your market question?',
  description: 'Detailed resolution criteria...',
  category: 'Crypto', // or 'Stocks', 'Sports', etc.
  expiresAt: new Date('2025-12-31T23:59:00Z'),
  yesPrice: 0.50,
  noPrice: 0.50,
  volume: 0,
  liquidity: 0,
  creatorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  marketType: 'CLOB' as const,
  imageUrl: 'https://example.com/image.png'
}
```

3. Publish the updated code
4. Use the admin seeding UI to deploy to production

### Method 2: Database Pane (Manual)

If you prefer the traditional approach:
1. Go to Database pane → Production Database
2. Click "My data" → Toggle "Edit"
3. Run INSERT SQL manually

## Features

### Duplicate Prevention
- Markets with identical questions are automatically skipped
- Safe to run multiple times
- Shows count of inserted vs. skipped markets

### Security
- Wallet-based authentication
- Only configured admin wallets can seed
- No API keys needed (uses Web3 wallet signing)

### Error Handling
- Detailed error messages for each failed market
- Partial success supported (some markets succeed even if others fail)
- Transaction safety (each market inserted independently)

## Troubleshooting

### "Unauthorized" Error
- Verify your wallet address is in `ADMIN_WALLET_ADDRESSES`
- Make sure address is lowercase in environment variable
- Check that you're connected with the correct wallet

### Markets Not Appearing
- Check seeding result message
- Verify markets weren't skipped (already exist)
- Refresh homepage and clear browser cache
- Check category filter is set correctly

### "Wallet Not Connected"
- Click "Connect Wallet" in top navigation
- Approve wallet connection in your Web3 wallet
- Refresh the admin seed page

## Technical Details

### API Response Format

Success response:
```json
{
  "success": true,
  "message": "Seeding complete: 12 inserted, 0 skipped",
  "results": {
    "inserted": 12,
    "skipped": 0,
    "errors": []
  }
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Database Schema

Markets are stored with:
- **Real volume/liquidity**: Always starts at 0
- **Real statistics**: Calculated from actual trades
- **No mock data**: Only authentic trading activity counts

## Benefits

✅ **One-Click Migration**: No manual SQL required
✅ **Safe**: Automatic duplicate prevention
✅ **Secure**: Wallet-based authorization
✅ **Transparent**: Detailed results and error messages
✅ **Repeatable**: Can be run multiple times safely
✅ **Extendable**: Easy to add more markets to seed file

## Future Enhancements

Consider adding:
- Bulk market import via CSV/JSON upload
- Market preview before seeding
- Automated scheduling (seed on deploy)
- Multi-environment support (staging, production)
- Market template library

---

**Need Help?** Check the admin UI at `/admin/seed` for step-by-step instructions.
