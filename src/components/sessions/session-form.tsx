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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  accountId: number;
  session?: {
    id: number;
    date: string;
    preMarketPlan: string | null;
    marketCondition: string | null;
    mood: number | null;
    energy: number | null;
    dailyGrade: string | null;
    followedRiskRules: boolean | null;
    waitedForSetups: boolean | null;
    noForcedTrades: boolean | null;
    hitDailyTarget: boolean | null;
    reviewNotes: string | null;
  };
};

export function SessionForm({ accountId, session }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      formData.set("accountId", String(accountId));
      const url = session ? `/api/sessions/${session.id}` : "/api/sessions";
      const method = session ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: formData });
      if (res.ok) {
        router.push("/sessions");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Session Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            name="date"
            type="date"
            required
            defaultValue={session?.date ?? new Date().toISOString().split("T")[0]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Pre-Market Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="preMarketPlan"
            rows={4}
            placeholder="What's the plan for today? Key levels, setups to watch..."
            defaultValue={session?.preMarketPlan ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Market Condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select name="marketCondition" defaultValue={session?.marketCondition ?? ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="choppy">Choppy</SelectItem>
              <SelectItem value="volatile">Volatile</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Mindset
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Mood (1-10)</Label>
            <Input
              name="mood"
              type="number"
              min={1}
              max={10}
              placeholder="7"
              defaultValue={session?.mood ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Energy (1-10)</Label>
            <Input
              name="energy"
              type="number"
              min={1}
              max={10}
              placeholder="8"
              defaultValue={session?.energy ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Daily Grade</Label>
            <Select name="dailyGrade" defaultValue={session?.dailyGrade ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A — Excellent</SelectItem>
                <SelectItem value="B">B — Good</SelectItem>
                <SelectItem value="C">C — Average</SelectItem>
                <SelectItem value="D">D — Below average</SelectItem>
                <SelectItem value="F">F — Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Process Scorecard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <CheckboxField
            name="followedRiskRules"
            label="Followed risk rules (1% max, $810 daily loss limit)"
            defaultChecked={session?.followedRiskRules ?? false}
          />
          <CheckboxField
            name="waitedForSetups"
            label="Waited for proper setups (no chasing)"
            defaultChecked={session?.waitedForSetups ?? false}
          />
          <CheckboxField
            name="noForcedTrades"
            label="No forced trades (patient when no edge)"
            defaultChecked={session?.noForcedTrades ?? false}
          />
          <CheckboxField
            name="hitDailyTarget"
            label="Hit daily target or stopped trading at loss limit"
            defaultChecked={session?.hitDailyTarget ?? false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Review Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="reviewNotes"
            rows={4}
            placeholder="What went well? What would you do differently? Key lessons..."
            defaultValue={session?.reviewNotes ?? ""}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : session ? "Update Session" : "Save Session"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center gap-3 text-sm cursor-pointer">
      <input
        type="hidden"
        name={name}
        value={checked ? "1" : "0"}
      />
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => setChecked(!checked)}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked
            ? "border-profit bg-profit text-profit-foreground"
            : "border-border bg-background"
        }`}
      >
        {checked && (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className="text-foreground">{label}</span>
    </label>
  );
}
