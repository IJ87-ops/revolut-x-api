/**
 * Enhanced Trade Executor - Detailed transaction recording and reporting
 * Every trade is analyzed, executed, and immediately reported with full details
 */

import Decimal from "decimal.js";
import type { ExecutedTrade, TradeDecision } from "./types.js";
import { TradeRecorder } from "./trade-recorder.js";
import type { TradeAnalysis } from "./enhanced-trade-analyzer.js";

export interface TradeNotification {
  type:
    | "BUY_SIGNAL"
    | "SELL_SIGNAL"
    | "POSITION_OPENED"
    | "POSITION_CLOSED"
    | "PROFIT_TAKEN"
    | "LOSS_CUT"
    | "TRADE_REJECTED"
    | "ERROR";
  timestamp: Date;
  symbol: string;
  side?: "buy" | "sell";
  entryPrice?: string;
  exitPrice?: string;
  quantity?: string;
  profitLoss?: string;
  profitLossPercent?: number;
  tradingFees?: string;
  reason: string;
  details: TradeAnalysis | ExecutedTrade | { error: string };
}

export class EnhancedTradeExecutor {
  private recorder: TradeRecorder;
  private notifications: TradeNotification[] = [];
  private openPositions = new Map<string, ExecutedTrade>();
  private totalProfitLoss = new Decimal(0);
  private takerFeeRate = new Decimal("0.0006"); // 0.06%

  constructor(dbPath: string = "./trader-history.db") {
    this.recorder = new TradeRecorder(dbPath);
  }

  /**
   * Execute trade ONLY after rigorous analysis
   * Every trade is pre-analyzed, validated, and reported
   */
  async executeTrade(
    analysis: TradeAnalysis,
    currentPrice: string,
    accountBalance: string,
    mode: "paper" | "live" = "paper"
  ): Promise<ExecutedTrade | null> {
    // 1. VALIDATE ANALYSIS
    if (
      analysis.recommendation === "REJECT" ||
      analysis.recommendation === "HOLD"
    ) {
      this.recordNotification({
        type: "TRADE_REJECTED",
        timestamp: new Date(),
        symbol: analysis.symbol,
        reason: `Analysis recommends ${analysis.recommendation}: ${analysis.reason}`,
        details: analysis,
      });
      console.log(`\n❌ TRADE REJECTED - ${analysis.symbol}`);
      console.log(`   Reason: ${analysis.reason}`);
      console.log(`   R:R: ${analysis.riskRewardRatio.toFixed(2)}:1`);
      console.log(`   Win Prob: ${(analysis.expectedWinProbability * 100).toFixed(0)}%`);
      return null;
    }

    // 2. VALIDATE RISK/REWARD
    if (analysis.riskRewardRatio < 1.2) {
      this.recordNotification({
        type: "TRADE_REJECTED",
        timestamp: new Date(),
        symbol: analysis.symbol,
        reason: `Risk/reward too low: ${analysis.riskRewardRatio.toFixed(2)}:1`,
        details: analysis,
      });
      console.log(`\n❌ TRADE REJECTED - ${analysis.symbol}`);
      console.log(`   Reason: Risk/reward ${analysis.riskRewardRatio.toFixed(2)}:1 < 1.2:1`);
      return null;
    }

    // 3. VALIDATE WIN PROBABILITY
    if (analysis.expectedWinProbability < 0.5) {
      this.recordNotification({
        type: "TRADE_REJECTED",
        timestamp: new Date(),
        symbol: analysis.symbol,
        reason: `Win probability too low: ${(analysis.expectedWinProbability * 100).toFixed(0)}%`,
        details: analysis,
      });
      console.log(`\n❌ TRADE REJECTED - ${analysis.symbol}`);
      console.log(
        `   Reason: Win probability ${(analysis.expectedWinProbability * 100).toFixed(0)}% < 50%`
      );
      return null;
    }

    // 4. VALIDATE PROFITABILITY AFTER FEES
    if (analysis.netProfitPercent < 0.1) {
      this.recordNotification({
        type: "TRADE_REJECTED",
        timestamp: new Date(),
        symbol: analysis.symbol,
        reason: `Expected profit too low after fees: ${analysis.netProfitPercent.toFixed(2)}%`,
        details: analysis,
      });
      console.log(`\n❌ TRADE REJECTED - ${analysis.symbol}`);
      console.log(
        `   Reason: Net profit ${analysis.netProfitPercent.toFixed(2)}% < 0.1% (not worth the risk)`
      );
      return null;
    }

    // 5. CHECK FOR EXISTING POSITION
    if (this.openPositions.has(analysis.symbol)) {
      this.recordNotification({
        type: "TRADE_REJECTED",
        timestamp: new Date(),
        symbol: analysis.symbol,
        reason: `Position already open in ${analysis.symbol}`,
        details: analysis,
      });
      console.log(`\n⚠️  POSITION ALREADY OPEN - ${analysis.symbol}`);
      return null;
    }

    // 6. EXECUTE TRADE
    const executedTrade: ExecutedTrade = {
      id: this.generateTradeId(),
      symbol: analysis.symbol,
      side: analysis.side,
      entryPrice: analysis.entryPrice,
      exitPrice: null,
      quantity: analysis.positionSize,
      riskRewardRatio: analysis.riskRewardRatio,
      expectedWinProbability: analysis.expectedWinProbability,
      stopLoss: analysis.stopLoss,
      takeProfit: analysis.takeProfit,
      entryFees: new Decimal(analysis.positionSize)
        .times(analysis.entryPrice)
        .times(this.takerFeeRate)
        .toFixed(2),
      exitFees: null,
      pnl: null,
      pnlPercent: null,
      aiReasoning: analysis.reason,
      status: "open",
      createdAt: new Date(),
      closedAt: null,
      updatedAt: new Date(),
      mode,
    };

    // 7. RECORD TO DATABASE
    await this.recorder.recordTrade(executedTrade);

    // 8. STORE IN OPEN POSITIONS
    this.openPositions.set(analysis.symbol, executedTrade);

    // 9. SEND NOTIFICATIONS
    this.recordNotification({
      type: "POSITION_OPENED",
      timestamp: new Date(),
      symbol: analysis.symbol,
      side: analysis.side,
      entryPrice: analysis.entryPrice,
      quantity: analysis.positionSize,
      reason: `Position opened: ${analysis.side.toUpperCase()} ${analysis.positionSize} ${analysis.symbol} @ ${analysis.entryPrice}`,
      details: executedTrade,
    });

    // 10. PRINT CLEAR NOTIFICATION
    this.printTradeNotification("OPEN", executedTrade, analysis);

    return executedTrade;
  }

