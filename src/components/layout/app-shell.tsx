"use client";

import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";

const COLLAPSED_KEY = "hindsight-sidebar-collapsed";

function getInitialCollapsed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COLLAPSED_KEY) === "true";
}

export function AppShell({
  children,
  accounts,
  activeAccountId,
}: {
  children: React.ReactNode;
  accounts: { id: number; name: string; type: string }[];
  activeAccountId: number;
}) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          collapsed={collapsed}
          onToggle={toggle}
          accounts={accounts}
          activeAccountId={activeAccountId}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </TooltipProvider>
  );
}
