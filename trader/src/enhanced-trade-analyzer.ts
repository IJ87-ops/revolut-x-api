/**
 * Enhanced Trade Analyzer - Rigorous pre-trade analysis
 * NO trade executes without comprehensive analysis
 */

import Decimal from "decimal.js";
import type { MarketData, TechnicalIndicators } from "./types.js";

export interface TradeAnalysis {
  symbol: string;
  side: "buy" | "sell";
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL" | "REJECT";
  confidence: number; // 0-1
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  positionSize: string;
  riskAmount: string;
  rewardAmount: string;
  riskRewardRatio: number;
  expectedWinProbability: number;
  potentialProfitPercent: number;
  potentialLossPercent: number;
  tradingFees: string;
  netProfit: string;
  netProfitPercent: number;
  reason: string;
  analysis: {
    priceAction: string;
    trend: string;
    momentum: string;
    volume: string;
    volatility: string;
    support: string;
    resistance: string;
    riskRewardJustification: string;
  };
}

export class EnhancedTradeAnalyzer {
  private takerFeeRate = new Decimal("0.0006"); // 0.06%
  private makerFeeRate = new Decimal("0.0002"); // 0.02%

  /**
   * Comprehensive pre-trade analysis
   * Analyzes ALL factors before recommending entry
   */
  async analyzeTradeOpportunity(
    symbol: string,
    marketData: MarketData,
    indicators: TechnicalIndicators,
    accountValue: string,
    maxPositionSize: number
  ): Promise<TradeAnalysis> {
    const analysis: TradeAnalysis = {
      symbol,
      side: "buy",
      recommendation: "HOLD",
      confidence: 0,
      entryPrice: "0",
      exitPrice: "0",
      stopLoss: "0",
      takeProfit: "0",
      positionSize: "0",
      riskAmount: "0",
      rewardAmount: "0",
      riskRewardRatio: 0,
      expectedWinProbability: 0,
      potentialProfitPercent: 0,
      potentialLossPercent: 0,
      tradingFees: "0",
      netProfit: "0",
      netProfitPercent: 0,
      reason: "Awaiting analysis",
      analysis: {
        priceAction: "",
        trend: "",
        momentum: "",
        volume: "",
        volatility: "",
        support: "",
        resistance: "",
        riskRewardJustification: "",
      },
    };

    // 1. PRICE ACTION ANALYSIS
    const priceAnalysis = this.analyzePriceAction(marketData, indicators);
    analysis.analysis.priceAction = priceAnalysis.description;

    // 2. TREND ANALYSIS
    const trendAnalysis = this.analyzeTrend(indicators);
    analysis.analysis.trend = trendAnalysis.description;

    // 3. MOMENTUM ANALYSIS
    const momentumAnalysis = this.analyzeMomentum(indicators);
    analysis.analysis.momentum = momentumAnalysis.description;

    // 4. VOLUME ANALYSIS
    const volumeAnalysis = this.analyzeVolume(indicators);
    analysis.analysis.volume = volumeAnalysis.description;

    // 5. VOLATILITY ANALYSIS
    const volatilityAnalysis = this.analyzeVolatility(indicators);
    analysis.analysis.volatility = volatilityAnalysis.description;

    // 6. SUPPORT/RESISTANCE
    const levels = this.identifySupportResistance(marketData, indicators);
    analysis.analysis.support = levels.support;
    analysis.analysis.resistance = levels.resistance;

    // 7. DETERMINE SIDE (BUY or SELL)
    const signals = {
      bullish: priceAnalysis.bullish + trendAnalysis.bullish + momentumAnalysis.bullish,
      bearish: priceAnalysis.bearish + trendAnalysis.bearish + momentumAnalysis.bearish,
    };

    analysis.side = signals.bullish > signals.bearish ? "buy" : "sell";

    // 8. SET ENTRY AND EXIT LEVELS
    if (analysis.side === "buy") {
      analysis.entryPrice = marketData.bid;
      analysis.stopLoss = levels.support;
      analysis.takeProfit = levels.resistance;
    } else {
      analysis.entryPrice = marketData.ask;
      analysis.stopLoss = levels.resistance;
      analysis.takeProfit = levels.support;
    }

    // 9. CALCULATE RISK/REWARD
    const riskReward = this.calculateRiskReward(
      analysis.entryPrice,
      analysis.stopLoss,
      analysis.takeProfit,
      analysis.side
    );

    analysis.stopLoss = riskReward.stopLoss;
    analysis.takeProfit = riskReward.takeProfit;
    analysis.riskRewardRatio = riskReward.ratio;
    analysis.expectedWinProbability = this.estimateWinProbability(
      analysis.riskRewardRatio,
      momentumAnalysis.score
    );

    // 10. CALCULATE POSITION SIZE AND FEES
    const positionCalc = this.calculatePositionSize(
      accountValue,
      analysis.entryPrice,
      analysis.stopLoss,
      maxPositionSize
    );

    analysis.positionSize = positionCalc.size;
    analysis.riskAmount = positionCalc.riskAmount;
    analysis.rewardAmount = new Decimal(positionCalc.riskAmount)
      .times(analysis.riskRewardRatio)
      .toFixed(2);

    // 11. CALCULATE FEES
    const feeCalc = this.calculateFees(
      analysis.positionSize,
      analysis.entryPrice,
      analysis.side
    );

    analysis.tradingFees = feeCalc.totalFees;

    // 12. CALCULATE NET PROFIT
    const profitCalc = this.calculateNetProfit(
      analysis.positionSize,
      analysis.entryPrice,
      analysis.takeProfit,
      analysis.stopLoss,
      analysis.side,
      feeCalc.totalFees
    );

    analysis.netProfit = profitCalc.profit;
    analysis.netProfitPercent = profitCalc.profitPercent;
    analysis.potentialProfitPercent = profitCalc.profitPercent;
    analysis.potentialLossPercent = profitCalc.lossPercent;

    // 13. GENERATE RECOMMENDATION
    const recommendation = this.generateRecommendation(
      signals,
      analysis.riskRewardRatio,
      analysis.expectedWinProbability,
      analysis.netProfitPercent,
      volumeAnalysis.score,
      momentumAnalysis.score
    );

    analysis.recommendation = recommendation.level;
    analysis.confidence = recommendation.confidence;
    analysis.reason = recommendation.reason;
    analysis.analysis.riskRewardJustification = recommendation.riskRewardJustification;

    return analysis;
  }

