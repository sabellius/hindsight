import { SessionForm } from "@/components/sessions/session-form";
import { formatCurrency } from "@/lib/format";
import { getActiveAccountId } from "@/server/auth";
import { db } from "@/server/db";
import {
  getRiskParameters,
  maxDailyLossAmount,
} from "@/server/risk-parameters";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const accountId = await getActiveAccountId();
  const riskParameters = getRiskParameters(db);
  const riskLimits = {
    perTrade: `${riskParameters.riskPerTradePercent}%`,
    dailyLoss: formatCurrency(maxDailyLossAmount(riskParameters), 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-sm font-semibold text-foreground">New Session</h1>
      <SessionForm accountId={accountId} riskLimits={riskLimits} />
    </div>
  );
}
