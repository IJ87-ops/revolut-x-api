/**
 * Setup Guide: Comprehensive SETUP.md for the trading system
 */

# SETUP GUIDE: AI-Powered Trading System

## Step 1: Get Your Credentials (5 minutes)

### Revolut X API Key
1. Go to https://exchange.revolut.com/
2. Log in to your account
3. Profile → API Keys
4. Click "Generate New API Key"
5. Copy the API Key (you'll need it below)
6. Note: You should already have an Ed25519 keypair from the main repo setup

### OpenAI API Key
1. Go to https://platform.openai.com/api/keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. **Keep this SECRET** - treat like a password

---

## Step 2: Build the Trader Package (2 minutes)

```bash
cd trader
npm install
npm run build
```

You should see:
```
trader/ compiled successfully
```

---

## Step 3: Set Up Environment Variables (2 minutes)

### On macOS/Linux:

```bash
export REVOLUT_API_KEY="your-revolut-api-key-from-step-1"
export REVOLUT_PRIVATE_KEY_PATH="~/.config/revolut-x/private.pem"
export OPENAI_API_KEY="your-openai-key-from-step-1"
export REVX_TRADER_MODE="paper"
```

### On Windows (PowerShell):

```powershell
$env:REVOLUT_API_KEY="your-revolut-api-key"
$env:REVOLUT_PRIVATE_KEY_PATH="$env:APPDATA\revolut-x\private.pem"
$env:OPENAI_API_KEY="your-openai-key"
$env:REVX_TRADER_MODE="paper"
```

### Verify Setup:

```bash
npx revx-trader status
```

You should see:
```
📊 Trading system status check
   Implementation complete
   Run 'revx-trader start' to begin trading
```

---

## Step 4: Start Paper Trading (0 minutes - just run it!)

```bash
npx revx-trader start
```

You should see:
```
🚀 Starting trading orchestrator...
📊 Mode: PAPER (Simulation)
📋 Initializing...
✅ Found 10 active trading pairs
   BTC-USD, ETH-USD, SOL-USD, ...
💰 Portfolio value: $5000.00

🤖 Analyzing markets with AI...
✅ No trading opportunities identified
```

The system will loop every 60 seconds, analyzing markets and looking for opportunities.

---

## Step 5: Monitor Performance

While the system is running, it logs:
- ✅ Opportunities identified by AI
- ✅ Risk/reward analysis for each trade
- ✅ Trade execution (paper mode = simulated)
- ✅ P&L tracking

All trades are saved to: `./trader-history.db`

---

## Common Issues & Fixes

### Error: "Missing required environment variable: OPENAI_API_KEY"

**Fix:** Set the environment variable:
```bash
export OPENAI_API_KEY="your-actual-openai-key"
```

### Error: "Not authenticated with Revolut X"

**Fix:** Verify your private key exists:
```bash
ls -la ~/.config/revolut-x/private.pem
chmod 600 ~/.config/revolut-x/private.pem
```

### No trades are being placed

This is normal! The AI only trades when:
- ✅ Technical setup is CLEAR
- ✅ Risk/reward is strong (≥1.5:1)
- ✅ Win probability estimate ≥55%
- ✅ No existing position in that symbol

It's better to miss opportunities than to lose money on weak setups.

### "Failed to fetch market data"

Revolut X API might be temporarily down. The system retries automatically on the next cycle.

---

## After 24 Hours of Paper Trading

Check your results:

```bash
sqlite3 trader-history.db
> SELECT COUNT(*), SUM(pnlPercent) FROM trades WHERE status='closed';
```

Or examine the README section on "Trade Recording & Analysis" for more options.

---

## When Ready for Live Trading

⚠️ **CRITICAL: Only enable after you've:**
1. ✅ Run paper mode for at least 1-2 days
2. ✅ Reviewed all trades and understood the decisions
3. ✅ Verified the trade recorder is working
4. ✅ Tested with a SMALL amount first ($100-500)

**To enable live trading:**

```bash
export REVX_TRADER_MODE="live"
npx revx-trader start
```

The system will warn:
```
🚀 Starting trading orchestrator...
📊 Mode: 🔴 LIVE (Real Money)
⚠️  LIVE TRADING MODE ENABLED - Real money at risk!
```

---

## Next Steps

1. **Read the full README** — `trader/README.md`
2. **Start paper trading** — Run step 4 above
3. **Monitor trades** — Let it run for 24-48 hours
4. **Analyze results** — Check win rate, average R:R
5. **Tune parameters** — Adjust risk settings if needed
6. **Go live** (optional) — Only when confident

---

## Need Help?

- Check `trader/README.md` for full documentation
- See `.env.example` for all configuration options
- Review trades in `trader-history.db` to understand decisions
- Check Revolut X API docs: https://developer.revolut.com/docs/x-api/revolut-x-crypto-exchange-rest-api
- Check OpenAI docs: https://platform.openai.com/docs/api-reference

---

## Architecture Summary

```
Your Trading System:
  📊 Markets (Revolut X) 
       ↓
  🧠 AI Brain (ChatGPT)
       ↓
  ⚙️ Trading Engine
       ↓
  💾 Trade Database (SQLite)
       ↓
  📈 Performance Analytics
```

Each cycle:
1. Fetch latest market data from Revolut X
2. Calculate technical indicators (RSI, MACD, Bollinger Bands, ATR)
3. Ask ChatGPT: "What should we trade?"
4. Evaluate risk/reward
5. Execute trade (paper = simulated, live = real)
6. Record to database
7. Wait 60 seconds, repeat

---

**Good luck! And remember: Better to miss an opportunity than lose money on a bad trade. 🚀**
