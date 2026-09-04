/**
 * Main entry point for the trading system
 */

export { TradingOrchestrator } from "./orchestrator.js";
export { AITradingBrain } from "./ai-brain.js";
export { TradingEngine } from "./trading-engine.js";
export { TradeRecorder } from "./trade-recorder.js";
export { TechnicalAnalyzer } from "./technical-analyzer.js";
export { loadConfig } from "./config.js";

export type { TradingConfig } from "./config.js";
export type {
  MarketData,
  TechnicalIndicators,
  TradingOpportunity,
  TradingDecision,
  ExecutedTrade,
  RiskAnalysis,
} from "./types.js";
