# 🚀 Live Trading Setup Guide

## ⚠️ Critical: You Are About to Trade with REAL Money

This guide will walk you through enabling live trading mode. **Read completely before proceeding.**

---

## 🔐 Step 1: Verify Your Credentials

Before anything else, confirm you have:

```bash
# Check API Key
echo $REVOLUT_API_KEY
# Should output: (your actual key, not empty)

# Check Private Key Path
echo $REVOLUT_PRIVATE_KEY_PATH
# Should output: (path to your private key file)

# Verify Private Key Exists
ls -la $REVOLUT_PRIVATE_KEY_PATH
# Should show the file exists and is readable

# Check OpenAI Key
echo $OPENAI_API_KEY
# Should output: sk-... (your actual key)
```

If ANY are missing or empty, **STOP** and set them first:

```bash
export REVOLUT_API_KEY="your-actual-key"
export REVOLUT_PRIVATE_KEY_PATH="/path/to/private.pem"
export OPENAI_API_KEY="sk-your-openai-key"
```

---

## 📊 Step 2: Review Paper Trading Results

Before enabling live mode, verify your paper trading performance:

```bash
# Connect to the trading database
sqlite3 trader-history.db

# Inside sqlite3, run these queries:

-- Total trades and win rate
SELECT 
  COUNT(*) as total_trades,
  SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses,
  ROUND(CAST(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as win_rate
FROM trades 
WHERE status = 'closed';

-- Profit factor (must be >= 1.5)
SELECT 
  ROUND(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) / 
  ABS(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END)), 2) as profit_factor
FROM trades 
WHERE status = 'closed';

-- Total P&L
SELECT 
  ROUND(SUM(pnl), 2) as net_profit,
  COUNT(*) as total_closed
FROM trades 
WHERE status = 'closed';

-- Recent trades (last 10)
SELECT 
  symbol,
  side,
  entryPrice,
  exitPrice,
  ROUND(pnl, 2) as pnl,
  ROUND(pnlPercent, 2) as pnl_pct,
  createdAt
FROM trades 
WHERE status = 'closed'
ORDER BY createdAt DESC 
LIMIT 10;

-- Exit with Ctrl+D or type: .quit
```

**MUST HAVE:**
- ✅ Win Rate ≥ 50%
- ✅ Profit Factor ≥ 1.5
- ✅ Net Profit > 0 (in paper mode)
- ✅ At least 20 closed trades for confidence

**If any criteria fails, DO NOT proceed to live trading.**

---

## 💰 Step 3: Verify Your Capital

```bash
# Check your Revolut X account balance
# Via Revolut app: Settings → Crypto → Available Balance

# Recommended starting amounts:
# Conservative: £100-200 (lowest risk)
# Moderate: £500-1000 (manageable risk)
# Aggressive: £2000+ (only if experienced)

# DO NOT use:
# ❌ Borrowed money
# ❌ Rent/mortgage money
# ❌ Emergency fund money
# ❌ Money you can't afford to lose
```

---

## 🔧 Step 4: Configure Live Trading Parameters

Edit your environment variables for live mode:

```bash
# CRITICAL: Set position size to SMALL
export REVX_MAX_POSITION_SIZE=2    # 2% per trade (not 5%)

# CRITICAL: Set daily loss limit to CONSERVATIVE
export REVX_MAX_DAILY_LOSS=100     # £100 daily loss limit (not 500)

# Keep risk criteria STRICT
export REVX_MIN_RR=1.5             # 1.5:1 minimum risk/reward
export REVX_MIN_WIN_PROB=0.55      # 55% minimum win probability

# Keep polling interval reasonable
export REVX_POLL_INTERVAL_MS=60000 # 60 seconds between cycles
```

---

## 🛡️ Step 5: Set Up Monitoring

Create a monitoring script to watch your trades:

```bash
# Watch trades in real-time
watch -n 5 'sqlite3 trader-history.db "SELECT symbol, side, entryPrice, pnl, status FROM trades ORDER BY createdAt DESC LIMIT 10;"'

# In another terminal, watch the logs
tail -f trader-live-activation.log
tail -f trader-trading.log  # If you have detailed logs
```

