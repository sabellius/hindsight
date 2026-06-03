import { TradeForm } from "@/components/trades/trade-form";

export default function NewTradePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-sm font-semibold text-foreground">Add Trade</h1>
      <TradeForm />
    </div>
  );
}
