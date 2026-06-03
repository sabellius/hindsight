import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, trades } from "@/lib/db/schema";
import { notFound } from "next/navigation";
import { SessionForm } from "@/components/sessions/session-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveAccountId } from "@/lib/auth";
import { sql } from "drizzle-orm";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accountId = await getActiveAccountId();

  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, Number(id)))
    .get();

  if (!session) notFound();

  const dayTrades = await db
    .select()
    .from(trades)
    .where(
      sql`${trades.accountId} = ${accountId} AND date(${trades.entryTime} / 1000, 'unixepoch') = ${session.date}`,
    );

  const dayProfitLoss = dayTrades.reduce(
    (sum, t) => sum + (t.profitLoss ?? 0),
    0,
  );
  const dayWinners = dayTrades.filter(
    (t) => t.profitLoss != null && t.profitLoss > 0,
  );
  const isProfit = dayProfitLoss >= 0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">
          Session —{" "}
          {new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h1>
        <div
          className={`text-sm font-bold tabular-nums ${
            dayTrades.length > 0
              ? isProfit
                ? "text-profit"
                : "text-loss"
              : "text-foreground"
          }`}
        >
          {dayTrades.length > 0
            ? `${isProfit ? "+" : ""}$${dayProfitLoss.toFixed(2)}`
            : "No trades"}
        </div>
      </div>

      {dayTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
              Session Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Trades</span>
              <div className="font-semibold">{dayTrades.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Win Rate</span>
              <div className="font-semibold">
                {Math.round((dayWinners.length / dayTrades.length) * 100)}%
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Profit/Loss</span>
              <div className={`font-semibold ${isProfit ? "text-profit" : "text-loss"}`}>
                {isProfit ? "+" : ""}${dayProfitLoss.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <SessionForm accountId={accountId} session={session} />
    </div>
  );
}
