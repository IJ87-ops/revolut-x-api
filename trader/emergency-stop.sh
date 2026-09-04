#!/usr/bin/env bash

# 🛑 EMERGENCY STOP SCRIPT
# Use this to immediately halt all trading and close all open positions

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║               🛑 EMERGENCY TRADING HALT 🛑                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Kill the trading process
echo "🔴 Stopping trading orchestrator..."
pkill -f "enhanced-orchestrator" || echo "   (Already stopped)"

echo ""
echo "📊 Checking for open positions..."
echo ""

# Query the database for open positions
if [ -f "trader-history.db" ]; then
    echo "Open positions in database:"
    sqlite3 trader-history.db "
    SELECT 
      symbol,
      side,
      entryPrice,
      quantity,
      createdAt
    FROM trades 
    WHERE status = 'open'
    ORDER BY createdAt DESC;
    " 2>/dev/null || echo "   (No open positions)"
    
    echo ""
    echo "📈 Recent trades summary:"
    sqlite3 trader-history.db "
    SELECT 
      COUNT(*) as total_trades,
      SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losses,
      ROUND(SUM(pnl), 2) as total_pnl
    FROM trades 
    WHERE status = 'closed'
    AND createdAt > datetime('now', '-24 hours');
    " 2>/dev/null || echo "   (No trades in last 24h)"
else
    echo "⚠️  No database found"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ Trading system STOPPED"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Check Revolut X app for any open positions"
echo "   2. Manually close any positions if needed"
echo "   3. Review trader-history.db for transaction details"
echo "   4. Wait 5 minutes before restarting"
echo ""
echo "📞 Contact Support:"
echo "   Revolut: https://help.revolut.com"
echo "   GitHub Issue: Report at https://github.com/IJ87-ops/revolut-x-api/issues"
echo ""
echo "═══════════════════════════════════════════════════════════"
