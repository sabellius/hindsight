"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Trade = {
  id: number;
  ticker: string;
  side: string;
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  profitLoss: number | null;
  profitLossPercent: number | null;
  riskMultiple: number | null;
  conviction: string | null;
  processGrade: string | null;
  notes: string | null;
};

interface TradeListTableProps {
  data: Trade[];
  sortField: string;
  sortDir: string;
}

const columns: { key: string; label: string; className?: string }[] = [
  { key: "ticker", label: "Ticker" },
  { key: "side", label: "Side" },
  { key: "entryPrice", label: "Entry", className: "text-right" },
  { key: "exitPrice", label: "Exit", className: "text-right" },
  { key: "quantity", label: "Qty", className: "text-right" },
  { key: "profitLoss", label: "Profit/Loss", className: "text-right" },
  { key: "riskMultiple", label: "Risk", className: "text-right" },
  { key: "entryTime", label: "Time", className: "text-right" },
];

export function TradeListTable({ data, sortField, sortDir }: TradeListTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSort(key: string) {
    const dir = sortField === key && sortDir === "desc" ? "asc" : "desc";
    router.push(`${pathname}?sort=${key}&dir=${dir}`);
  }

  const sorted = [...data].sort((a, b) => {
    const key = sortField as keyof Trade;
    const aVal = a[key];
    const bVal = b[key];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    let cmp = 0;
    if (aVal instanceof Date && bVal instanceof Date) {
      cmp = aVal.getTime() - bVal.getTime();
    } else if (typeof aVal === "number" && typeof bVal === "number") {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={`cursor-pointer select-none ${col.className ?? ""}`}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {sortField === col.key && (
                  <span className="ml-1 text-muted-foreground">
                    {sortDir === "desc" ? "↓" : "↑"}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((trade) => {
            const isProfit = trade.profitLoss != null && trade.profitLoss >= 0;
            return (
              <TableRow
                key={trade.id}
                className={`cursor-pointer ${isProfit ? "bg-profit/[0.03]" : "bg-loss/[0.03]"}`}
                onClick={() => router.push(`/trades/${trade.id}`)}
              >
                <TableCell className="font-semibold">{trade.ticker}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      trade.side === "long"
                        ? "border-profit/30 bg-profit-surface text-profit"
                        : "border-loss/30 bg-loss-surface text-loss"
                    }
                  >
                    Long
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${trade.entryPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${trade.exitPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {trade.quantity}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums font-semibold ${isProfit ? "text-profit" : "text-loss"}`}
                >
                  {trade.profitLoss != null
                    ? `${isProfit ? "+" : ""}$${trade.profitLoss.toFixed(2)}`
                    : "—"}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${isProfit ? "text-profit" : "text-loss"}`}
                >
                  {trade.riskMultiple != null ? `${trade.riskMultiple}R` : "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {trade.entryTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
