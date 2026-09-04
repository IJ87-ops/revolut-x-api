# revolut-x-trader

AI-powered automated trading engine for Revolut X. Uses ChatGPT to analyze crypto markets, identify profitable opportunities, and execute trades with strict risk controls.

**Status: Paper Trading Mode (Simulation) - No Real Money at Risk**

---

## Features

✅ **AI Market Analysis** — ChatGPT analyzes technical indicators and identifies trading opportunities  
✅ **Risk Management** — Strict position sizing, daily loss limits, stop-loss/take-profit  
✅ **Paper Trading** — Test strategies without risking real money  
✅ **Live Trading** — Real order execution through Revolut X API (when enabled)  
✅ **Trade Recording** — Complete history in SQLite database  
✅ **Technical Analysis** — RSI, MACD, Bollinger Bands, ATR, 24h volume  
✅ **Multi-Market Scanning** — Analyzes top USD trading pairs continuously  
✅ **Position Monitoring** — Tracks open trades and adjusts exits based on market conditions  
✅ **Credential Security** — All secrets loaded from environment variables, never logged  

---

## Architecture

```
Orchestrator (Main Loop)
    ├─ Fetch Market Data (Revolut X API)
    ├─ Calculate Technical Indicators
    ├─ AI Brain (ChatGPT)
    │   ├─ Identify Opportunities
    │   ├─ Assess Risk/Reward
    │   └─ Evaluate Exit Conditions
    ├─ Trading Engine
    │   ├─ Execute Orders (Paper or Live)
    │   ├─ Manage Positions
    │   └─ Track P&L
    └─ Trade Recorder (SQLite)
        └─ Log Decisions & Results
```

---

## Installation

1. **Build from source:**

```bash
cd trader
npm install
npm run build
```

2. **Set up credentials (environment variables):**

```bash
export REVOLUT_API_KEY="your-revolut-api-key"
export REVOLUT_PRIVATE_KEY_PATH="~/.config/revolut-x/private.pem"
export OPENAI_API_KEY="your-openai-api-key"
```

3. **Verify setup:**

```bash
npx revx-trader status
```

---

## Quick Start (Paper Trading)

Paper trading simulates orders without risking real money. Perfect for testing.

```bash
# Set environment variables (see above)

# Start paper trading (default)
npx revx-trader start
```

**Output:**
```
🚀 Starting trading orchestrator...
📊 Mode: PAPER (Simulation)
📋 Initializing...
✅ Found 10 active trading pairs
💰 Portfolio value: $5000.00

🤖 Analyzing markets with AI...
📊 Found 1 opportunity(ies)

📈 Evaluating BTC-USD BUY
   AI Confidence: 75%
   R:R: 1.8:1
   Win Prob: 62%
   Position Size: 0.05
   Risk Amount: $150
   Account Risk: 3.00%
   ✅ Clear risk/reward, good technicals, meets all criteria

📄 [PAPER] BUY 0.05 BTC-USD @ 95000
   Risk: $150 | Reward: $270
   R:R: 1.8:1
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REVOLUT_API_KEY` | — | **Required** Revolut X API key |
| `REVOLUT_PRIVATE_KEY_PATH` | — | **Required** Path to Ed25519 private key |
| `OPENAI_API_KEY` | — | **Required** OpenAI/ChatGPT API key |
| `REVX_TRADER_MODE` | `paper` | `paper` (simulation) or `live` (real orders) |
| `REVX_MAX_POSITION_SIZE` | `5` | Max % of portfolio per trade |
| `REVX_MAX_DAILY_LOSS` | `500` | Max daily loss in USD |
| `REVX_MIN_RR` | `1.5` | Minimum risk/reward ratio to accept trade |
| `REVX_MIN_WIN_PROB` | `0.55` | Minimum win probability (0-1) |
| `REVX_POLL_INTERVAL_MS` | `60000` | Loop interval (ms) |
| `REVX_DB_PATH` | `./trader-history.db` | Trade history database path |

### Example Configuration

```bash
# Conservative trading
export REVX_MAX_POSITION_SIZE="2"           # Risk 2% per trade
export REVX_MAX_DAILY_LOSS="200"            # Stop after $200 loss
export REVX_MIN_RR="2"                      # Only 2:1 or better
export REVX_MIN_WIN_PROB="0.6"              # 60% confidence minimum

# Fast analysis loop
export REVX_POLL_INTERVAL_MS="30000"        # Check every 30 seconds
```

---

## Trading Logic

### Opportunity Identification

1. **Fetch market data** for top 10 USD pairs (BTC-USD, ETH-USD, etc.)
2. **Calculate technical indicators** (RSI, MACD, Bollinger Bands, ATR)
3. **Ask ChatGPT** to identify CLEAR, STRONG opportunities
4. **Filter opportunities** where:
   - Risk/reward ratio ≥ 1.5:1
   - AI confidence ≥ 60%
   - Technical setup is unambiguous

### Risk Assessment

For each opportunity:
1. **Calculate position size** based on risk per trade
2. **Estimate win probability** from technical setup
3. **Verify it meets criteria:**
   - Account risk ≤ `REVX_MAX_POSITION_SIZE`%
   - Risk/reward ≥ `REVX_MIN_RR`:1
   - Win probability ≥ `REVX_MIN_WIN_PROB`
   - Daily loss + new risk ≤ `REVX_MAX_DAILY_LOSS`
4. **Accept or reject** based on risk/reward

### Execution (Paper vs Live)

