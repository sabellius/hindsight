"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AnalyticsData = Awaited<ReturnType<typeof import("@/lib/analytics").getAnalyticsData>>;

interface AnalyticsChartsProps {
  data: AnalyticsData;
  days: number;
}

function MetricCard({
  title,
  value,
  className,
}: {
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-lg font-bold ${className ?? "text-foreground"}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts({ data, days }: AnalyticsChartsProps) {
  const rangeLabel = days <= 7 ? "7D" : days <= 30 ? "30D" : "All";
  const ranges = [
    { label: "7D", value: 7 },
    { label: "30D", value: 30 },
    { label: "All", value: 365 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Analytics</h1>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <a
              key={r.label}
              href={`/analytics?range=${r.label.toLowerCase()}`}
              className={`rounded px-2 py-1 text-xs ${
                r.label === rangeLabel
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {r.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Win Rate"
          value={data.totalTrades > 0 ? `${data.winRate.toFixed(1)}%` : "—"}
        />
        <MetricCard
          title="Profit Factor"
          value={data.profitFactor > 0 ? data.profitFactor.toFixed(2) : "—"}
        />
        <MetricCard
          title="Avg Winner"
          value={data.avgWinner > 0 ? `$${data.avgWinner.toFixed(0)}` : "—"}
          className="text-profit"
        />
        <MetricCard
          title="Avg Loser"
          value={data.avgLoser > 0 ? `-$${data.avgLoser.toFixed(0)}` : "—"}
          className="text-loss"
        />
      </div>

      {data.totalTrades === 0 ? (
        <Card className="flex h-64 items-center justify-center">
          <p className="text-xs text-muted-foreground">
            No trades in this period. Start logging trades to see analytics.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                Equity Curve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.equityCurve}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#equityGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                  Profit/Loss by Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.byDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.byDayOfWeek.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.value >= 0 ? "#22C55E" : "#EF4444"}
                          fillOpacity={0.7}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                  Risk Multiple Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" tick={{ fill: "#666", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#666", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.riskDistribution.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.isPositive ? "#22C55E" : "#EF4444"}
                          fillOpacity={0.7}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                  Hourly Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {data.byHour.map((h) => (
                    <div
                      key={h.hour}
                      className="flex flex-col items-center gap-1 rounded-lg p-3"
                      style={{
                        backgroundColor:
                          h.value > 0
                            ? `rgba(34, 197, 94, ${Math.min(h.value / 200, 0.5)})`
                            : h.value < 0
                              ? `rgba(239, 68, 68, ${Math.min(Math.abs(h.value) / 200, 0.5)})`
                              : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <span className="text-[10px] text-muted-foreground">{h.hour}</span>
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          h.value >= 0 ? "text-profit" : "text-loss"
                        }`}
                      >
                        ${h.value.toFixed(0)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{h.count} trades</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                  Streak Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {data.streaks.map((s, i) => (
                    <div
                      key={i}
                      className="h-4 w-4 rounded-sm"
                      style={{
                        backgroundColor: s.isWin
                          ? "rgba(34, 197, 94, 0.7)"
                          : "rgba(239, 68, 68, 0.7)",
                      }}
                      title={`${s.ticker}: ${s.isWin ? "Win" : "Loss"}`}
                    />
                  ))}
                </div>
                {data.streaks.length === 0 && (
                  <p className="text-xs text-muted-foreground">No trades yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                Drawdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={data.drawdown}>
                  <defs>
                    <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.3} />
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
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#EF4444"
                    fill="url(#drawdownGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
