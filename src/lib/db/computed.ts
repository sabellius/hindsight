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
