"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type Account = {
  id: number;
  name: string;
  type: string;
};

export function AccountSwitcher({
  accounts,
  activeAccountId,
}: {
  accounts: Account[];
  activeAccountId: number;
}) {
  const router = useRouter();
  const active = accounts.find((a) => a.id === activeAccountId);

  async function handleSwitch(accountId: number) {
    await fetch("/api/accounts/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 outline-none">
        <span className="truncate">{active?.name ?? "Account"}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={4}>
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => handleSwitch(account.id)}
            className={account.id === activeAccountId ? "font-semibold" : ""}
          >
            <span>{account.name}</span>
            {account.id === activeAccountId && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                active
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
