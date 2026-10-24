/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: () => {} }),
}));

const COLLAPSED_KEY = "hindsight-sidebar-collapsed";
const accounts = [{ id: 1, name: "Main", type: "paper" }];

function shell() {
  return (
    <AppShell accounts={accounts} activeAccountId={1}>
      <div>page content</div>
    </AppShell>
  );
}

function toggleButton(container: HTMLElement) {
  const headerRow = container.querySelector<HTMLElement>("aside > div");
  if (!headerRow) throw new Error("sidebar header row not found");
  return within(headerRow).getByRole("button");
}

describe("AppShell sidebar collapsed state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders identical html regardless of a saved collapsed preference", () => {
    localStorage.setItem(COLLAPSED_KEY, "true");
    const withSavedPreference = renderToString(shell());
    localStorage.removeItem(COLLAPSED_KEY);
    const withoutSavedPreference = renderToString(shell());
    expect(withSavedPreference).toBe(withoutSavedPreference);
  });

  it("applies the saved collapsed preference after mount", () => {
    localStorage.setItem(COLLAPSED_KEY, "true");
    const { container } = render(shell());
    expect(container.querySelector("aside")).toHaveClass("w-[48px]");
    expect(
      screen.queryByRole("link", { name: /trades/i }),
    ).not.toBeInTheDocument();
  });

  it("stays expanded when no preference is saved", () => {
    const { container } = render(shell());
    expect(container.querySelector("aside")).toHaveClass("w-[200px]");
    expect(screen.getByRole("link", { name: /trades/i })).toBeVisible();
  });

  it("persists the preference when toggled", async () => {
    const user = userEvent.setup();
    const { container } = render(shell());
    await user.click(toggleButton(container));
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe("true");
    await user.click(toggleButton(container));
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe("false");
  });
});
