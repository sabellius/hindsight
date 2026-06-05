"use client";

import { useEffect, useState } from "react";
import { TradeChart } from "./trade-chart";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type TradeChartLoaderProps = {
  ticker: string;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number | null;
  target: number | null;
};

export function TradeChartLoader({
  ticker,
  entryTime,
  exitTime,
  entryPrice,
  exitPrice,
  stopLoss,
  target,
}: TradeChartLoaderProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const durationMilliseconds = exitTime - entryTime;
    const interval =
      durationMilliseconds <= 30 * 60 * 1000
        ? "1min"
        : durationMilliseconds <= 2 * 60 * 60 * 1000
          ? "5min"
          : "15min";

    fetch(
      `/api/charts/${ticker}?entry_time=${entryTime}&exit_time=${exitTime}&interval=${interval}`,
    )
      .then((response) => response.json())
      .then((data) => {
        setCandles(data.candles ?? []);
      })
      .catch(() => setCandles([]))
      .finally(() => setLoading(false));
  }, [ticker, entryTime, exitTime]);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center rounded-lg border border-border bg-secondary">
        <p className="text-xs text-muted-foreground">Loading chart...</p>
      </div>
    );
  }

  return (
    <TradeChart
      candles={candles}
      entryTime={Math.floor(entryTime / 1000)}
      exitTime={Math.floor(exitTime / 1000)}
      entryPrice={entryPrice}
      exitPrice={exitPrice}
      stopLoss={stopLoss}
      target={target}
    />
  );
}
