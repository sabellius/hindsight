import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { cookies } from "next/headers";

export async function getActiveAccountId(): Promise<number> {
  const cookieStore = await cookies();
  const accountId = cookieStore.get("hindsight-account-id")?.value;
  if (accountId) {
    return Number(accountId);
  }
  const firstAccount = await db.query.accounts.findFirst({
    where: undefined,
    orderBy: accounts.id,
  });
  return firstAccount?.id ?? 1;
}
