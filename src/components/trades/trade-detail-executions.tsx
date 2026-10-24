"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatTime } from "@/lib/format";
import type {
  TradeDetailExecution,
  TradeDetailTrade,
} from "./trade-detail-types";

type Props = {
  trade: TradeDetailTrade;
  executions: TradeDetailExecution[];
};

export function TradeDetailExecutions({ trade, executions }: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPending, setAddPending] = useState(false);

  async function handleAdd(formData: FormData) {
    setAddPending(true);
    const response = await fetch(`/api/trades/${trade.id}/executions`, {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      setShowAddForm(false);
      router.refresh();
    }
    setAddPending(false);
  }

  async function handleRemove(executionId: number) {
    if (!confirm("Delete this execution?")) return;
    const formData = new FormData();
    formData.set("executionId", String(executionId));
    await fetch(`/api/trades/${trade.id}/executions`, {
      method: "DELETE",
      body: formData,
    });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Executions ({executions.length})
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
          action={handleAdd}
          className="mb-3 grid grid-cols-5 gap-2 rounded-lg border border-border bg-secondary p-2"
        >
          <Select name="side" required defaultValue="buy">
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
          <Input
            name="price"
            type="number"
            step="0.01"
            required
            placeholder="Price"
            className="h-8 text-xs"
          />
          <Input
            name="quantity"
            type="number"
            required
            placeholder="Quantity"
            className="h-8 text-xs"
          />
          <Input
            name="timestamp"
            type="datetime-local"
            required
            className="h-8 text-xs"
          />
          <div className="flex gap-1">
            <Input
              name="commission"
              type="number"
              step="0.01"
              placeholder="Commission"
              defaultValue="0"
              className="h-8 text-xs"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs px-2"
              disabled={addPending}
            >
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
            <th className="py-1.5 text-right font-medium">Quantity</th>
            <th className="py-1.5 text-right font-medium">Commission</th>
            <th className="py-1.5 text-right font-medium" />
          </tr>
        </thead>
        <tbody>
          {executions.map((execution) => (
            <tr key={execution.id} className="border-b border-border/50">
              <td className="py-1.5">{formatTime(execution.timestamp)}</td>
              <td className="py-1.5">
                <span
                  className={
                    execution.side === "buy" ? "text-profit" : "text-loss"
                  }
                >
                  {execution.side === "buy" ? "Buy" : "Sell"}
                </span>
              </td>
              <td className="py-1.5 text-right">
                {formatCurrency(execution.price)}
              </td>
              <td className="py-1.5 text-right">{execution.quantity}</td>
              <td className="py-1.5 text-right">
                {formatCurrency(execution.commission)}
              </td>
              <td className="py-1.5 text-right">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-loss text-[10px]"
                  onClick={() => handleRemove(execution.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