  /**
   * Monitor and close positions based on current price
   */
  async monitorAndClosePositions(
    currentPrices: Map<string, string>
  ): Promise<ExecutedTrade[]> {
    const closedTrades: ExecutedTrade[] = [];

    for (const [symbol, trade] of this.openPositions.entries()) {
      const currentPrice = currentPrices.get(symbol);
      if (!currentPrice) continue;

      const current = new Decimal(currentPrice);
      const entry = new Decimal(trade.entryPrice);
      const stop = new Decimal(trade.stopLoss);
      const take = new Decimal(trade.takeProfit);

      let shouldClose = false;
      let closeReason = "";
      let exitPrice = currentPrice;

      // BUY POSITION: Check take-profit and stop-loss
      if (trade.side === "buy") {
        if (current.greaterThanOrEqualTo(take)) {
          shouldClose = true;
          closeReason = "TAKE_PROFIT_HIT";
          exitPrice = trade.takeProfit;
        } else if (current.lessThanOrEqualTo(stop)) {
          shouldClose = true;
          closeReason = "STOP_LOSS_HIT";
          exitPrice = trade.stopLoss;
        }
      }
      // SELL POSITION: Check take-profit and stop-loss
      else {
        if (current.lessThanOrEqualTo(take)) {
          shouldClose = true;
          closeReason = "TAKE_PROFIT_HIT";
          exitPrice = trade.takeProfit;
        } else if (current.greaterThanOrEqualTo(stop)) {
          shouldClose = true;
          closeReason = "STOP_LOSS_HIT";
          exitPrice = trade.stopLoss;
        }
      }

      if (shouldClose) {
        const closedTrade = await this.closeTrade(trade, exitPrice, closeReason);
        closedTrades.push(closedTrade);
      }
    }

    return closedTrades;
  }

  /**
   * Close a position and calculate P&L
   */
  private async closeTrade(
    trade: ExecutedTrade,
    exitPrice: string,
    reason: string
  ): Promise<ExecutedTrade> {
    const quantity = new Decimal(trade.quantity);
    const entryPrice = new Decimal(trade.entryPrice);
    const exitPriceDecimal = new Decimal(exitPrice);
    const entryFees = new Decimal(trade.entryFees || 0);

    // Calculate exit fees
    const exitFees = quantity
      .times(exitPriceDecimal)
      .times(this.takerFeeRate)
      .toFixed(2);

    // Calculate P&L
    let pnl: Decimal;
    if (trade.side === "buy") {
      pnl = exitPriceDecimal
        .minus(entryPrice)
        .times(quantity)
        .minus(entryFees)
        .minus(new Decimal(exitFees));
    } else {
      pnl = entryPrice
        .minus(exitPriceDecimal)
        .times(quantity)
        .minus(entryFees)
        .minus(new Decimal(exitFees));
    }

    const tradeValue = entryPrice.times(quantity);
    const pnlPercent = pnl.dividedBy(tradeValue).times(100).toNumber();

    // Update trade
    trade.exitPrice = exitPrice;
    trade.exitFees = exitFees;
    trade.pnl = pnl.toFixed(2);
    trade.pnlPercent = pnlPercent;
    trade.status = "closed";
    trade.closedAt = new Date();
    trade.updatedAt = new Date();

    // Update running total
    this.totalProfitLoss = this.totalProfitLoss.plus(pnl);

    // Record to database
    await this.recorder.recordTradeClose(trade);

    // Remove from open positions
    this.openPositions.delete(trade.symbol);

    // Send notification
    const notificationType =
      pnl.greaterThanOrEqualTo(0) ? "PROFIT_TAKEN" : "LOSS_CUT";
    this.recordNotification({
      type: notificationType,
      timestamp: new Date(),
      symbol: trade.symbol,
      side: trade.side,
      entryPrice: trade.entryPrice,
      exitPrice,
      quantity: trade.quantity,
      profitLoss: pnl.toFixed(2),
      profitLossPercent: pnlPercent,
      tradingFees: new Decimal(trade.entryFees || 0)
        .plus(exitFees)
        .toFixed(2),
      reason: `Position closed: ${reason}`,
      details: trade,
    });

    // Print notification
    this.printTradeNotification("CLOSE", trade, null, pnlPercent);

    return trade;
  }

