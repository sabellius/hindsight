import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { TradeForm } from "@/components/trades/trade-form";
import { eq } from "drizzle-orm";

export default async function NewTradePage() {
  const defaultAccount = await db.query.accounts.findFirst({
    where: eq(accounts.type, "live"),
  });
  const accountId = defaultAccount?.id ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-sm font-semibold text-foreground">Add Trade</h1>
      <TradeForm accountId={accountId} />
    </div>
  );
}
