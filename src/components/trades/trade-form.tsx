"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function TradeForm({ accountId }: { accountId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      formData.set("accountId", String(accountId));
      const res = await fetch("/api/trades", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { id } = await res.json();
        router.push(`/trades/${id}`);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ticker">Ticker *</Label>
          <Input id="ticker" name="ticker" required placeholder="NVDA" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input id="quantity" name="quantity" type="number" required min={1} placeholder="100" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="commission">Commission</Label>
          <Input id="commission" name="commission" type="number" step="0.01" defaultValue="0" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entryPrice">Entry Price *</Label>
          <Input id="entryPrice" name="entryPrice" type="number" step="0.01" required placeholder="131.20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exitPrice">Exit Price *</Label>
          <Input id="exitPrice" name="exitPrice" type="number" step="0.01" required placeholder="132.50" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stopLoss">Stop Loss</Label>
          <Input id="stopLoss" name="stopLoss" type="number" step="0.01" placeholder="130.40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="target">Target</Label>
          <Input id="target" name="target" type="number" step="0.01" placeholder="133.50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entryTime">Entry Time *</Label>
          <Input id="entryTime" name="entryTime" type="datetime-local" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exitTime">Exit Time *</Label>
          <Input id="exitTime" name="exitTime" type="datetime-local" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conviction">Conviction</Label>
          <Select name="conviction">
            <SelectTrigger id="conviction">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A — High</SelectItem>
              <SelectItem value="B">B — Medium</SelectItem>
              <SelectItem value="C">C — Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="processGrade">Process Grade</Label>
          <Select name="processGrade">
            <SelectTrigger id="processGrade">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A — Followed plan</SelectItem>
              <SelectItem value="B">B — Mostly followed</SelectItem>
              <SelectItem value="C">C — Deviated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} placeholder="Trade rationale, observations..." />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Trade"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
