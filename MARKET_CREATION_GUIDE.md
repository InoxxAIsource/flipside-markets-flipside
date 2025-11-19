# Market Creation Guide for Flipside

## Quick Start Examples

I've created **20+ ready-to-use market examples** in `market-creation-examples.json` covering:
- 🪙 **Crypto** (Bitcoin $100k, Ethereum $5k, Solana vs ETH, BTC ETF)
- 🏛️ **Politics** (US inflation, Federal Reserve rates)
- ⚽ **Sports** (NBA records, Messi MLS goals)
- 💻 **Tech** (Apple foldable iPhone, GPT-5, Tesla stock)
- 🔬 **Science** (Moon landing, fusion energy)
- 🎬 **Entertainment** (Box office records, music releases)

## How to Create Markets

### CLOB (Order Book) Markets
Traditional limit order book with gasless trading:

```javascript
{
  "marketType": "CLOB",
  "question": "Will Bitcoin reach $100,000 by Dec 31, 2025?",
  "description": "Resolves YES if BTC/USD hits $100k on major exchanges...",
  "category": "Crypto",
  "expiresAt": "2025-12-31"
  // No initial liquidity needed
}
```

### LP Pool (AMM) Markets
Automated market maker with constant-sum pricing:

```javascript
{
  "marketType": "POOL",
  "question": "Will Ethereum reach $5,000 before June 1, 2025?",
  "description": "Resolves YES if ETH/USD hits $5,000...",
  "category": "Crypto",
  "expiresAt": "2025-06-01",
  "initialYesLiquidity": "10",  // USDT for YES tokens
  "initialNoLiquidity": "10"    // USDT for NO tokens
}
```

## Market Creation Best Practices

### ✅ Good Questions
- **Specific & Measurable:** "Will Bitcoin reach $100,000?" ✓
- **Clear Deadline:** "...before December 31, 2025" ✓
- **Objective Resolution:** "Price on Coinbase" ✓

### ❌ Avoid
- **Vague Questions:** "Will crypto do well?" ✗
- **Subjective Criteria:** "Will people like the new iPhone?" ✗
- **No Clear End Date:** "Will Bitcoin moon?" ✗

## Resolution Criteria Guidelines

Always include in your description:
1. **Exact threshold:** "$100,000" not "around $100k"
2. **Data source:** "Coinbase, Binance, or Kraken"
3. **Time requirements:** "sustained for 60 seconds"
4. **Edge cases:** "Futures ETFs don't count - must be spot ETF"

### Example Resolution Criteria

```markdown
This market resolves YES if Bitcoin (BTC/USD) reaches or exceeds 
$100,000 on any major exchange (Binance, Coinbase, Kraken) before 
December 31, 2025, 23:59:59 UTC. Price must be sustained for at 
least 1 minute on the exchange order book.
```

## Initial Liquidity Strategy (AMM Pools)

### 50/50 Pricing (Neutral)
```json
{
  "initialYesLiquidity": "10",
  "initialNoLiquidity": "10"
}
// Results in 50% YES, 50% NO starting price
```

### Bullish Pricing (60/40)
```json
{
  "initialYesLiquidity": "15",
  "initialNoLiquidity": "10"
}
// Results in 60% YES, 40% NO starting price
```

### Bearish Pricing (40/60)
```json
{
  "initialYesLiquidity": "10",
  "initialNoLiquidity": "15"
}
// Results in 40% YES, 60% NO starting price
```

**Formula:** YES price = YES liquidity ÷ (YES liquidity + NO liquidity)

## Category Selection

- **Crypto:** Bitcoin, Ethereum, DeFi, NFTs, blockchain tech
- **Politics:** Elections, policy, economic indicators, regulations
- **Sports:** Team records, player stats, championship outcomes
- **Tech:** Product launches, stock prices, company performance
- **Science:** Research breakthroughs, space missions, discoveries
- **Entertainment:** Box office, music releases, award shows

## Testing the LP Pool Fix

To verify the November 19 bug fix works:

1. **Navigate to** `/create`
2. **Select** "LP Pool (AMM)" market type
3. **Use this test market:**
   - Question: "Will Bitcoin reach $100k by Dec 31, 2025?"
   - Description: (copy from examples file)
   - Category: Crypto
   - Expiration: December 31, 2025
   - YES Liquidity: `10`
   - NO Liquidity: `10`
4. **Submit** and approve transactions
5. **Watch console logs** for 4-step process:
   - ✅ Step 1/4: Approve USDT
   - ✅ Step 2/4: Split position
   - ✅ Step 3/4: Approve pool
   - ✅ Step 4/4: Add liquidity
6. **Success:** Should see "✅ Liquidity addition completed successfully!"

## Market Creation Tips

### Image URLs
Use high-quality logos from:
- **Crypto:** `https://cryptologos.cc/logos/[coin]-logo.png`
- **Sports teams:** Official team websites
- **Tech companies:** Wikipedia or official press kits
- Or upload custom images via the form

### Expiration Dates
- **Short-term:** 1-3 months (higher volume, faster resolution)
- **Medium-term:** 3-6 months (balanced risk/reward)
- **Long-term:** 6-12 months (bigger predictions, patient traders)

### Market Descriptions
Aim for 100-300 characters covering:
1. What triggers YES resolution
2. Official data source
3. Exact deadline (date + timezone)
4. Any exclusions or edge cases

## Example: Complete Market Creation

```json
{
  "marketType": "POOL",
  "question": "Will Ethereum reach $5,000 before June 1, 2025?",
  "description": "Resolves YES if ETH/USD hits $5,000 or higher on Coinbase, Binance, or Kraken before June 1, 2025, 00:00 UTC. The price must be recorded on the public order book for at least 60 consecutive seconds.",
  "category": "Crypto",
  "imageUrl": "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  "expiresAt": "2025-06-01",
  "initialYesLiquidity": "10",
  "initialNoLiquidity": "10"
}
```

This creates a 50/50 market with:
- Clear YES condition ($5,000 ETH)
- Specific data sources (major exchanges)
- Exact deadline (June 1, 2025, 00:00 UTC)
- Duration requirement (60 seconds)
- Equal initial liquidity (10 USDT each side)

---

## Need Help?

- Check `market-creation-examples.json` for 20+ complete examples
- Review existing markets on the platform for inspiration
- Test with small liquidity amounts (10 USDT) first
- Watch console logs to verify 4-step liquidity process completes

Happy market making! 🎯
