import "server-only";

import { cookies } from "next/headers";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";

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
