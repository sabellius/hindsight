import { db } from "@/lib/db";
import { sessions, trades } from "@/lib/db/schema";
import { getActiveAccountId } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SessionsPage() {
  const accountId = await getActiveAccountId();

  const allSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.accountId, accountId))
    .orderBy(desc(sessions.date));

  const sessionStats = await db
    .select({
      date: trades.entryTime,
      profitLoss: trades.profitLoss,
    })
    .from(trades)
    .where(eq(trades.accountId, accountId));

  const dailyPnl = new Map<string, number>();
  for (const t of sessionStats) {
    const dateKey = new Date(t.date).toISOString().split("T")[0];
    dailyPnl.set(dateKey, (dailyPnl.get(dateKey) ?? 0) + (t.profitLoss ?? 0));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Sessions</h1>
        <a
          href="/sessions/new"
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Session
        </a>
      </div>

      {allSessions.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">
            No sessions yet.{" "}
            <a href="/sessions/new" className="text-foreground underline">
              Start your first session review
            </a>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {allSessions.map((session) => {
            const pnl = dailyPnl.get(session.date) ?? 0;
            const isProfit = pnl >= 0;
            const scorecardItems = [
              session.followedRiskRules,
              session.waitedForSetups,
              session.noForcedTrades,
              session.hitDailyTarget,
            ];
            const scorecardYes = scorecardItems.filter(Boolean).length;

            return (
              <a key={session.id} href={`/sessions/${session.id}`}>
                <Card className="transition-colors hover:bg-muted/30 cursor-pointer">
                  <CardContent className="flex items-center gap-6 py-4">
                    <div className="w-24 shrink-0">
                      <div className="text-sm font-semibold text-foreground">
                        {new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(session.date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </div>
                    </div>

                    {session.marketCondition && (
                      <Badge variant="secondary" className="shrink-0">
                        {session.marketCondition}
                      </Badge>
                    )}

                    {session.dailyGrade && (
                      <Badge
                        variant="secondary"
                        className={`shrink-0 ${
                          session.dailyGrade === "A"
                            ? "border-profit/30 bg-profit-surface text-profit"
                            : session.dailyGrade === "F"
                              ? "border-loss/30 bg-loss-surface text-loss"
                              : ""
                        }`}
                      >
                        {session.dailyGrade}
                      </Badge>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>{scorecardYes}/4</span>
                      <span>scorecard</span>
                    </div>

                    {session.mood != null && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>Mood: {session.mood}/10</span>
                      </div>
                    )}

                    <div className="ml-auto text-right">
                      <div
                        className={`text-sm font-semibold tabular-nums ${
                          pnl !== 0
                            ? isProfit
                              ? "text-profit"
                              : "text-loss"
                            : "text-foreground"
                        }`}
                      >
                        {pnl !== 0
                          ? `${isProfit ? "+" : ""}$${pnl.toFixed(2)}`
                          : "—"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
