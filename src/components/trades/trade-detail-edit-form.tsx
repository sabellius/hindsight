"use client";

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
import type { TradeDetailTrade } from "./trade-detail-types";

type Props = {
  trade: TradeDetailTrade;
  pending: boolean;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
};

export function TradeDetailEditForm({
  trade,
  pending,
  onSave,
  onCancel,
}: Props) {
  return (
    <form action={onSave} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Stop Loss</Label>
          <Input
            name="stopLoss"
            type="number"
            step="0.01"
            defaultValue={trade.stopLoss ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Target</Label>
          <Input
            name="target"
            type="number"
            step="0.01"
            defaultValue={trade.target ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Conviction</Label>
          <Select
            name="conviction"
            defaultValue={trade.conviction ?? undefined}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Process Grade</Label>
          <Select
            name="processGrade"
            defaultValue={trade.processGrade ?? undefined}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
