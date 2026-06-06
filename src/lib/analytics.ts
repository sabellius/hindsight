import { sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";

export async function getAnalyticsData(days: number, accountId: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const allTrades = await db
    .select()
    .from(trades)
    .where(sql`${trades.entryTime} >= ${since.getTime()} AND ${trades.accountId} = ${accountId}`)
    .orderBy(desc(trades.entryTime));

  const totalTrades = allTrades.length;
  const winners = allTrades.filter(
    (t) => t.profitLoss != null && t.profitLoss > 0,
  );
  const losers = allTrades.filter(
    (t) => t.profitLoss != null && t.profitLoss < 0,
  );
  const winRate = totalTrades > 0 ? (winners.length / totalTrades) * 100 : 0;

  const totalProfit = winners.reduce(
    (sum, t) => sum + (t.profitLoss ?? 0),
    0,
  );
  const totalLoss = Math.abs(
    losers.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0),
  );
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

  const avgWinner =
    winners.length > 0 ? totalProfit / winners.length : 0;
  const avgLoser = losers.length > 0 ? totalLoss / losers.length : 0;

  const equityCurve = buildEquityCurve(allTrades);
  const byStrategy = groupByStrategy(allTrades);
  const byDayOfWeek = groupByDayOfWeek(allTrades);
  const byHour = groupByHour(allTrades);
  const riskDistribution = buildRiskDistribution(allTrades);
  const streaks = buildStreaks(allTrades);
  const drawdown = buildDrawdown(allTrades);

  return {
    totalTrades,
    winRate,
    profitFactor,
    avgWinner,
    avgLoser,
    equityCurve,
    byStrategy,
    byDayOfWeek,
    byHour,
    riskDistribution,
    streaks,
    drawdown,
  };
}

export function buildEquityCurve(
  tradeList: (typeof trades.$inferSelect)[],
) {
  let cumulative = 0;
  return tradeList
    .sort(
      (a, b) =>
        new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime(),
    )
    .map((t) => {
      cumulative += t.profitLoss ?? 0;
      return {
        date: new Date(t.entryTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: Math.round(cumulative * 100) / 100,
        profitLoss: t.profitLoss ?? 0,
      };
    });
}

function groupByStrategy(
  tradeList: (typeof trades.$inferSelect)[],
) {
  const map = new Map<
    string,
    { total: number; wins: number }
  >();
  for (const t of tradeList) {
    const key = "Unassigned";
    const entry = map.get(key) ?? { total: 0, wins: 0 };
    entry.total++;
    if (t.profitLoss != null && t.profitLoss > 0) entry.wins++;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([name, { total, wins }]) => ({
      name,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

function groupByDayOfWeek(
  tradeList: (typeof trades.$inferSelect)[],
) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const map = new Map<string, number>();
  for (const d of days) map.set(d, 0);

  for (const t of tradeList) {
    const day = days[new Date(t.entryTime).getDay() - 1];
    if (day) map.set(day, (map.get(day) ?? 0) + (t.profitLoss ?? 0));
  }
  return days.map((name) => ({
    name,
    value: Math.round((map.get(name) ?? 0) * 100) / 100,
  }));
}

function groupByHour(
  tradeList: (typeof trades.$inferSelect)[],
) {
  const hours: { hour: string; value: number; count: number }[] = [];
  for (let h = 16; h <= 23; h++) {
    const label = `${h}:00`;
    const tradesInHour = tradeList.filter(
      (t) => new Date(t.entryTime).getHours() === h,
    );
    hours.push({
      hour: label,
      value: tradesInHour.reduce(
        (sum, t) => sum + (t.profitLoss ?? 0),
        0,
      ),
      count: tradesInHour.length,
    });
  }
  return hours;
}

function buildRiskDistribution(
  tradeList: (typeof trades.$inferSelect)[],
) {
  const buckets = [
    { label: "<-2R", min: -Infinity, max: -2 },
    { label: "-2R", min: -2, max: -1 },
    { label: "-1R", min: -1, max: 0 },
    { label: "0", min: 0, max: 0.01 },
    { label: "1R", min: 0.01, max: 1 },
    { label: "2R", min: 1, max: 2 },
    { label: "3R+", min: 2, max: Infinity },
  ];

  return buckets.map((b) => ({
    label: b.label,
    count: tradeList.filter(
      (t) => t.riskMultiple != null && t.riskMultiple >= b.min && t.riskMultiple < b.max,
    ).length,
    isPositive: b.min >= 0,
  }));
}

function buildStreaks(tradeList: (typeof trades.$inferSelect)[]) {
  return tradeList
    .sort(
      (a, b) =>
        new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime(),
    )
    .map((t) => ({
      isWin: t.profitLoss != null && t.profitLoss > 0,
      ticker: t.ticker,
    }));
}

function buildDrawdown(tradeList: (typeof trades.$inferSelect)[]) {
  let peak = 0;
  let cumulative = 0;
  const points: { date: string; drawdown: number }[] = [];

  const sorted = [...tradeList].sort(
    (a, b) =>
      new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime(),
  );

  for (const t of sorted) {
    cumulative += t.profitLoss ?? 0;
    if (cumulative > peak) peak = cumulative;
    points.push({
      date: new Date(t.entryTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      drawdown: Math.round((cumulative - peak) * 100) / 100,
    });
  }
  return points;
}
