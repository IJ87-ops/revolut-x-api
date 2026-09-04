/**
 * Main Orchestrator - Coordinates the complete trading workflow
 * Continuously: fetch market data → analyze → decide → execute → monitor
 */

import { RevolutXClient } from "@revolut/revolut-x-api";
import Decimal from "decimal.js";
import { loadConfig } from "./config.js";
import { AITradingBrain } from "./ai-brain.js";
import { TradingEngine } from "./trading-engine.js";
import { TradeRecorder } from "./trade-recorder.js";
import { TechnicalAnalyzer } from "./technical-analyzer.js";
import type {
  MarketData,
  TradingDecision,
  TradingOpportunity,
} from "./types.js";
import { randomUUID } from "node:crypto";

export class TradingOrchestrator {
  private client: RevolutXClient;
  private brain: AITradingBrain;
  private engine: TradingEngine;
  private recorder: TradeRecorder;
  private config: ReturnType<typeof loadConfig>;
  private running = false;
  private portfolioValue = new Decimal(0);
  private symbols: string[] = [];

  constructor() {
    this.config = loadConfig();

    // Initialize Revolut X API client
    this.client = new RevolutXClient({
      apiKey: this.config.revolutApiKey,
      privateKeyPath: this.config.revolutPrivateKeyPath,
      autoLoadCredentials: false,
    });

    // Initialize AI brain
    this.brain = new AITradingBrain(this.config.openaiApiKey);

    // Initialize trading engine
    this.engine = new TradingEngine(this.client, this.config);

    // Initialize trade recorder
    this.recorder = new TradeRecorder(this.config.dbPath);
  }

  /**
   * Start the trading loop
   */
  async start(): Promise<void> {
    if (this.running) {
      console.log("⚠️  Trading already running");
      return;
    }

    this.running = true;
    console.log("🚀 Starting trading orchestrator...");
    console.log(
      `📊 Mode: ${this.config.mode === "paper" ? "PAPER (Simulation)" : "🔴 LIVE (Real Money)"}`
    );

    try {
      // Verify authentication
      if (!this.client.isAuthenticated) {
        throw new Error("Not authenticated with Revolut X");
      }

      // Get trading pairs and initialize
      await this.initialize();

      // Main loop
      while (this.running) {
        try {
          await this.cycle();
        } catch (error) {
          console.error("❌ Cycle error:", error);
          // Continue running despite errors
        }

        // Wait before next cycle
        await this.sleep(this.config.pollIntervalMs);
      }
    } catch (error) {
      console.error("❌ Fatal error:", error);
      this.stop();
    }
  }

  /**
   * Stop the trading loop
   */
  stop(): void {
    this.running = false;
    console.log("⛔ Stopping trading orchestrator...");
    this.recorder.close();
  }

  /**
   * Initialize - get pairs, balances, etc.
   */
  private async initialize(): Promise<void> {
    console.log("📋 Initializing...");

    // Get supported pairs
    const pairs = await this.client.getCurrencyPairs();
    this.symbols = Object.keys(pairs).filter((symbol) => {
      // Focus on major USD trading pairs
      return symbol.endsWith("-USD") && pairs[symbol].status === "ACTIVE";
    });

    console.log(`✅ Found ${this.symbols.length} active trading pairs`);
    console.log(
      `   ${this.symbols.slice(0, 10).join(", ")}${this.symbols.length > 10 ? "..." : ""}`
    );

    // Get portfolio value
    const balances = await this.client.getBalances();
    let usdValue = new Decimal(0);

    for (const balance of balances) {
      if (balance.currency === "USD") {
        usdValue = new Decimal(balance.total);
      }
    }

    this.portfolioValue = usdValue;
    console.log(`💰 Portfolio value: $${this.portfolioValue.toFixed(2)}`);
  }

  /**
   * One trading cycle
   */
  private async cycle(): Promise<void> {
    // 1. Fetch market data for top pairs
    const topSymbols = this.symbols.slice(0, 10); // Start with top 10
    const marketData = await this.fetchMarketData(topSymbols);

    if (marketData.length === 0) {
      console.log("⚠️  No market data available");
      return;
    }

    // 2. Calculate technical indicators
    const indicators = new Map();
    for (const symbol of topSymbols) {
      try {
        const candles = await this.client.getCandles(symbol, {
          interval: "1h",
          limit: 100,
        });
        const ind = TechnicalAnalyzer.computeIndicators(candles.data);
        indicators.set(symbol, ind);
      } catch (error) {
        console.warn(`Failed to get candles for ${symbol}:`, error);
      }
    }

    // 3. Get balances
    const balances = await this.client.getBalances();
    const balanceMap = new Map(
      balances.map((b) => [b.currency, b.total.toString()])
    );

    // 4. Ask AI to identify opportunities
    console.log("🤖 Analyzing markets with AI...");
    const opportunities = await this.brain.identifyOpportunities(
      marketData,
      indicators,
      balanceMap
    );

    if (opportunities.length === 0) {
      console.log("✅ No trading opportunities identified");
      return;
    }

    console.log(`📊 Found ${opportunities.length} opportunity(ies)`);

    // 5. For each opportunity, assess risk and execute if acceptable
    for (const opportunity of opportunities) {
      await this.processOpportunity(opportunity);
    }

    // 6. Monitor open positions and adjust exits
    await this.monitorPositions(marketData, indicators);
  }

