"use client";

import { Badge } from "@/components/ui/badge";
import {
  formatPercent,
  formatShortDateWithYear,
  formatSignedCurrency,
  formatTime,
} from "@/lib/format";
import type { TradeDetailTrade } from "./trade-detail-types";

export function TradeDetailHeader({ trade }: { trade: TradeDetailTrade }) {
  const isProfit = trade.profitLoss != null && trade.profitLoss >= 0;
  const profitLossColor = isProfit ? "text-profit" : "text-loss";
  const durationMinutes = Math.round(
    (trade.exitTime - trade.entryTime) / 60000,
  );

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-foreground">
            {trade.ticker}
          </h1>
          <Badge
            variant="secondary"
            className="border-profit/30 bg-profit-surface text-profit"
          >
            Long
          </Badge>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${profitLossColor}`}>
            {trade.profitLoss != null
              ? formatSignedCurrency(trade.profitLoss)
              : "—"}
          </div>
          {trade.profitLossPercent != null && (
            <div className={`text-xs ${profitLossColor}`}>
              {isProfit ? "+" : ""}
              {formatPercent(trade.profitLossPercent, 2)}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {formatShortDateWithYear(trade.entryTime)} &middot;{" "}
        {formatTime(trade.entryTime)} – {formatTime(trade.exitTime)} &middot;{" "}
        {durationMinutes}min
      </div>
    </>
  );
}