  private analyzePriceAction(
    marketData: MarketData,
    _indicators: TechnicalIndicators
  ): { description: string; bullish: number; bearish: number } {
    const spread = new Decimal(marketData.ask).minus(marketData.bid);
    const mid = new Decimal(marketData.bid).plus(spread.dividedBy(2));
    const lastDecimal = new Decimal(marketData.last);

    let bullish = 0;
    let bearish = 0;

    if (lastDecimal.greaterThan(mid)) {
      bullish += 1;
    } else {
      bearish += 1;
    }

    const description =
      bullish > bearish
        ? `Price at upper end of spread (${marketData.last} vs mid ${mid.toFixed(2)})`
        : `Price at lower end of spread (${marketData.last} vs mid ${mid.toFixed(2)})`;

    return { description, bullish, bearish };
  }

  private analyzeTrend(indicators: TechnicalIndicators): {
    description: string;
    bullish: number;
    bearish: number;
  } {
    let bullish = 0;
    let bearish = 0;

    // BBands middle line acts as trend indicator
    const bbMiddle = new Decimal(indicators.bbMiddle);
    const bbUpper = new Decimal(indicators.bbUpper);
    const bbLower = new Decimal(indicators.bbLower);

    if (bbMiddle.greaterThan(bbLower)) {
      bullish += 0.5;
    } else {
      bearish += 0.5;
    }

    const description =
      bullish > bearish
        ? `Uptrend forming: Price near upper Bollinger Band`
        : `Downtrend: Price near lower Bollinger Band`;

    return { description, bullish, bearish };
  }

