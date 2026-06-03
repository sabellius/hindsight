import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function MetricCard({
  title,
  value,
  subtitle,
  className,
}: {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-lg font-bold ${className ?? "text-foreground"}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
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
            <MetricCard
              title="Today's Profit/Loss"
              value="$0.00"
              subtitle="No trades"
            />
            <MetricCard
              title="Win Rate"
              value="—"
              subtitle="0 trades"
            />
            <MetricCard
              title="Streak"
              value="—"
            />
            <MetricCard
              title="Risk Multiple (Avg)"
              value="—"
              subtitle="30 days"
            />
          </div>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                Equity Curve
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center">
              <p className="text-xs text-muted-foreground">
                No data yet. Start logging trades.
              </p>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Profit/Loss</TableHead>
                  <TableHead className="text-right">Risk</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-xs text-muted-foreground"
                  >
                    No trades yet.{" "}
                    <a href="/trades/new" className="text-foreground underline">
                      Add your first trade
                    </a>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
