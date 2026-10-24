"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TradeChartLoader } from "./trade-chart-loader";
import { TradeDetailEditForm } from "./trade-detail-edit-form";
import { TradeDetailExecutions } from "./trade-detail-executions";
import { TradeDetailHeader } from "./trade-detail-header";
import { TradeDetailSummary } from "./trade-detail-summary";
import type {
  TradeDetailExecution,
  TradeDetailTrade,
} from "./trade-detail-types";

type Props = {
  trade: TradeDetailTrade;
  executions: TradeDetailExecution[];
};

export function TradeDetail({ trade, executions }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this trade?")) return;
    setPending(true);
    await fetch(`/api/trades/${trade.id}`, { method: "DELETE" });
    router.push("/trades");
  }

  async function handleSave(formData: FormData) {
    setPending(true);
    const response = await fetch(`/api/trades/${trade.id}`, {
      method: "PATCH",
      body: formData,
    });
    if (response.ok) {
      setEditing(false);
      router.refresh();
    }
    setPending(false);
  }

  if (editing) {
    return (
      <TradeDetailEditForm
        trade={trade}
        pending={pending}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <TradeDetailHeader trade={trade} />
      <TradeDetailSummary trade={trade} />
      <TradeDetailExecutions trade={trade} executions={executions} />

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
        <Button
          variant="secondary"
          className="text-loss hover:bg-loss-surface"
          onClick={handleDelete}
          disabled={pending}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
