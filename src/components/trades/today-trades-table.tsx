"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TradeRow = {
  id: number;
  ticker: string;
  profitLoss: number | null;
  riskMultiple: number | null;
  entryTime: string;
};

export function TodayTradesTable({ trades }: { trades: TradeRow[] }) {
  const router = useRouter();

  if (trades.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Side</TableHead>
            <TableHead className="text-right">Profit/Loss</TableHead>
            <TableHead className="text-right">Risk</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-xs text-muted-foreground"
            >
              No trades today.{" "}
              <a
                href="/trades/new"
                className="text-foreground underline"
              >
                Add a trade
              </a>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Side</TableHead>
          <TableHead className="text-right">Profit/Loss</TableHead>
          <TableHead className="text-right">Risk</TableHead>
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => {
          const isProfit =
            trade.profitLoss != null && trade.profitLoss >= 0;
          return (
            <TableRow
              key={trade.id}
              className={`cursor-pointer ${isProfit ? "bg-profit/[0.03]" : "bg-loss/[0.03]"}`}
              onClick={() => router.push(`/trades/${trade.id}`)}
            >
              <TableCell className="font-semibold">
                {trade.ticker}
              </TableCell>
              <TableCell className="text-profit">Long</TableCell>
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
                {trade.riskMultiple != null
                  ? `${trade.riskMultiple}R`
                  : "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {new Date(trade.entryTime).toLocaleTimeString("en-US", {
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
  );
}
