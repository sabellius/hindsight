"use client";

import {
  formatCurrency,
  formatRiskMultiple,
  formatSignedCurrency,
} from "@/lib/format";
import type { TradeDetailTrade } from "./trade-detail-types";

function FieldCard({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary p-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        className={`text-sm font-semibold ${className ?? "text-foreground"}`}
      >
        {children}
      </div>
    </div>
  );
}

function GradeBadge({ grade, label }: { grade: string | null; label: string }) {
  if (!grade) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary p-2 text-center">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-sm text-muted-foreground">—</span>
      </div>
    );
  }
  const color =
    grade === "A"
      ? "border-profit/40 bg-profit-surface text-profit"
      : grade === "B"
        ? "border-border bg-secondary text-foreground"
        : "border-loss/40 bg-loss-surface text-loss";
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border p-2 text-center ${color}`}
    >
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-bold">{grade}</span>
    </div>
  );
}

export function TradeDetailSummary({ trade }: { trade: TradeDetailTrade }) {
  const isProfit = trade.profitLoss != null && trade.profitLoss >= 0;
  const profitLossColor = isProfit ? "text-profit" : "text-loss";

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <FieldCard label="Entry">{formatCurrency(trade.entryPrice)}</FieldCard>
        <FieldCard label="Exit">{formatCurrency(trade.exitPrice)}</FieldCard>
        <FieldCard label="Quantity">{trade.quantity}</FieldCard>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <FieldCard label="Stop" className="text-loss">
          {trade.stopLoss != null ? formatCurrency(trade.stopLoss) : "—"}
        </FieldCard>
        <FieldCard label="Target" className="text-profit">
          {trade.target != null ? formatCurrency(trade.target) : "—"}
        </FieldCard>
        <FieldCard label="Risk Multiple" className={profitLossColor}>
          {trade.riskMultiple != null
            ? formatRiskMultiple(trade.riskMultiple)
            : "—"}
        </FieldCard>
        <FieldCard label="Commission">
          {formatCurrency(trade.commission)}
        </FieldCard>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <GradeBadge grade={trade.conviction} label="Conviction" />
        <GradeBadge grade={trade.processGrade} label="Process" />
        <FieldCard label="Net Profit/Loss" className={profitLossColor}>
          {trade.profitLoss != null
            ? formatSignedCurrency(trade.profitLoss)
            : "—"}
        </FieldCard>
      </div>

      {trade.notes && (
        <div className="rounded-lg border border-border bg-secondary p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            Notes
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {trade.notes}
          </p>
        </div>
      )}
    </>
  );
}
