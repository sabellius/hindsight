import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const allAccounts = await db.select().from(accounts);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-sm font-semibold text-foreground">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {allAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{account.name}</span>
                <Badge variant="secondary">{account.type}</Badge>
                {account.broker && (
                  <span className="text-xs text-muted-foreground">
                    {account.broker}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                ID: {account.id}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            IBKR Client Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Connection Status</span>
              <span className="text-xs text-muted-foreground">
                Not connected
              </span>
            </div>
            <Badge variant="secondary" className="border-loss/30 bg-loss-surface text-loss">
              Disconnected
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Gateway URL</span>
              <span className="text-xs text-muted-foreground">
                https://localhost:5000
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            IBKR integration will be available in a future update. Start the
            Client Portal gateway locally to enable trade syncing.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Risk Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Account Size</span>
            <span className="font-medium">$27,000</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Max Risk Per Trade</span>
            <span className="font-medium">1% ($270)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Max Daily Loss</span>
            <span className="font-medium">3% ($810)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Price Range</span>
            <span className="font-medium">$5 - $100</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Position Type</span>
            <span className="font-medium">Long Only</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Peak Hours (IST)</span>
            <span className="font-medium">4:30 PM - 6:30 PM</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Data
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Database</span>
            <span className="font-medium">SQLite (hindsight.db)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Screenshots</span>
            <span className="font-medium">data/screenshots/</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Backup</span>
            <span className="font-medium text-muted-foreground">
              Not configured
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
