export type TradeDetailTrade = {
  id: number;
  ticker: string;
  side: string;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss: number | null;
  target: number | null;
  commission: number;
  profitLoss: number | null;
  profitLossPercent: number | null;
  riskMultiple: number | null;
  conviction: string | null;
  processGrade: string | null;
  notes: string | null;
};

export type TradeDetailExecution = {
  id: number;
  tradeId: number;
  side: string;
  price: number;
  quantity: number;
  timestamp: number;
  commission: number;
  createdAt: number;
};
