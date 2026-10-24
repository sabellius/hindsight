// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatHeaderDate,
  formatLongDate,
  formatPercent,
  formatRiskMultiple,
  formatShortDate,
  formatShortDateWithYear,
  formatSignedCurrency,
  formatTime,
  formatWeekday,
  roundToCents,
} from "@/lib/format";

describe("roundToCents", () => {
  it("rounds to two decimals", () => {
    expect(roundToCents(10.555)).toBe(10.56);
    expect(roundToCents(-3.146)).toBe(-3.15);
    expect(roundToCents(2)).toBe(2);
  });
});

describe("currency formatting", () => {
  it("formats unsigned currency", () => {
    expect(formatCurrency(105.5)).toBe("$105.50");
    expect(formatCurrency(91)).toBe("$91.00");
    expect(formatCurrency(1234, 0)).toBe("$1234");
  });

  it("formats signed currency with a leading plus for profits", () => {
    expect(formatSignedCurrency(250)).toBe("+$250.00");
    expect(formatSignedCurrency(-91)).toBe("$-91.00");
    expect(formatSignedCurrency(0)).toBe("+$0.00");
  });
});

describe("percent and risk formatting", () => {
  it("formats percents with configurable decimals", () => {
    expect(formatPercent(55.56)).toBe("55.6%");
    expect(formatPercent(0.99, 2)).toBe("0.99%");
  });

  it("formats risk multiples with one decimal and an R suffix", () => {
    expect(formatRiskMultiple(2.5)).toBe("2.5R");
    expect(formatRiskMultiple(2.55)).toBe("2.5R");
    expect(formatRiskMultiple(2.56)).toBe("2.6R");
  });
});

describe("date and time formatting", () => {
  const timestamp = new Date("2026-01-05T15:30:00Z").getTime();

  it("formats short dates", () => {
    expect(formatShortDate(timestamp)).toMatch(/Jan \d+/);
    expect(formatShortDate("2026-01-05T00:00:00")).toMatch(/Jan 4|Jan 5/);
    expect(formatShortDate(new Date(timestamp))).toMatch(/Jan \d+/);
  });

  it("formats dates with year, header, long, and weekday variants", () => {
    expect(formatShortDateWithYear(timestamp)).toMatch(/Jan \d+, 2026/);
    expect(formatHeaderDate(timestamp)).toMatch(/^[A-Z][a-z]{2}, Jan \d+$/);
    expect(formatLongDate("2026-01-05T00:00:00")).toMatch(
      /^[A-Z][a-z]+, January \d+$/,
    );
    expect(formatWeekday(timestamp)).toMatch(/^[A-Z][a-z]{2}$/);
  });

  it("formats times without AM/PM", () => {
    expect(formatTime(timestamp)).toMatch(/^\d{2}:\d{2}$/);
  });
});
