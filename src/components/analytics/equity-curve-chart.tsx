"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type EquityPoint = {
  date: string;
  value: number;
};

export function EquityCurveChart({ data }: { data: EquityPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center">
        <p className="text-xs text-muted-foreground">
          No data yet. Start logging trades.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="dashboardEquityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
        <YAxis tick={{ fill: "#666", fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            fontSize: 11,
          }}
          labelStyle={{ color: "#666" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#22C55E"
          fill="url(#dashboardEquityGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