---

## 🚀 Step 6: Enable Live Trading

**FINAL SAFETY CHECKS:**

- [ ] ✅ All environment variables set and verified
- [ ] ✅ Private key file exists and is readable
- [ ] ✅ Paper trading results meet or exceed thresholds
- [ ] ✅ Win rate ≥ 50%
- [ ] ✅ Profit factor ≥ 1.5
- [ ] ✅ Net profit in paper mode > 0
- [ ] ✅ Have sufficient capital (not borrowed)
- [ ] ✅ Position size set to SMALL (2%, not 5%)
- [ ] ✅ Daily loss limit set to CONSERVATIVE (£100, not 500)
- [ ] ✅ Monitoring setup ready
- [ ] ✅ Emergency stop script reviewed

**If ANY checkbox is not checked, STOP and fix it.**

---

## 💻 Run the Live Trading Enabler

```bash
# Make the script executable
chmod +x trader/enable-live-trading.sh

# Run it
./trader/enable-live-trading.sh
```

**The script will:**
1. ✅ Verify all environment variables
2. ✅ Check private key exists
3. ✅ Verify trader-history.db exists
4. ✅ Show your paper trading statistics
5. ✅ Ask for final confirmation
6. ✅ Enable LIVE mode
7. ✅ Start the trading system

**At the final prompt, type exactly:**
```
YES, ENABLE LIVE TRADING
```

Anything else will cancel and keep you in paper mode.

---

## 📊 First 24 Hours - What to Expect

### **Minute 1-5: Startup Phase**
```
✅ Connecting to Revolut X API
✅ Loading configuration
✅ Starting enhanced orchestrator
📊 First market data fetch...
```

### **Minutes 5-60: First Trading Cycle**
```
1️⃣  FETCHING MARKET DATA...
   ✅ Fetched 10 trading pairs

2️⃣  CALCULATING TECHNICAL INDICATORS...
   ✅ Calculated for 10 pairs

3️⃣  ANALYZING TRADING OPPORTUNITIES...
   📈 BTC-USD: STRONG_BUY (R:R 1.8:1, 78% confidence)
   📉 ETH-USD: SELL (R:R 1.5:1, 62% confidence)
   ⏸️  SOL-USD: HOLD (waiting for setup)

4️⃣  EXECUTING TRADES...
✅ POSITION OPENED - BTC-USD
   Entry: £95,000 @ 14:32:15
   Stop Loss: £93,000
   Take Profit: £100,500
   Risk/Reward: 1.67:1
   Confidence: 78%
```

### **While Position Open**
```
⏱️  Monitoring position: BTC-USD
   Current Price: £96,200
   Unrealized P&L: +£1,200
   Duration: 18 minutes
```

### **Position Closes (Either Way)**
```
✅ POSITION CLOSED - BTC-USD
   Entry: £95,000
   Exit: £100,500
   P&L: £5,500 (+5.79%)
   Fees: -£114
   Net P&L: £5,386
   Duration: 2h 34m
   Running Total: £5,386
```

OR

```
💔 POSITION CLOSED - BTC-USD
   Entry: £95,000
   Exit: £93,000 (STOP LOSS HIT)
   P&L: -£2,000
   Fees: -£57
   Net P&L: -£2,057
   Duration: 47m
   Running Total: -£2,057
```

---

## 🛑 Emergency Stop

If ANYTHING feels wrong:

```bash
# Immediately stop trading
chmod +x trader/emergency-stop.sh
./trader/emergency-stop.sh
```

This will:
1. ✅ Kill the trading process
2. ✅ Show all open positions
3. ✅ Display recent P&L
4. ✅ Guide you through manual position closure

---

## 📱 During Live Trading

### **Check Every Hour**
```bash
# View latest trades
sqlite3 trader-history.db "SELECT * FROM trades ORDER BY createdAt DESC LIMIT 5;"

# Check account balance (via Revolut app)
# Settings → Crypto → Available Balance
```

