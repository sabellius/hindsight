"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  type IChartApi,
  type Time,
  type SeriesMarker,
  ColorType,
  LineStyle,
} from "lightweight-charts";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type TradeChartProps = {
  candles: Candle[];
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number | null;
  target: number | null;
};

function findClosestCandleIndex(candles: Candle[], timestamp: number): number {
  let closest = 0;
  let minDiff = Infinity;
  for (let i = 0; i < candles.length; i++) {
    const diff = Math.abs(candles[i].time - timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = i;
    }
  }
  return closest;
}

export function TradeChart({
  candles,
  entryTime,
  exitTime,
  entryPrice,
  exitPrice,
  stopLoss,
  target,
}: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111111" },
        textColor: "#666666",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.1)" },
        horzLine: { color: "rgba(255,255,255,0.1)" },
      },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderUpColor: "#22C55E",
      borderDownColor: "#EF4444",
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
    });

    const chartData = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(chartData);

    const entryIdx = findClosestCandleIndex(candles, entryTime);
    const exitIdx = findClosestCandleIndex(candles, exitTime);

    const markers: SeriesMarker<Time>[] = [
      {
        time: candles[entryIdx].time as Time,
        position: "belowBar",
        color: "#22C55E",
        shape: "arrowUp",
        text: `Entry $${entryPrice.toFixed(2)}`,
      },
      {
        time: candles[exitIdx].time as Time,
        position: exitPrice >= entryPrice ? "aboveBar" : "belowBar",
        color: exitPrice >= entryPrice ? "#22C55E" : "#EF4444",
        shape: exitPrice >= entryPrice ? "arrowUp" : "arrowDown",
        text: `Exit $${exitPrice.toFixed(2)}`,
      },
    ];
    createSeriesMarkers(series, markers);

    if (stopLoss != null) {
      series.createPriceLine({
        price: stopLoss,
        color: "#EF4444",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Stop",
      });
    }

    if (target != null) {
      series.createPriceLine({
        price: target,
        color: "#22C55E",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "Target",
      });
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, entryTime, exitTime, entryPrice, exitPrice, stopLoss, target]);

  if (candles.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
        No chart data available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden"
      style={{ height: 240 }}
    />
  );
}
