import { SessionForm } from "@/components/sessions/session-form";
import { getActiveAccountId } from "@/lib/auth";

export default async function NewSessionPage() {
  const accountId = await getActiveAccountId();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-sm font-semibold text-foreground">New Session</h1>
      <SessionForm accountId={accountId} />
    </div>
  );
}