### **Check Every 4 Hours**
```bash
# Calculate running P&L
sqlite3 trader-history.db "
  SELECT 
    SUM(pnl) as total_pnl,
    COUNT(*) as total_trades,
    ROUND(CAST(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100) as win_rate
  FROM trades
  WHERE status = 'closed' AND createdAt > datetime('now', '-4 hours');
"

# Check for any errors in logs
grep "ERROR" trader-live-activation.log || echo "No errors"
```

### **Check Daily (End of Day)**
```bash
# Get daily summary
sqlite3 trader-history.db "
  SELECT 
    DATE(createdAt) as trade_date,
    COUNT(*) as trades,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
    ROUND(SUM(pnl), 2) as daily_pnl
  FROM trades
  WHERE status = 'closed'
  GROUP BY DATE(createdAt)
  ORDER BY trade_date DESC;
"

# Verify daily loss limit not exceeded
# If daily P&L < -£100, system should stop automatically
```

---

## ⚠️ Red Flags - Stop Immediately If:

🚨 **Win rate drops below 45%**
- Stop trading
- Review recent trades
- Understand what changed

🚨 **Daily loss exceeds £100**
- System halts automatically
- Wait until next day
- Don't override the limit

🚨 **Multiple losses in a row (5+)**
- Market conditions may have changed
- Stop trading
- Wait for clearer signals

🚨 **API errors or connection issues**
- Run emergency-stop.sh
- Check your internet connection
- Verify API keys are still valid
- Wait 15 minutes before restarting

🚨 **AI reasoning seems off**
- Review recent trades
- Check if technical setup still makes sense
- If unsure, stop trading

---

## ✅ Success Metrics (First 7 Days)

**Excellent Results:**
- Win rate 55%+
- Profit factor 2.0+
- Net profit £500+

**Good Results:**
- Win rate 50-55%
- Profit factor 1.5-2.0
- Net profit £200-500

**Acceptable Results:**
- Win rate 50%
- Profit factor 1.5
- Net profit £0-200

**Concerning Results:**
- Win rate < 50%
- Profit factor < 1.5
- Net loss

**If concerning, STOP and return to paper trading.**

---

## 📞 Support & Emergency

### **If Something Goes Wrong:**

1. **Run emergency stop:**
   ```bash
   ./trader/emergency-stop.sh
   ```

2. **Check open positions in Revolut app:**
   - Settings → Crypto → Portfolio
   - Manually close any positions if needed

3. **Review database:**
   ```bash
   sqlite3 trader-history.db "SELECT * FROM trades WHERE status = 'open';"
   ```

4. **Restart safely:**
   - Wait 15 minutes
   - Verify everything is stable
   - Run orchestrator again with fresh environment

### **Report Issues:**
- GitHub: https://github.com/IJ87-ops/revolut-x-api/issues
- Revolut Support: https://help.revolut.com
- Include trade database if reporting bugs

---

## 🎯 You're Ready!

Once live trading is enabled:

✅ **Analyze before trading** - Every trade pre-approved by AI  
✅ **Protect capital** - Risk limits enforced automatically  
✅ **Monitor closely** - First 24 hours especially important  
✅ **Emergency stop ready** - One command away  
✅ **Scale gradually** - Start small, increase as confidence grows  

**Remember:** 
- No rush to be aggressive
- Consistency beats home runs
- Protect capital first, profits second
- Emotions are the enemy

**Good luck! 🚀**

---

## 📋 Quick Reference Commands

```bash
# Start live trading
./trader/enable-live-trading.sh

# Emergency stop
./trader/emergency-stop.sh

# View recent trades
sqlite3 trader-history.db "SELECT * FROM trades ORDER BY createdAt DESC LIMIT 10;"

# Get P&L summary
sqlite3 trader-history.db "SELECT COUNT(*), SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), SUM(pnl) FROM trades WHERE status = 'closed';"

# Check for open positions
sqlite3 trader-history.db "SELECT * FROM trades WHERE status = 'open';"

# View logs
tail -f trader-live-activation.log
```

---

**Now go make some money. Safely.** 💰🚀
