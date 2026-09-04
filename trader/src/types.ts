/**
 * Type definitions for the trading engine
 */

export interface MarketData {
  symbol: string;
  bid: string;
  ask: string;
  last: string;
  timestamp: number;
}

export interface TechnicalIndicators {
  rsi: number; // 0-100
  macd: number;
  macdSignal: number;
  bbUpper: string;
  bbMiddle: string;
  bbLower: string;
  atr: string;
  volume24h: string;
}

export interface TradingOpportunity {
  symbol: string;
  side: "buy" | "sell";
  confidence: number; // 0-1
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  reasoning: string;
  technicalIndicators: TechnicalIndicators;
  marketContext: string;
}

export interface TradingDecision {
  id: string;
  timestamp: number;
  symbol: string;
  side: "buy" | "sell";
  entryPrice: string;
  quantity: string;
  riskRewardRatio: number;
  expectedWinProbability: number;
  reasoning: string;
  maxLoss: string;
  maxGain: string;
}

export interface ExecutedTrade {
  id: string;
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: string;
  filledPrice: string;
  timestamp: number;
  exitPrice?: string;
  closedAt?: number;
  status: "open" | "closed" | "cancelled";
}

export interface RiskAnalysis {
  accountRisk: number; // % of account at risk
  positionSize: string;
  riskAmount: string;
  rewardAmount: string;
  riskRewardRatio: number;
  isAcceptable: boolean;
  reason: string;
}
