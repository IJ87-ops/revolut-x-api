/**
 * Technical indicators calculator
 * Computes RSI, MACD, Bollinger Bands, ATR from candle data
 */

import type { Candle } from "@revolut/revolut-x-api";
import Decimal from "decimal.js";
import type { TechnicalIndicators } from "./types.js";

export class TechnicalAnalyzer {
  /**
   * Calculate RSI (Relative Strength Index)
   * Returns 0-100, >70 overbought, <30 oversold
   */
  static calculateRSI(closes: string[], period: number = 14): number {
    if (closes.length < period + 1) return 50; // neutral if not enough data

    const prices = closes.map((c) => new Decimal(c));
    let gains = new Decimal(0);
    let losses = new Decimal(0);

    for (let i = 1; i <= period; i++) {
      const change = prices[closes.length - period - 1 + i].minus(
        prices[closes.length - period - i]
      );
      if (change.greaterThan(0)) {
        gains = gains.plus(change);
      } else {
        losses = losses.plus(change.abs());
      }
    }

    const avgGain = gains.dividedBy(period);
    const avgLoss = losses.dividedBy(period);

    if (avgLoss.isZero()) return 100;
    if (avgGain.isZero()) return 0;

    const rs = avgGain.dividedBy(avgLoss);
    const rsi = new Decimal(100).minus(
      new Decimal(100).dividedBy(rs.plus(1))
    );

    return Math.min(100, Math.max(0, rsi.toNumber()));
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(
    closes: string[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): { macd: number; signal: number; histogram: number } {
    if (closes.length < slowPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const prices = closes.map((c) => new Decimal(c));
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);

    const macdLine = ema12.minus(ema26).toNumber();
    const signal = this.calculateEMASingle([macdLine], signalPeriod).toNumber();

    return {
      macd: macdLine,
      signal,
      histogram: macdLine - signal,
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(
    closes: string[],
    period: number = 20,
    stdDevMultiplier: number = 2
  ): { upper: string; middle: string; lower: string } {
    if (closes.length < period) {
      return {
        upper: closes[closes.length - 1] || "0",
        middle: closes[closes.length - 1] || "0",
        lower: closes[closes.length - 1] || "0",
      };
    }

    const prices = closes
      .slice(-period)
      .map((c) => new Decimal(c));

    const sma = prices.reduce((a, b) => a.plus(b)).dividedBy(period);

    let variance = new Decimal(0);
    for (const price of prices) {
      variance = variance.plus(price.minus(sma).pow(2));
    }
    variance = variance.dividedBy(period);

    const stdDev = variance.sqrt().times(stdDevMultiplier);

    return {
      upper: sma.plus(stdDev).toFixed(2),
      middle: sma.toFixed(2),
      lower: sma.minus(stdDev).toFixed(2),
    };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  static calculateATR(candles: Candle[], period: number = 14): string {
    if (candles.length < period) {
      return "0";
    }

    let trueRanges: Decimal[] = [];

    for (let i = 1; i < candles.length; i++) {
      const curr = candles[i];
      const prev = candles[i - 1];

      const high = new Decimal(curr.high);
      const low = new Decimal(curr.low);
      const prevClose = new Decimal(prev.close);

      const tr1 = high.minus(low);
      const tr2 = high.minus(prevClose).abs();
      const tr3 = low.minus(prevClose).abs();

      const tr = Decimal.max(tr1, tr2, tr3);
      trueRanges.push(tr);
    }

    if (trueRanges.length < period) {
      return "0";
    }

    const atr = trueRanges
      .slice(-period)
      .reduce((a, b) => a.plus(b))
      .dividedBy(period);

    return atr.toFixed(2);
  }

  /**
   * Calculate 24h volume
   */
  static calculate24hVolume(candles: Candle[]): string {
    if (candles.length === 0) return "0";

    const volume = candles
      .reduce((sum, candle) => sum.plus(new Decimal(candle.volume)), new Decimal(0));

    return volume.toFixed(2);
  }

  /**
   * Compute all indicators for a symbol
   */
  static computeIndicators(candles: Candle[]): TechnicalIndicators {
    const closes = candles.map((c) => c.close);

    const rsi = this.calculateRSI(closes, 14);
    const { macd, signal } = this.calculateMACD(closes, 12, 26, 9);
    const { upper, middle, lower } = this.calculateBollingerBands(closes, 20, 2);
    const atr = this.calculateATR(candles, 14);
    const volume24h = this.calculate24hVolume(candles);

    return {
      rsi,
      macd,
      macdSignal: signal,
      bbUpper: upper,
      bbMiddle: middle,
      bbLower: lower,
      atr,
      volume24h,
    };
  }

  private static calculateEMA(prices: Decimal[], period: number): Decimal {
    if (prices.length < period) {
      return prices.reduce((a, b) => a.plus(b)).dividedBy(prices.length);
    }

    const k = new Decimal(2).dividedBy(period + 1);
    let ema = prices
      .slice(0, period)
      .reduce((a, b) => a.plus(b))
      .dividedBy(period);

    for (let i = period; i < prices.length; i++) {
      ema = prices[i].times(k).plus(ema.times(new Decimal(1).minus(k)));
    }

    return ema;
  }

  private static calculateEMASingle(values: number[], period: number): Decimal {
    if (values.length === 0) return new Decimal(0);

    const k = new Decimal(2).dividedBy(period + 1);
    let ema = new Decimal(values[0]);

    for (let i = 1; i < values.length; i++) {
      ema = new Decimal(values[i])
        .times(k)
        .plus(ema.times(new Decimal(1).minus(k)));
    }

    return ema;
  }
}
