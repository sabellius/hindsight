import { Factory } from "fishery";
import type { trades } from "@/server/db/schema";

type TradeInsert = typeof trades.$inferInsert;

const tickers = ["AAPL", "MSFT", "NVDA"];

export const tradeFactory = Factory.define<TradeInsert>(({ sequence }) => ({
  accountId: 1,
  ticker: tickers[sequence % tickers.length],
  side: "long",
  strategyId: null,
  entryTime: new Date("2026-01-05T15:30:00Z"),
  exitTime: new Date("2026-01-05T16:30:00Z"),
  entryPrice: 100,
  exitPrice: 105,
  quantity: 10,
  stopLoss: 98,
  target: null,
  commission: 0,
  profitLoss: 50,
  profitLossPercent: 5,
  riskMultiple: 2.5,
  conviction: null,
  processGrade: null,
  notes: null,
  ibkrOrderId: null,
  createdAt: new Date("2026-01-05T15:30:00Z"),
}));