  private analyzeMomentum(indicators: TechnicalIndicators): {
    description: string;
    bullish: number;
    bearish: number;
    score: number;
  } {
    let bullish = 0;
    let bearish = 0;

    // RSI analysis
    if (indicators.rsi < 30) {
      bullish += 1.5; // Oversold = potential buy
    } else if (indicators.rsi > 70) {
      bearish += 1.5; // Overbought = potential sell
    } else if (indicators.rsi > 50) {
      bullish += 0.5;
    } else {
      bearish += 0.5;
    }

    // MACD analysis
    if (indicators.macd > indicators.macdSignal) {
      bullish += 1; // Bullish crossover
    } else {
      bearish += 1;
    }

    const score = bullish > bearish ? (bullish / (bullish + bearish)) : -(bearish / (bullish + bearish));
    const description =
      bullish > bearish
        ? `Bullish momentum: RSI=${indicators.rsi.toFixed(0)}, MACD bullish`
        : `Bearish momentum: RSI=${indicators.rsi.toFixed(0)}, MACD bearish`;

    return { description, bullish, bearish, score };
  }

  private analyzeVolume(indicators: TechnicalIndicators): {
    description: string;
    score: number;
  } {
    const vol = new Decimal(indicators.volume24h);
    const isHighVolume = vol.greaterThan(1000);

    const description = isHighVolume
      ? `High volume (24h: ${vol.toFixed(0)} BTC)`
      : `Low volume (24h: ${vol.toFixed(0)} BTC)`;

    const score = isHighVolume ? 1 : -0.5;

    return { description, score };
  }

  private analyzeVolatility(indicators: TechnicalIndicators): {
    description: string;
  } {
    const atr = new Decimal(indicators.atr);
    const description = atr.greaterThan(500)
      ? `High volatility (ATR: ${atr.toFixed(2)})`
      : `Normal volatility (ATR: ${atr.toFixed(2)})`;

    return { description };
  }

  private identifySupportResistance(
    _marketData: MarketData,
    indicators: TechnicalIndicators
  ): { support: string; resistance: string } {
    return {
      support: indicators.bbLower,
      resistance: indicators.bbUpper,
    };
  }

  private calculateRiskReward(
    entryPrice: string,
    supportPrice: string,
    resistancePrice: string,
    side: "buy" | "sell"
  ): { stopLoss: string; takeProfit: string; ratio: number } {
    const entry = new Decimal(entryPrice);
    const support = new Decimal(supportPrice);
    const resistance = new Decimal(resistancePrice);

    if (side === "buy") {
      const risk = entry.minus(support);
      const reward = resistance.minus(entry);
      const ratio = reward.dividedBy(risk).toNumber();
      return {
        stopLoss: support.toFixed(2),
        takeProfit: resistance.toFixed(2),
        ratio,
      };
    } else {
      const risk = resistance.minus(entry);
      const reward = entry.minus(support);
      const ratio = reward.dividedBy(risk).toNumber();
      return {
        stopLoss: resistance.toFixed(2),
        takeProfit: support.toFixed(2),
        ratio,
      };
    }
  }

  private estimateWinProbability(riskReward: number, momentumScore: number): number {
    // Higher R:R typically means lower win probability (market prices in risk)
    // Base probability: 50%
    // Adjust based on momentum
    let probability = 0.5 + momentumScore * 0.15;

    // Adjust based on R:R (better R:R = higher confidence needed)
    if (riskReward > 2) {
      probability -= 0.05;
    } else if (riskReward < 1.2) {
      probability -= 0.1;
    }

    return Math.max(0.3, Math.min(0.7, probability));
  }

  private calculatePositionSize(
    accountValue: string,
    entryPrice: string,
    stopLoss: string,
    maxPositionPercent: number
  ): { size: string; riskAmount: string } {
    const account = new Decimal(accountValue);
    const entry = new Decimal(entryPrice);
    const stop = new Decimal(stopLoss);

    const riskPerTrade = account.times(maxPositionPercent).dividedBy(100);
    const priceRisk = entry.minus(stop).abs();

    if (priceRisk.isZero()) {
      return { size: "0", riskAmount: "0" };
    }

    const baseSize = riskPerTrade.dividedBy(priceRisk);
    const sizeWithFees = baseSize.times(0.9994); // Account for 0.06% fee

    return {
      size: sizeWithFees.toFixed(8),
      riskAmount: riskPerTrade.toFixed(2),
    };
  }

