import { roundToCents } from "@/lib/format";
import type { AppDatabase } from "@/server/db";
import { settings } from "@/server/db/schema";

export type RiskParameters = {
  capital: number;
  riskPerTradePercent: number;
  maxDailyLossPercent: number;
};

export const DEFAULT_RISK_PARAMETERS: RiskParameters = {
  capital: 27000,
  riskPerTradePercent: 1,
  maxDailyLossPercent: 3,
};

const KEYS = {
  capital: "risk_capital",
  riskPerTradePercent: "risk_per_trade_percent",
  maxDailyLossPercent: "max_daily_loss_percent",
} as const;

export function getRiskParameters(
  database: Pick<AppDatabase, "select">,
): RiskParameters {
  const rows = database.select().from(settings).all();
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  const capital = Number(stored.get(KEYS.capital));
  const riskPerTradePercent = Number(stored.get(KEYS.riskPerTradePercent));
  const maxDailyLossPercent = Number(stored.get(KEYS.maxDailyLossPercent));

  return {
    capital: Number.isFinite(capital)
      ? capital
      : DEFAULT_RISK_PARAMETERS.capital,
    riskPerTradePercent: Number.isFinite(riskPerTradePercent)
      ? riskPerTradePercent
      : DEFAULT_RISK_PARAMETERS.riskPerTradePercent,
    maxDailyLossPercent: Number.isFinite(maxDailyLossPercent)
      ? maxDailyLossPercent
      : DEFAULT_RISK_PARAMETERS.maxDailyLossPercent,
  };
}

export function riskPerTradeAmount(parameters: RiskParameters): number {
  return roundToCents(
    (parameters.capital * parameters.riskPerTradePercent) / 100,
  );
}

export function maxDailyLossAmount(parameters: RiskParameters): number {
  return roundToCents(
    (parameters.capital * parameters.maxDailyLossPercent) / 100,
  );
}
