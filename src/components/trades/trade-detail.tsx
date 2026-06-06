"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TradeChartLoader } from "./trade-chart-loader";

type Trade = {
  id: number;
  ticker: string;
  side: string;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss: number | null;
  target: number | null;
  commission: number;
  profitLoss: number | null;
  profitLossPercent: number | null;
  riskMultiple: number | null;
  conviction: string | null;
  processGrade: string | null;
  notes: string | null;
};

function FieldCard({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary p-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className={`text-sm font-semibold ${className ?? "text-foreground"}`}>
        {children}
      </div>
    </div>
  );
}

function GradeBadge({ grade, label }: { grade: string | null; label: string }) {
  if (!grade) {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary p-2 text-center">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">—</span>
      </div>
    );
  }
  const color =
    grade === "A"
      ? "border-profit/40 bg-profit-surface text-profit"
      : grade === "B"
        ? "border-border bg-secondary text-foreground"
        : "border-loss/40 bg-loss-surface text-loss";
  return (
    <div className={`flex flex-col gap-1 rounded-lg border p-2 text-center ${color}`}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{grade}</span>
    </div>
  );
}

type Execution = {
  id: number;
  tradeId: number;
  side: string;
  price: number;
  quantity: number;
  timestamp: number;
  commission: number;
  createdAt: number;
};