**Paper Mode:**
- Simulates order execution
- Logs trade to database
- Tracks P&L
- No real orders placed

**Live Mode:**
- Places real limit orders through Revolut X API
- Uses Ed25519 signing for authentication
- Tracks actual fills and P&L
- ⚠️ REAL MONEY AT RISK

### Position Monitoring

Continuously monitors open positions:
1. **Check exit conditions** (technical breakdown, take-profit reached, etc.)
2. **Ask ChatGPT** whether to hold, tighten stops, or exit
3. **Update stop-loss/take-profit** based on market conditions
4. **Close position** when exit signal confirmed

---

## Trade Recording & Analysis

All trades are recorded to SQLite database: `trader-history.db`

### View Trade History

```typescript
import { TradeRecorder } from "@revolut/revolut-x-trader";

const recorder = new TradeRecorder("./trader-history.db");

// Get last 50 trades
const trades = recorder.getTrades(50);

// Get performance stats (last 30 days)
const stats = recorder.getStats(30);
console.log(`Win Rate: ${(stats.winRate * 100).toFixed(0)}%`);
console.log(`Avg R:R: ${stats.avgRR.toFixed(2)}:1`);
console.log(`Total P&L: $${stats.totalPnL}`);
```

---

## Security

🔒 **Credential Protection:**
- All API keys and private keys loaded from **environment variables only**
- NEVER logged, committed, or printed
- Private key permissions checked (must be 0o600)
- Configuration validates secrets exist before starting

🔒 **Order Safety:**
- Paper mode by default (no real orders)
- Each trade has unique client order ID (prevents duplicates)
- Daily loss limit prevents catastrophic losses
- Position size checked before every trade

🔒 **AI Integration:**
- Only market data and technical indicators sent to ChatGPT
- NO credentials, API keys, or private data exposed
- AI responses parsed for safety (JSON only)

---

## Enabling Live Trading

⚠️ **WARNING: LIVE TRADING PLACES REAL ORDERS WITH REAL MONEY**

Only enable live trading after:
1. ✅ Testing thoroughly in paper mode
2. ✅ Understanding all risks
3. ✅ Verifying configuration with small amounts
4. ✅ Backing up database regularly

**To enable live trading:**

```bash
export REVX_TRADER_MODE="live"
npx revx-trader start
```

The system will confirm:
```
🚀 Starting trading orchestrator...
📊 Mode: 🔴 LIVE (Real Money)
⚠️  LIVE TRADING MODE ENABLED - Real money at risk!
```

---

## Troubleshooting

### "Missing required environment variable"

```
Error: Missing required environment variable: OPENAI_API_KEY
```

**Fix:** Set all required variables:
```bash
export OPENAI_API_KEY="your-key"
export REVOLUT_API_KEY="your-key"
export REVOLUT_PRIVATE_KEY_PATH="~/.config/revolut-x/private.pem"
```

### "Not authenticated with Revolut X"

Make sure your private key file exists and is readable:
```bash
ls -la ~/.config/revolut-x/private.pem
chmod 600 ~/.config/revolut-x/private.pem
```

### "Failed to parse AI opportunities response"

The AI returned invalid JSON. This is rare but can happen. The system will skip that cycle and retry next loop.

### "No market data available"

Revolut X API may be temporarily unavailable or rate limited. The system retries automatically.

---

## Performance Tuning

### For Active Trading (More Opportunities)

```bash
export REVX_POLL_INTERVAL_MS="30000"        # Check every 30s
export REVX_MIN_RR="1.5"                    # More flexibility on R:R
export REVX_MIN_WIN_PROB="0.52"             # Slightly lower bar
export REVX_MAX_POSITION_SIZE="5"           # More capital per trade
```

### For Conservative Trading (Fewer, Higher-Quality Trades)

```bash
export REVX_POLL_INTERVAL_MS="120000"       # Check every 2 mins
export REVX_MIN_RR="2.0"                    # Only excellent R:R
export REVX_MIN_WIN_PROB="0.65"             # High confidence only
export REVX_MAX_POSITION_SIZE="2"           # Smaller positions
```

---

## Database Schema

The SQLite database tracks all trades:

```sql
trades (
  id: UUID (primary key)
  timestamp: number
  symbol: string (e.g., "BTC-USD")
  side: "buy" | "sell"
  entryPrice: string
  exitPrice: string | null
  quantity: string
  riskRewardRatio: number
  expectedWinProbability: number (0-1)
  pnl: string | null (profit/loss in USD)
  pnlPercent: number | null
  aiReasoning: string (why the trade was taken)
  status: "open" | "closed" | "cancelled"
  createdAt: timestamp
  closedAt: timestamp | null
  updatedAt: timestamp
)
```

---

## Next Steps

1. **Test in Paper Mode** — Run for 1-2 days, verify P&L tracking
2. **Review Trade History** — Check if AI decisions are sound
3. **Tune Parameters** — Adjust risk settings to match your goals
4. **Small Live Test** — Enable live with very small position sizes
5. **Monitor & Improve** — Let it run, analyze results, iterate

---

## Support

- **Issues:** [GitHub Issues](https://github.com/IJ87-ops/revolut-x-api/issues)
- **Revolut X API Docs:** [developer.revolut.com/docs/x-api](https://developer.revolut.com/docs/x-api/revolut-x-crypto-exchange-rest-api)
- **OpenAI API Docs:** [platform.openai.com/docs](https://platform.openai.com/docs)

---

## License

MIT — Same as the parent revolut-x-api project