  /**
   * Process a single trading opportunity
   */
  private async processOpportunity(
    opportunity: TradingOpportunity
  ): Promise<void> {
    console.log(
      `\n📈 Evaluating ${opportunity.symbol} ${opportunity.side.toUpperCase()}`
    );
    console.log(`   AI Confidence: ${(opportunity.confidence * 100).toFixed(0)}%`);

    // Check if already have open position
    if (this.engine.hasOpenPosition(opportunity.symbol)) {
      console.log(`   ⏭️  Already have open position, skipping`);
      return;
    }

    // Check daily loss limit
    if (!this.engine.canTradeToday(this.config.maxDailyLoss)) {
      console.log(
        `   ⛔ Daily loss limit reached ($${this.engine.getDailyLoss()})`
      );
      return;
    }

    // Ask AI to assess risk
    const riskAnalysis = await this.brain.assessRisk(
      opportunity,
      this.portfolioValue.toString(),
      this.config.maxPositionSize,
      this.config.minRiskRewardRatio,
      this.config.minWinProbability
    );

    console.log(`   R:R: ${riskAnalysis.riskRewardRatio.toFixed(2)}:1`);
    console.log(
      `   Win Prob: ${(riskAnalysis.estimatedWinProbability * 100).toFixed(0)}%`
    );
    console.log(`   Position Size: ${riskAnalysis.positionSize}`);
    console.log(`   Risk Amount: $${riskAnalysis.riskAmount}`);
    console.log(`   Account Risk: ${riskAnalysis.accountRisk.toFixed(2)}%`);

    // Check if acceptable
    if (!riskAnalysis.isAcceptable) {
      console.log(`   ❌ ${riskAnalysis.reason}`);
      return;
    }

    console.log(`   ✅ ${riskAnalysis.reason}`);

    // Create trading decision
    const decision: TradingDecision = {
      id: randomUUID(),
      timestamp: Date.now(),
      symbol: opportunity.symbol,
      side: opportunity.side,
      entryPrice: opportunity.entryPrice,
      quantity: riskAnalysis.positionSize,
      riskRewardRatio: riskAnalysis.riskRewardRatio,
      expectedWinProbability:
        riskAnalysis.estimatedWinProbability,
      reasoning: opportunity.reasoning,
      maxLoss: riskAnalysis.riskAmount,
      maxGain: riskAnalysis.rewardAmount,
    };

    // Record decision
    this.recorder.recordDecision(decision);

    // Execute trade
    const trade = await this.engine.executeTrade(decision);
    if (trade) {
      console.log(`   ✅ Trade executed: ${trade.orderId}`);
    } else {
      console.log(`   ❌ Trade execution failed`);
    }
  }

  /**
   * Monitor open positions and adjust exits
   */
  private async monitorPositions(
    marketData: MarketData[],
    indicators: Map<string, any>
  ): Promise<void> {
    const openPositions = this.engine.getOpenPositions();
    if (openPositions.length === 0) return;

    console.log(`\n📍 Monitoring ${openPositions.length} open position(s)...`);

    for (const position of openPositions) {
      const market = marketData.find((m) => m.symbol === position.symbol);
      if (!market) continue;

      const ind = indicators.get(position.symbol);
      const currentPrice =
        position.side === "buy" ? market.bid : market.ask;

      // Check exit conditions
      const exitAssessment = await this.brain.assessExit(
        position.symbol,
        position.side,
        position.filledPrice,
        currentPrice,
        position.filledPrice, // Would use actual stop loss from DB
        "0", // Would use actual take profit from DB
        ind || {}
      );

      if (exitAssessment.shouldExit) {
        console.log(
          `   📤 Exit signal for ${position.symbol}: ${exitAssessment.reason}`
        );
        const pnl = await this.engine.closePosition(
          position.symbol,
          currentPrice
        );
        if (pnl) {
          this.recorder.recordPnL(
            position.id,
            pnl.toString(),
            pnl.dividedBy(position.filledPrice).toNumber()
          );
        }
      }
    }
  }

  /**
   * Fetch market data for multiple symbols
   */
  private async fetchMarketData(symbols: string[]): Promise<MarketData[]> {
    try {
      const tickerResponse = await this.client.getTickers({
        symbols,
      });

      return tickerResponse.data.map((ticker) => ({
        symbol: ticker.symbol.replace("/", "-"),
        bid: ticker.bid,
        ask: ticker.ask,
        last: ticker.last,
        timestamp: tickerResponse.metadata.timestamp,
      }));
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      return [];
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
