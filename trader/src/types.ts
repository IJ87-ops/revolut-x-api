/**
 * Type definitions for the enhanced trading engine
 */

export interface MarketData {
  symbol?: string;
  bid: string;
  ask: string;
  last: string;
  volume24h?: string;
  high24h?: string;
  low24h?: string;
  timestamp?: Date | number;
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
  orderId?: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: string;
  entryPrice: string;
  exitPrice: string | null;
  filledPrice?: string;
  riskRewardRatio: number;
  expectedWinProbability: number;
  stopLoss: string;
  takeProfit: string;
  entryFees: string;
  exitFees: string | null;
  pnl: string | null;
  pnlPercent: number | null;
  aiReasoning: string;
  status: "open" | "closed" | "cancelled";
  timestamp?: number;
  createdAt: Date;
  closedAt: Date | null;
  updatedAt: Date;
  mode: "paper" | "live";
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

export interface TradeRecord {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  entryPrice: string;
  exitPrice: string | null;
  quantity: string;
  entryFees: string;
  exitFees: string | null;
  profitLoss: string | null;
  profitLossPercent: number | null;
  status: "open" | "closed";
  reason: string;
  aiAnalysis: string;
  createdAt: Date;
  closedAt: Date | null;
  mode: "paper" | "live";
}

export interface SessionMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // 0-1
  totalProfit: string;
  totalLoss: string;
  netProfit: string;
  averageWin: string;
  averageLoss: string;
  profitFactor: number; // Total wins / Total losses
  riskRewardRatio: number; // Average reward / Average risk
}
