#!/usr/bin/env bash

# 🚨 LIVE TRADING MODE ENABLER
# ⚠️  THIS WILL EXECUTE REAL TRADES WITH REAL MONEY
# ⚠️  DO NOT RUN UNLESS YOU'VE COMPLETED ALL SAFETY CHECKS

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 🚨 LIVE TRADING ACTIVATION 🚨              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  WARNING: This will SWITCH the system to LIVE trading mode."
echo "⚠️  REAL money will be used for REAL trades."
echo "⚠️  Trades CANNOT be reversed or undone."
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if all required environment variables are set
echo "✅ Checking environment variables..."

if [ -z "$REVOLUT_API_KEY" ]; then
    echo "❌ ERROR: REVOLUT_API_KEY not set"
    exit 1
fi

if [ -z "$REVOLUT_PRIVATE_KEY_PATH" ]; then
    echo "❌ ERROR: REVOLUT_PRIVATE_KEY_PATH not set"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ ERROR: OPENAI_API_KEY not set"
    exit 1
fi

echo "✅ All required credentials are set"
echo ""

# Check if private key file exists
echo "✅ Checking private key file..."
if [ ! -f "$REVOLUT_PRIVATE_KEY_PATH" ]; then
    echo "❌ ERROR: Private key file not found at: $REVOLUT_PRIVATE_KEY_PATH"
    exit 1
fi
echo "✅ Private key file found"
echo ""

# Verify trader-history.db exists
echo "✅ Checking trading history database..."
if [ ! -f "trader-history.db" ]; then
    echo "❌ ERROR: trader-history.db not found. Have you run paper trading?"
    exit 1
fi
echo "✅ Trading history database found"
echo ""

# Get statistics from database
echo "📊 Paper Trading Statistics:"
echo "════════════════════════════════════════════════════════════"

# This would normally query the database, but for now we'll show the structure
sqlite3 trader-history.db ".tables" 2>/dev/null || true

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Final confirmation
echo "🔴 FINAL CONFIRMATION REQUIRED 🔴"
echo ""
echo "Type 'YES, ENABLE LIVE TRADING' to proceed:"
echo "(anything else will cancel)"
echo ""
read -p "> " CONFIRMATION

if [ "$CONFIRMATION" != "YES, ENABLE LIVE TRADING" ]; then
    echo ""
    echo "❌ Live trading NOT enabled. System remains in PAPER mode."
    exit 0
fi

echo ""
echo "✅ Confirmed! Enabling LIVE trading mode..."
echo ""

# Set environment variable
export REVX_TRADER_MODE="live"

# Log the activation
echo "$(date): LIVE TRADING MODE ENABLED" >> trader-live-activation.log

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║               🔴 LIVE TRADING ACTIVATED 🔴                ║"
echo "║                                                            ║"
echo "║  Mode: LIVE                                               ║"
echo "║  Real trades with real money will now execute             ║"
echo "║  Initial Balance: £${REVX_INITIAL_BALANCE:-5000}          ║"
echo "║  Max Position Size: ${REVX_MAX_POSITION_SIZE:-5}%         ║"
echo "║  Max Daily Loss: £${REVX_MAX_DAILY_LOSS:-500}             ║"
echo "║                                                            ║"
echo "║  🚀 Starting enhanced trading orchestrator...             ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Start the trading system
npm run start
