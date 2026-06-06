type Execution = {
  side: "buy" | "sell";
  price: number;
  quantity: number;
  commission: number;
  timestamp: number;
};

function weightedAverage(items: { price: number; quantity: number }[]): number {
  const totalQuantity = items.reduce((s, e) => s + e.quantity, 0);
  if (totalQuantity === 0) return 0;
  return items.reduce((s, e) => s + e.price * e.quantity, 0) / totalQuantity;
}

export function computeTradeMetricsFromExecutions(
  executions: Execution[],
  stopLoss: number | null,
) {
  const buys = executions.filter((e) => e.side === "buy");
  const sells = executions.filter((e) => e.side === "sell");

  const totalBuyQty = buys.reduce((s, e) => s + e.quantity, 0);
  const totalCommission = executions.reduce((s, e) => s + e.commission, 0);

  const entryPrice = weightedAverage(buys);
  const exitPrice = weightedAverage(sells);
  const quantity = totalBuyQty;
  const entryTime = buys.length > 0 ? Math.min(...buys.map((e) => e.timestamp)) : 0;
  const exitTime = sells.length > 0 ? Math.max(...sells.map((e) => e.timestamp)) : 0;

  const profitLoss =
    (exitPrice - entryPrice) * quantity - totalCommission;

  const profitLossPercent =
    Math.round(((exitPrice - entryPrice) / entryPrice) * 100 * 100) / 100;

  let riskMultiple: number | null = null;
  if (stopLoss != null && stopLoss !== entryPrice) {
    riskMultiple =
      Math.round(
        ((exitPrice - entryPrice) / (entryPrice - stopLoss)) * 100,
      ) / 100;
  }

  return {
    entryPrice,
    exitPrice,
    quantity,
    entryTime,
    exitTime,
    commission: totalCommission,
    profitLoss,
    profitLossPercent,
    riskMultiple,
  };
}

export function computeTradeMetrics(data: {
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  commission: number;
  stopLoss: number | null;
}) {
  const profitLoss =
    (data.exitPrice - data.entryPrice) * data.quantity - data.commission;

  const profitLossPercent =
    Math.round(
      ((data.exitPrice - data.entryPrice) / data.entryPrice) * 100 * 100,
    ) / 100;

  let riskMultiple: number | null = null;
  if (data.stopLoss != null && data.stopLoss !== data.entryPrice) {
    riskMultiple =
      Math.round(
        ((data.exitPrice - data.entryPrice) /
          (data.entryPrice - data.stopLoss)) *
          100,
      ) / 100;
  }

  return { profitLoss, profitLossPercent, riskMultiple };
}