export function TradeDetail({
  trade,
  executions: initialExecutions,
}: {
  trade: Trade;
  executions: Execution[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPending, setAddPending] = useState(false);

  const isProfit = trade.profitLoss != null && trade.profitLoss >= 0;
  const profitLossColor = isProfit ? "text-profit" : "text-loss";

  const durationMilliseconds = trade.exitTime - trade.entryTime;
  const durationMinutes = Math.round(durationMilliseconds / 60000);

  async function handleDelete() {
    if (!confirm("Delete this trade?")) return;
    setPending(true);
    await fetch(`/api/trades/${trade.id}`, { method: "DELETE" });
    router.push("/trades");
  }

  async function handleSave(formData: FormData) {
    setPending(true);
    const res = await fetch(`/api/trades/${trade.id}`, {
      method: "PATCH",
      body: formData,
    });
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
    setPending(false);
  }

  if (editing) {
    return (
      <form action={handleSave} className="flex flex-col gap-6 max-w-2xl">
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Stop Loss</Label>
            <Input name="stopLoss" type="number" step="0.01" defaultValue={trade.stopLoss ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Target</Label>
            <Input name="target" type="number" step="0.01" defaultValue={trade.target ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Conviction</Label>
            <Select name="conviction" defaultValue={trade.conviction ?? undefined}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Process Grade</Label>
            <Select name="processGrade" defaultValue={trade.processGrade ?? undefined}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea name="notes" rows={4} defaultValue={trade.notes ?? ""} />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-foreground">{trade.ticker}</h1>
          <Badge variant="secondary" className="border-profit/30 bg-profit-surface text-profit">
            Long
          </Badge>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${profitLossColor}`}>
            {trade.profitLoss != null
              ? `${isProfit ? "+" : ""}$${trade.profitLoss.toFixed(2)}`
              : "—"}
          </div>
          {trade.profitLossPercent != null && (
            <div className={`text-xs ${profitLossColor}`}>
              {isProfit ? "+" : ""}{trade.profitLossPercent.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {new Date(trade.entryTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}{" "}
        &middot;{" "}
        {new Date(trade.entryTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}{" "}
        –{" "}
        {new Date(trade.exitTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}{" "}
        &middot; {durationMinutes}min
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FieldCard label="Entry">${trade.entryPrice.toFixed(2)}</FieldCard>
        <FieldCard label="Exit">${trade.exitPrice.toFixed(2)}</FieldCard>
        <FieldCard label="Quantity">{trade.quantity}</FieldCard>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <FieldCard label="Stop" className="text-loss">
          {trade.stopLoss != null ? `$${trade.stopLoss.toFixed(2)}` : "—"}
        </FieldCard>
        <FieldCard label="Target" className="text-profit">
          {trade.target != null ? `$${trade.target.toFixed(2)}` : "—"}
        </FieldCard>
        <FieldCard label="Risk Multiple" className={profitLossColor}>
          {trade.riskMultiple != null ? `${trade.riskMultiple}R` : "—"}
        </FieldCard>
        <FieldCard label="Commission">
          ${trade.commission.toFixed(2)}
        </FieldCard>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <GradeBadge grade={trade.conviction} label="Conviction" />
        <GradeBadge grade={trade.processGrade} label="Process" />
        <FieldCard label="Net Profit/Loss" className={profitLossColor}>
          {trade.profitLoss != null
            ? `${isProfit ? "+" : ""}$${(trade.profitLoss - trade.commission).toFixed(2)}`
            : "—"}
        </FieldCard>
      </div>

      {trade.notes && (
        <div className="rounded-lg border border-border bg-secondary p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">Notes</div>
          <p className="text-xs leading-relaxed text-muted-foreground">{trade.notes}</p>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Executions ({initialExecutions.length})
          </span>
          <Button
            variant="secondary"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Cancel" : "Add Execution"}
          </Button>
        </div>

        {showAddForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAddPending(true);
              const form = e.currentTarget;
              const formData = new FormData(form);
              const res = await fetch(`/api/trades/${trade.id}/executions`, {
                method: "POST",
                body: formData,
              });
              if (res.ok) {
                setShowAddForm(false);
                router.refresh();
              }
              setAddPending(false);
            }}
            className="mb-3 grid grid-cols-5 gap-2 rounded-lg border border-border bg-secondary p-2"
          >
            <Select name="side" required defaultValue="buy">
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
            <Input name="price" type="number" step="0.01" required placeholder="Price" className="h-8 text-xs" />
            <Input name="quantity" type="number" required placeholder="Qty" className="h-8 text-xs" />
            <Input name="timestamp" type="datetime-local" required className="h-8 text-xs" />
            <div className="flex gap-1">
              <Input name="commission" type="number" step="0.01" placeholder="Comm." defaultValue="0" className="h-8 text-xs" />
              <Button type="submit" size="sm" className="h-8 text-xs px-2" disabled={addPending}>
                {addPending ? "..." : "Add"}
              </Button>
            </div>
          </form>
        )}

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-1.5 text-left font-medium">Time</th>
              <th className="py-1.5 text-left font-medium">Side</th>
              <th className="py-1.5 text-right font-medium">Price</th>
              <th className="py-1.5 text-right font-medium">Qty</th>
              <th className="py-1.5 text-right font-medium">Comm.</th>
              <th className="py-1.5 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {initialExecutions.map((exec) => (
              <tr key={exec.id} className="border-b border-border/50">
                <td className="py-1.5">
                  {new Date(exec.timestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </td>
                <td className="py-1.5">
                  <span className={exec.side === "buy" ? "text-profit" : "text-loss"}>
                    {exec.side === "buy" ? "Buy" : "Sell"}
                  </span>
                </td>
                <td className="py-1.5 text-right">${exec.price.toFixed(2)}</td>
                <td className="py-1.5 text-right">{exec.quantity}</td>
                <td className="py-1.5 text-right">${exec.commission.toFixed(2)}</td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-loss text-[10px]"
                    onClick={async () => {
                      if (!confirm("Delete this execution?")) return;
                      const formData = new FormData();
                      formData.set("executionId", String(exec.id));
                      await fetch(`/api/trades/${trade.id}/executions`, {
                        method: "DELETE",
                        body: formData,
                      });
                      router.refresh();
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          Price Chart
        </div>
        <TradeChartLoader
          ticker={trade.ticker}
          entryTime={trade.entryTime}
          exitTime={trade.exitTime}
          entryPrice={trade.entryPrice}
          exitPrice={trade.exitPrice}
          stopLoss={trade.stopLoss}
          target={trade.target}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="secondary" className="text-loss hover:bg-loss-surface" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
