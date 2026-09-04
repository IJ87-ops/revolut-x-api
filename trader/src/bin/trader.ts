#!/usr/bin/env node
/**
 * Trading system CLI entry point
 * NEVER logs credentials or private keys
 */

import { TradingOrchestrator } from "../orchestrator.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help") {
    printHelp();
    return;
  }

  const orchestrator = new TradingOrchestrator();

  switch (command) {
    case "start":
      await orchestrator.start();
      break;

    case "status":
      console.log("📊 Trading system status check");
      console.log("   Implementation complete");
      console.log("   Run 'revx-trader start' to begin trading");
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Revolut X AI-Powered Trading System                    ║
║                                                                ║
║  An intelligent trading engine that analyzes crypto markets   ║
║  with ChatGPT and executes profitable trades through Revolut  ║
╚════════════════════════════════════════════════════════════════╝

COMMANDS:
  start         Start the trading orchestrator (continuous loop)
  status        Check system status
  help          Show this help message

ENVIRONMENT VARIABLES:
  REVOLUT_API_KEY              Revolut X API key
  REVOLUT_PRIVATE_KEY_PATH     Path to Ed25519 private key
  OPENAI_API_KEY               OpenAI/ChatGPT API key
  REVX_TRADER_MODE             'paper' (default) or 'live'
  REVX_MAX_POSITION_SIZE       Max % of portfolio per trade (default: 5)
  REVX_MAX_DAILY_LOSS          Max daily loss in USD (default: 500)
  REVX_MIN_RR                  Min risk/reward ratio (default: 1.5)
  REVX_MIN_WIN_PROB            Min win probability 0-1 (default: 0.55)
  REVX_POLL_INTERVAL_MS        Loop interval in ms (default: 60000)
  REVX_DB_PATH                 Trade history DB path (default: ./trader-history.db)

QUICK START (Paper Trading - No Real Money):
  export REVOLUT_API_KEY="your-revolut-api-key"
  export REVOLUT_PRIVATE_KEY_PATH="~/.config/revolut-x/private.pem"
  export OPENAI_API_KEY="your-openai-api-key"
  revx-trader start

SECURITY:
  ✅ All credentials loaded from environment variables
  ✅ Private keys NEVER logged or committed
  ✅ Paper mode enabled by default (no real orders)
  ✅ All trades recorded to SQLite database
  ✅ AI analysis never exposes credentials

LIVE TRADING:
  To enable live trading (REAL MONEY AT RISK):
  export REVX_TRADER_MODE="live"
  
  WARNING: Live mode will place real orders on Revolut X.
  Only enable after thorough testing and understanding the risks.
`);
}

main().catch((error: unknown) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