  /**
   * Print detailed trade notification
   */
  private printTradeNotification(
    action: "OPEN" | "CLOSE",
    trade: ExecutedTrade,
    analysis: TradeAnalysis | null,
    pnlPercent?: number
  ): void {
    if (action === "OPEN" && analysis) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`✅ POSITION OPENED - ${trade.symbol}`);
      console.log(`${"=".repeat(80)}`);
      console.log(`📊 Trade Details:`);
      console.log(`   Symbol: ${trade.symbol}`);
      console.log(`   Side: ${trade.side.toUpperCase()}`);
      console.log(`   Entry Price: £${trade.entryPrice}`);
      console.log(`   Stop Loss: £${trade.stopLoss}`);
      console.log(`   Take Profit: £${trade.takeProfit}`);
      console.log(`   Quantity: ${trade.quantity}`);
      console.log(`   Entry Fees: £${trade.entryFees}`);
      console.log(`\n📈 Risk Analysis:`);
      console.log(
        `   Risk/Reward: ${analysis.riskRewardRatio.toFixed(2)}:1`
      );
      console.log(
        `   Win Probability: ${(analysis.expectedWinProbability * 100).toFixed(0)}%`
      );
      console.log(
        `   Expected Profit: £${analysis.netProfit} (${analysis.netProfitPercent.toFixed(2)}%)`
      );
      console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
      console.log(`\n🧠 AI Analysis:`);
      console.log(`   Price Action: ${analysis.analysis.priceAction}`);
      console.log(`   Trend: ${analysis.analysis.trend}`);
      console.log(`   Momentum: ${analysis.analysis.momentum}`);
      console.log(`   Volume: ${analysis.analysis.volume}`);
      console.log(`   Reasoning: ${analysis.reason}`);
      console.log(`${"=".repeat(80)}\n`);
    } else if (action === "CLOSE") {
      const isProfitable = (trade.pnl || "0") >= "0";
      const emoji = isProfitable ? "💰" : "💔";
      console.log(`\n${"=".repeat(80)}`);
      console.log(`${emoji} POSITION CLOSED - ${trade.symbol}`);
      console.log(`${"=".repeat(80)}`);
      console.log(`📊 Trade Summary:`);
      console.log(`   Symbol: ${trade.symbol}`);
      console.log(`   Side: ${trade.side.toUpperCase()}`);
      console.log(`   Entry Price: £${trade.entryPrice}`);
      console.log(`   Exit Price: £${trade.exitPrice}`);
      console.log(`   Quantity: ${trade.quantity}`);
      console.log(`   Duration: ${this.calculateDuration(trade.createdAt, trade.closedAt)}`);
      console.log(`\n💹 P&L Summary:`);
      console.log(`   Gross Profit/Loss: £${trade.pnl}`);
      console.log(`   P&L Percentage: ${pnlPercent?.toFixed(2)}%`);
      console.log(
        `   Total Trading Fees: £${new Decimal(trade.entryFees || 0)
          .plus(trade.exitFees || 0)
          .toFixed(2)}`
      );
      console.log(`   Running Total P&L: £${this.totalProfitLoss.toFixed(2)}`);
      console.log(`${"=".repeat(80)}\n`);
    }
  }

  /**
   * Get all notifications
   */
  getNotifications(): TradeNotification[] {
    return [...this.notifications];
  }

  /**
   * Get open positions
   */
  getOpenPositions(): ExecutedTrade[] {
    return Array.from(this.openPositions.values());
  }

  /**
   * Get total profit/loss
   */
  getTotalProfitLoss(): string {
    return this.totalProfitLoss.toFixed(2);
  }

  /**
   * Private helpers
   */
  private recordNotification(notification: TradeNotification): void {
    this.notifications.push(notification);
    // Keep only last 100 notifications in memory
    if (this.notifications.length > 100) {
      this.notifications.shift();
    }
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateDuration(start: Date, end: Date | null): string {
    if (!end) return "ongoing";
    const ms = end.getTime() - start.getTime();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
}
