/**
 * Enhanced Trading Orchestrator
 * Main trading loop: Analyze → Validate → Execute → Monitor → Report
 * 
 * Priority Order:
 * 1. Protect capital (no bad trades)
 * 2. Minimize unnecessary losses (exit losers early)
 * 3. Identify strongest opportunities (high R:R, good probability)
 * 4. Maximize profitable returns (let winners run)
 */

import Decimal from "decimal.js";
import { TechnicalAnalyzer } from "./technical-analyzer.js";
import { EnhancedTradeAnalyzer } from "./enhanced-trade-analyzer.js";
import { EnhancedTradeExecutor } from "./enhanced-trade-executor.js";
import { RevolutXClient } from "@revolut/revolut-x-api";
import { loadConfig } from "./config.js";
import type { MarketData } from "./types.js";

export class EnhancedTradingOrchestrator {
  private config = loadConfig();
  private client: RevolutXClient;
  private technicalAnalyzer: TechnicalAnalyzer;
  private tradeAnalyzer: EnhancedTradeAnalyzer;
  private executor: EnhancedTradeExecutor;
  private isRunning = false;
  private accountBalance = new Decimal(this.config.initialBalance || "5000");
  private dailyLossTracker = new Decimal(0);
  private dayResetTime = new Date();

  constructor() {
    this.client = new RevolutXClient({
      apiKey: this.config.revxApiKey,
      privateKeyPath: this.config.revxPrivateKeyPath,
    });
    this.technicalAnalyzer = new TechnicalAnalyzer();
    this.tradeAnalyzer = new EnhancedTradeAnalyzer();
    this.executor = new EnhancedTradeExecutor(this.config.dbPath);
  }

  /**
   * Start the trading orchestrator
   * Main loop: Fetch data → Analyze → Execute → Monitor → Sleep → Repeat
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️  Orchestrator already running");
      return;
    }

    this.isRunning = true;
    this.printStartupBanner();

    // eslint-disable-next-line no-constant-condition
    while (this.isRunning) {
      try {
        await this.runTradingCycle();
      } catch (error) {
        console.error("❌ Orchestrator error:", error);
        // Continue running on error
      }

      // Wait before next cycle
      const sleepMs = this.config.pollIntervalMs;
      console.log(`\n⏳ Next analysis in ${sleepMs / 1000} seconds...\n`);
      await this.sleep(sleepMs);
    }
  }

  /**
   * Single trading cycle: Fetch → Analyze → Execute → Monitor
   */
  private async runTradingCycle(): Promise<void> {
    console.log("\n" + "=".repeat(80));
    console.log(`📊 TRADING CYCLE - ${new Date().toISOString()}`);
    console.log("=".repeat(80));

    // STEP 1: Check daily loss limit and reset if needed
    this.checkDailyResetAndLimits();

    // STEP 2: Fetch current market data
    console.log("\n1️⃣  FETCHING MARKET DATA...");
    const marketData = await this.fetchMarketData();
    if (marketData.size === 0) {
      console.log("   ⚠️  No market data available");
      return;
    }
    console.log(`   ✅ Fetched data for ${marketData.size} trading pairs`);

    // STEP 3: Calculate technical indicators for each symbol
    console.log("\n2️⃣  CALCULATING TECHNICAL INDICATORS...");
    const technicalData = new Map();
    for (const [symbol, data] of marketData.entries()) {
      const indicators = await this.technicalAnalyzer.calculateIndicators(
        symbol,
        data
      );
      technicalData.set(symbol, indicators);
    }
    console.log(`   ✅ Calculated indicators for ${technicalData.size} pairs`);

    // STEP 4: Analyze each trading opportunity
    console.log("\n3️⃣  ANALYZING TRADING OPPORTUNITIES...");
    const analyses: Array<{ symbol: string; analysis: any }> = [];
    for (const [symbol, marketData] of marketData.entries()) {
      const indicators = technicalData.get(symbol);
      const analysis = await this.tradeAnalyzer.analyzeTradeOpportunity(
        symbol,
        marketData as MarketData,
        indicators,
        this.accountBalance.toString(),
        this.config.maxPositionSize
      );
      analyses.push({ symbol, analysis });

      if (analysis.recommendation !== "HOLD" && analysis.recommendation !== "REJECT") {
        console.log(
          `   📈 ${symbol}: ${analysis.recommendation} (R:R ${analysis.riskRewardRatio.toFixed(2)}:1, Confidence ${(analysis.confidence * 100).toFixed(0)}%)`
        );
      }
    }
    console.log(`   ✅ Analyzed ${analyses.length} pairs`);

    // STEP 5: Filter opportunities (only STRONG_BUY or BUY)
    const tradableOpportunities = analyses.filter(
      (a) => a.analysis.recommendation === "STRONG_BUY" || a.analysis.recommendation === "BUY"
    );

    if (tradableOpportunities.length === 0) {
      console.log("\n   ⏸️  No tradable opportunities identified");
    }

    // STEP 6: Execute trades (highest quality first)
    console.log("\n4️⃣  EXECUTING TRADES...");
    for (const { symbol, analysis } of tradableOpportunities) {
      const currentPrice = marketData.get(symbol)?.bid || analysis.entryPrice;

      const executed = await this.executor.executeTrade(
        analysis,
        currentPrice,
        this.accountBalance.toString(),
        this.config.tradeMode as "paper" | "live"
      );

      if (executed) {
        this.accountBalance = this.accountBalance.minus(analysis.riskAmount);
      }
    }

    // STEP 7: Monitor open positions and close if needed
    console.log("\n5️⃣  MONITORING OPEN POSITIONS...");
    const currentPrices = new Map(
      Array.from(marketData.entries()).map(([symbol, data]) => [
        symbol,
        (data as MarketData).bid,
      ])
    );

    const closedTrades = await this.executor.monitorAndClosePositions(
      currentPrices
    );

    if (closedTrades.length > 0) {
      for (const trade of closedTrades) {
        if (trade.pnl) {
          this.accountBalance = this.accountBalance.plus(trade.pnl);
          this.dailyLossTracker = this.dailyLossTracker.plus(trade.pnl);
        }
      }
    }

    // STEP 8: Print session summary
    this.printSessionSummary();
  }