  private calculateFees(
    quantity: string,
    price: string,
    _side: "buy" | "sell"
  ): { entryFee: string; exitFee: string; totalFees: string } {
    const qty = new Decimal(quantity);
    const priceDecimal = new Decimal(price);
    const notional = qty.times(priceDecimal);

    const entryFee = notional.times(this.takerFeeRate);
    const exitFee = notional.times(this.takerFeeRate);
    const totalFees = entryFee.plus(exitFee);

    return {
      entryFee: entryFee.toFixed(2),
      exitFee: exitFee.toFixed(2),
      totalFees: totalFees.toFixed(2),
    };
  }

  private calculateNetProfit(
    quantity: string,
    entryPrice: string,
    exitPrice: string,
    stopLossPrice: string,
    side: "buy" | "sell",
    fees: string
  ): { profit: string; profitPercent: number; lossPercent: number } {
    const qty = new Decimal(quantity);
    const entry = new Decimal(entryPrice);
    const exit = new Decimal(exitPrice);
    const stop = new Decimal(stopLossPrice);
    const feesDecimal = new Decimal(fees);

    let profitAtExit: Decimal;
    let profitAtStop: Decimal;

    if (side === "buy") {
      profitAtExit = exit.minus(entry).times(qty).minus(feesDecimal);
      profitAtStop = stop.minus(entry).times(qty).minus(feesDecimal);
    } else {
      profitAtExit = entry.minus(exit).times(qty).minus(feesDecimal);
      profitAtStop = entry.minus(stop).times(qty).minus(feesDecimal);
    }

    const profitPercent = profitAtExit
      .dividedBy(entry.times(qty))
      .times(100)
      .toNumber();
    const lossPercent = profitAtStop
      .dividedBy(entry.times(qty))
      .times(100)
      .toNumber();

    return {
      profit: profitAtExit.toFixed(2),
      profitPercent,
      lossPercent,
    };
  }

  private generateRecommendation(
    signals: { bullish: number; bearish: number },
    riskRewardRatio: number,
    winProbability: number,
    netProfitPercent: number,
    volumeScore: number,
    momentumScore: number
  ): {
    level: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL" | "REJECT";
    confidence: number;
    reason: string;
    riskRewardJustification: string;
  } {
    const totalScore =
      signals.bullish +
      signals.bearish +
      (riskRewardRatio > 1.5 ? 2 : -1) +
      (winProbability > 0.55 ? 1 : -1) +
      (netProfitPercent > 0 ? 1 : -2) +
      volumeScore +
      momentumScore;

    const conditions = {
      goodRR: riskRewardRatio >= 1.5,
      goodWinProb: winProbability >= 0.55,
      profitable: netProfitPercent > 0,
      highVolume: volumeScore > 0.5,
      strongMomentum: momentumScore > 0.5,
    };

    if (
      conditions.goodRR &&
      conditions.goodWinProb &&
      conditions.profitable &&
      conditions.highVolume &&
      conditions.strongMomentum
    ) {
      return {
        level: "STRONG_BUY",
        confidence: Math.min(0.9, (totalScore / 10) * 0.9),
        reason: "Excellent setup: Strong momentum, good R:R, high volume, profitable",
        riskRewardJustification: `R:R ${riskRewardRatio.toFixed(2)}:1 with ${(winProbability * 100).toFixed(0)}% win probability = ${netProfitPercent.toFixed(2)}% expected profit`,
      };
    }

    if (
      conditions.goodRR &&
      conditions.goodWinProb &&
      conditions.profitable &&
      (conditions.highVolume || conditions.strongMomentum)
    ) {
      return {
        level: "BUY",
        confidence: Math.min(0.75, (totalScore / 8) * 0.75),
        reason: "Good setup: Acceptable R:R and win probability",
        riskRewardJustification: `R:R ${riskRewardRatio.toFixed(2)}:1 justifies entry`,
      };
    }

    if (!conditions.goodRR || !conditions.goodWinProb || !conditions.profitable) {
      return {
        level: "REJECT",
        confidence: 0,
        reason: `Rejected: R:R ${riskRewardRatio.toFixed(2)}:1, Win prob ${(winProbability * 100).toFixed(0)}%, Profit ${netProfitPercent.toFixed(2)}%`,
        riskRewardJustification: "Risk/reward or profitability does not justify entry",
      };
    }

    return {
      level: "HOLD",
      confidence: 0,
      reason: "Neutral setup - neither buy nor sell conditions met",
      riskRewardJustification: "Awaiting clearer setup",
    };
  }
}
