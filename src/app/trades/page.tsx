import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trades } from "@/lib/db/schema";
import { TradeListTable } from "@/components/trades/trade-list-table";
import { getActiveAccountId } from "@/lib/auth";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const sortField = params.sort ?? "entryTime";
  const sortDir = params.dir ?? "desc";
  const accountId = await getActiveAccountId();

  const allTrades = await db.select().from(trades).where(eq(trades.accountId, accountId)).orderBy(desc(trades.entryTime));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Trades</h1>
        <a
          href="/trades/new"
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Trade
        </a>
      </div>

      {allTrades.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">
            No trades yet.{" "}
            <a href="/trades/new" className="text-foreground underline">
              Add your first trade
            </a>
          </p>
        </div>
      ) : (
        <TradeListTable data={allTrades} sortField={sortField} sortDir={sortDir} />
      )}
    </div>
  );
}