  /**
   * Fetch market data for top trading pairs
   */
  private async fetchMarketData(): Promise<Map<string, any>> {
    const pairs = [
      "BTC-USD",
      "ETH-USD",
      "SOL-USD",
      "ADA-USD",
      "DOGE-USD",
      "XRP-USD",
      "MATIC-USD",
      "LTC-USD",
      "BCH-USD",
      "VET-USD",
    ];

    const marketData = new Map();

    for (const pair of pairs) {
      try {
        const data = await this.client.getMarketData(pair);
        if (data && data.bid && data.ask && data.last) {
          marketData.set(pair, {
            bid: data.bid,
            ask: data.ask,
            last: data.last,
            volume24h: data.volume24h || "0",
            high24h: data.high24h || data.ask,
            low24h: data.low24h || data.bid,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to fetch data for ${pair}`);
      }
    }

    return marketData;
  }

  /**
   * Check daily loss limits and reset if day has changed
   */
  private checkDailyResetAndLimits(): void {
    const now = new Date();
    const resetTime = new Date(this.dayResetTime);
    resetTime.setDate(resetTime.getDate() + 1);
    resetTime.setHours(0, 0, 0, 0);

    if (now >= resetTime) {
      this.dayResetTime = now;
      this.dailyLossTracker = new Decimal(0);
      console.log("\n🔄 Daily loss tracker reset");
    }

    // Check if daily loss limit exceeded
    if (this.dailyLossTracker.lessThan(-this.config.maxDailyLoss)) {
      console.log(
        `\n❌ DAILY LOSS LIMIT EXCEEDED: £${this.dailyLossTracker.toFixed(2)} < -£${this.config.maxDailyLoss}`
      );
      console.log(
        `⛔ TRADING HALTED FOR THE DAY - Resume trading after daily reset`
      );
      this.isRunning = false;
    }
  }

  /**
   * Print trading session summary
   */
  private printSessionSummary(): void {
    const openPositions = this.executor.getOpenPositions();
    const totalPnL = this.executor.getTotalProfitLoss();

    console.log("\n" + "=".repeat(80));
    console.log("📋 SESSION SUMMARY");
    console.log("=".repeat(80));
    console.log(`Account Balance: £${this.accountBalance.toFixed(2)}`);
    console.log(`Daily P&L: £${this.dailyLossTracker.toFixed(2)}`);
    console.log(`Total P&L: £${totalPnL}`);
    console.log(`Open Positions: ${openPositions.length}`);
    console.log(
      `Daily Loss Limit: £${this.config.maxDailyLoss} (${((this.dailyLossTracker.toNumber() / -this.config.maxDailyLoss) * 100).toFixed(0)}% used)`
    );
    console.log("=".repeat(80));
  }

  /**
   * Print startup banner
   */
  private printStartupBanner(): void {
    console.log("\n");
    console.log("╔" + "=".repeat(78) + "╗");
    console.log("║" + " ".repeat(78) + "║");
    console.log("║" + "  REVOLUT X AI-POWERED TRADING SYSTEM".padEnd(78) + "║");
    console.log("║" + "  Enhanced Analysis & Execution Engine".padEnd(78) + "║");
    console.log("║" + " ".repeat(78) + "║");
    console.log("╠" + "=".repeat(78) + "╣");
    console.log(
      "║" + `  Mode: ${this.config.tradeMode.toUpperCase()}`.padEnd(78) + "║"
    );
    console.log(
      "║" + `  Initial Balance: £${this.accountBalance.toFixed(2)}`.padEnd(78) + "║"
    );
    console.log(
      "║" + `  Max Position Size: ${this.config.maxPositionSize}%`.padEnd(78) + "║"
    );
    console.log(
      "║" + `  Max Daily Loss: £${this.config.maxDailyLoss}`.padEnd(78) + "║"
    );
    console.log(
      "║" + `  Min R:R: ${this.config.minRR.toFixed(2)}:1`.padEnd(78) + "║"
    );
    console.log(
      "║" + `  Min Win Prob: ${(this.config.minWinProb * 100).toFixed(0)}%`.padEnd(78) + "║"
    );
    console.log(
      "║" + `  Analysis Interval: ${this.config.pollIntervalMs / 1000}s`.padEnd(78) + "║"
    );
    console.log("║" + " ".repeat(78) + "║");
    console.log("╠" + "=".repeat(78) + "╣");
    console.log(
      "║" + "  TRADING PRIORITIES:".padEnd(78) + "║"
    );
    console.log(
      "║" + "  1. Protect capital → 2. Minimize losses → 3. Find opportunities → 4. Maximize profits".padEnd(78) + "║"
    );
    console.log(
      "║" + "  NO GUESSES. NO EMOTIONS. ANALYSIS FIRST. TRADE SECOND.".padEnd(78) + "║"
    );
    console.log("║" + " ".repeat(78) + "║");
    console.log("╚" + "=".repeat(78) + "╝\n");
  }

  /**
   * Stop the orchestrator
   */
  stop(): void {
    console.log("\n\n🛑 Stopping trading orchestrator...");
    this.isRunning = false;
  }

  /**
   * Helper: Sleep for ms milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const orchestrator = new EnhancedTradingOrchestrator();
  await orchestrator.start();
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
