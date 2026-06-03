import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TodayTradesTable } from "@/components/trades/today-trades-table";
import { EquityCurveChart } from "@/components/analytics/equity-curve-chart";

import { getActiveAccountId } from "@/lib/auth";

export default async function HomePage() {
  const accountId = await getActiveAccountId();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayTrades = await db
    .select()
    .from(trades)
    .where(
      sql`${trades.accountId} = ${accountId} AND ${trades.entryTime} >= ${todayStart.getTime()}`,
    )
    .orderBy(desc(trades.entryTime));

  const last30 = await db
    .select()
    .from(trades)
    .where(
      sql`${trades.accountId} = ${accountId} AND ${trades.entryTime} >= ${new Date(Date.now() - 30 * 86400000).getTime()}`,
    )
    .orderBy(desc(trades.entryTime));

  const todayProfitLoss = todayTrades.reduce(
    (sum, t) => sum + (t.profitLoss ?? 0),
    0,
  );
  const todayWinners = todayTrades.filter(
    (t) => t.profitLoss != null && t.profitLoss > 0,
  );
  const todayWinRate =
    todayTrades.length > 0
      ? Math.round((todayWinners.length / todayTrades.length) * 100)
      : null;

  const last30Winners = last30.filter(
    (t) => t.profitLoss != null && t.profitLoss > 0,
  );
  const last30AvgRisk =
    last30.filter((t) => t.riskMultiple != null).length > 0
      ? (
          last30
            .filter((t) => t.riskMultiple != null)
            .reduce((sum, t) => sum + (t.riskMultiple ?? 0), 0) /
          last30.filter((t) => t.riskMultiple != null).length
        ).toFixed(1)
      : null;

  const streak = computeStreak(last30);

  const isProfit = todayProfitLoss >= 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="grid grid-cols-[45fr_55fr] gap-6">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                  Today&apos;s Profit/Loss
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-lg font-bold ${
                    todayTrades.length > 0
                      ? isProfit
                        ? "text-profit"
                        : "text-loss"
                      : "text-foreground"
                  }`}
                >
                  {todayTrades.length > 0
                    ? `${isProfit ? "+" : ""}$${todayProfitLoss.toFixed(2)}`
                    : "$0.00"}
                </div>
                {todayTrades.length > 0 && (() => {
                  const totalProfitLoss = todayTrades.reduce((s, t) => s + (t.profitLoss ?? 0), 0);
                  const totalCost = todayTrades.reduce((s, t) => s + t.entryPrice * t.quantity, 0);
                  const percentReturn = totalCost > 0 ? ((totalProfitLoss / totalCost) * 100).toFixed(2) : "0.00";
                  return (
                    <p className={`mt-0.5 text-xs ${isProfit ? "text-profit" : "text-loss"}`}>
                      {isProfit ? "+" : ""}
                      {percentReturn}%
                    </p>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                  Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">
                  {todayWinRate != null ? `${todayWinRate}%` : "—"}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {todayTrades.length} trade{todayTrades.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">
                  {streak ? `${streak.count}${streak.type}` : "—"}
                </div>
                {streak && (
                  <p
                    className={`mt-0.5 text-xs ${streak.type === "W" ? "text-profit" : "text-loss"}`}
                  >
                    consecutive {streak.type === "W" ? "wins" : "losses"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                  Risk Multiple (Avg)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">
                  {last30AvgRisk != null ? `${last30AvgRisk}R` : "—"}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  30 days
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                Equity Curve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EquityCurveChart
                data={buildEquityCurve(last30)}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
              Today&apos;s Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TodayTradesTable
              trades={todayTrades.map((t) => ({
                id: t.id,
                ticker: t.ticker,
                profitLoss: t.profitLoss,
                riskMultiple: t.riskMultiple,
                entryTime: new Date(t.entryTime).toISOString(),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function computeStreak(
  tradeList: (typeof trades.$inferSelect)[],
) {
  if (tradeList.length === 0) return null;

  const sorted = [...tradeList].sort(
    (a, b) =>
      new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime(),
  );

  const firstIsWin =
    sorted[0].profitLoss != null && sorted[0].profitLoss > 0;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i].profitLoss ?? 0) > 0 === firstIsWin) {
      count++;
    } else {
      break;
    }
  }

  return { count, type: firstIsWin ? "W" : "L" };
}

function buildEquityCurve(
  tradeList: (typeof trades.$inferSelect)[],
) {
  let cumulative = 0;
  return [...tradeList]
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
      };
    });
}
