# 🤖 Enhanced AI Trading System - Complete Documentation

## Overview

This is a **rigorous, analysis-first AI-powered trading engine** for Revolut X cryptocurrency exchange. Every trade is:

✅ **Pre-analyzed** before execution  
✅ **Validated** against strict risk criteria  
✅ **Monitored** continuously during holding  
✅ **Reported** with complete transaction details  

**Core Philosophy:** Protect capital → Minimize losses → Identify opportunities → Maximize profits

---

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADING ORCHESTRATOR                         │
│  (Main loop: Fetch → Analyze → Execute → Monitor → Report)      │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ├─→ MARKET DATA FETCHER
       │   Retrieves real-time price data from Revolut X API
       │
       ├─→ TECHNICAL ANALYZER
       │   • RSI (Relative Strength Index)
       │   • MACD (Momentum & Trend)
       │   • Bollinger Bands (Support/Resistance)
       │   • ATR (Volatility)
       │   • Volume Analysis
       │
       ├─→ ENHANCED TRADE ANALYZER
       │   10-Step Pre-Trade Analysis
       │
       ├─→ ENHANCED TRADE EXECUTOR
       │   Validation + Execution + Monitoring
       │
       └─→ TRADE RECORDER (SQLite)
           Complete transaction history
```

---

## 📊 10-Step Pre-Trade Analysis

1. **Price Action** - Where is price in spread?
2. **Trend** - Up or down?
3. **Momentum** - RSI & MACD signals
4. **Volume** - Conviction confirmation
5. **Volatility** - ATR measurement
6. **Support/Resistance** - Entry/exit levels
7. **Entry Levels** - Specific prices
8. **Risk/Reward** - Ratio calculation (min 1.2:1)
9. **Win Probability** - Likelihood estimate
10. **Net Profit** - After all fees (min 0.1%)

---

## ✅ Trade Acceptance Criteria

| Criteria | Minimum | Preferred |
|----------|---------|-----------|
| Recommendation | STRONG_BUY or BUY | STRONG_BUY |
| Risk/Reward Ratio | 1.2:1 | 1.5:1+ |
| Win Probability | 50% | 55%+ |
| Net Profit (after fees) | 0.1% | 0.3%+ |

**If ANY criterion fails → Trade is REJECTED**

---

## 💹 Transaction Recording

Every trade records:
- Symbol & side (BUY/SELL)
- Entry/exit price & timestamp
- Entry/exit fees (0.06% each)
- Quantity traded
- Gross & net P&L
- P&L percentage
- AI reasoning
- Trade status (OPEN/CLOSED)
- Mode (PAPER/LIVE)

---

## 🔧 Configuration

```bash
# API Credentials
REVOLUT_API_KEY=your-key
REVOLUT_PRIVATE_KEY_PATH=~/.config/revolut-x/private.pem
OPENAI_API_KEY=sk-your-key

# Trading Mode
REVX_TRADER_MODE=paper  # or live

# Position Sizing
REVX_MAX_POSITION_SIZE=5    # % per trade
REVX_MAX_DAILY_LOSS=500     # £ limit

# Risk Criteria
REVX_MIN_RR=1.5             # Risk/reward
REVX_MIN_WIN_PROB=0.55      # Win probability

# System
REVX_POLL_INTERVAL_MS=60000 # 60 seconds
REVX_DB_PATH=./trader-history.db
```

---

## 🚀 Quick Start

```bash
# 1. Install
cd trader
npm install
npm run build

# 2. Set environment variables
export REVOLUT_API_KEY="your-key"
export REVOLUT_PRIVATE_KEY_PATH="~/.config/revolut-x/private.pem"
export OPENAI_API_KEY="sk-your-key"
export REVX_TRADER_MODE="paper"

# 3. Start
npx revx-trader start
```

---

## 📈 Real-Time Notifications

```
✅ POSITION OPENED - BTC-USD
   Entry Price: £95,000
   Stop Loss: £93,000
   Take Profit: £100,000
   Risk/Reward: 1.67:1
   AI Confidence: 75%

💰 POSITION CLOSED - ETH-USD
   Entry: £2,000 → Exit: £2,100
   P&L: £95.50 (+4.77%)
   Duration: 2h 15m
   Running Total: £245.80

❌ TRADE REJECTED - SOL-USD
   Reason: Risk/reward too low: 1.1:1 < 1.2:1
```

---

## 🛡️ Risk Management

1. **Position Sizing** - Never exceeds max % of account
2. **Daily Loss Limits** - Halts trading after max loss
3. **Stop-Loss Enforcement** - Every position protected
4. **Take-Profit Targets** - Winners closed at target
5. **No Overtrading** - 1 position per symbol max
6. **Fee Accounting** - All calculations include 0.06% fees

---

## 🔐 Security

✅ API keys NOT in code  
✅ Private keys NOT in logs  
✅ Credentials NOT committed to git  
✅ `.gitignore` blocks sensitive files  
✅ ONLY environment variables used  

---

## 📊 Monitor Trades

```bash
# View all trades
sqlite3 trader-history.db "SELECT * FROM trades LIMIT 20;"

# Get P&L summary
sqlite3 trader-history.db "
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
    SUM(pnl) as net_profit
  FROM trades;
"

# Get win rate
sqlite3 trader-history.db "
  SELECT 
    CAST(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100
  FROM trades WHERE status = 'closed';
"
```

---

## ⚠️ Live Trading

**DO NOT enable until:**

1. ✅ Run paper mode 24-48 hours
2. ✅ Review ALL trades
3. ✅ Win rate ≥ 50%
4. ✅ Profit factor ≥ 1.5
5. ✅ Understand the AI reasoning

**Enable:**
```bash
export REVX_TRADER_MODE="live"
```

**WARNING:** Real money. Cannot be undone.

---

## 📁 File Structure

```
trader/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README-ENHANCED.md          ← You are here
├── trader-history.db
└── src/
    ├── types.ts
    ├── config.ts
    ├── technical-analyzer.ts
    ├── enhanced-trade-analyzer.ts
    ├── enhanced-trade-executor.ts
    ├── enhanced-orchestrator.ts
    ├── trade-recorder.ts
    ├── ai-brain.ts
    └── bin/
        └── trader.ts
```

---

## ✨ Summary

**Production-grade system that:**

✅ **Analyzes before trading** - Every trade pre-approved  
✅ **Protects capital** - Risk limits, stops, daily caps  
✅ **Reports everything** - Complete history & P&L  
✅ **Minimizes emotions** - Rules-based decisions  
✅ **Learns from data** - SQLite for analysis  
✅ **Stays secure** - No credentials exposed  

**Start with paper trading. Monitor 24-48 hours. Go live when ready.**

🚀 Good luck!
