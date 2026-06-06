import { describe, it, expect } from "vitest";
import {
  buildEquityCurve,
  groupByStrategy,
  groupByDayOfWeek,
  groupByHour,
  buildRiskDistribution,
  buildStreaks,
  buildDrawdown,
  computeSummaryMetrics,
} from "@/lib/analytics";
import { trades } from "@/lib/db/schema";

type TradeRow = (typeof trades.$inferSelect)[];
type Trade = TradeRow[number];

function makeTrade(overrides: Partial<Trade> & { entryTime: Date }): Trade {
  return {
    id: 1,
    accountId: 1,
    ticker: "AAPL",
    side: "long",
    strategyId: null,
    exitTime: overrides.entryTime,
    entryPrice: 100,
    exitPrice: 105,
    quantity: 10,
    stopLoss: null,
    target: null,
    commission: 0,
    profitLoss: 100,
    profitLossPercent: 5,
    riskMultiple: 1,
    conviction: null,
    processGrade: null,
    notes: null,
    ibkrOrderId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("buildEquityCurve", () => {
  it("builds cumulative P&L curve sorted by time", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-03"), profitLoss: 50 }),
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: 100 }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: -30 }),
    ];

    const curve = buildEquityCurve(trades);

    expect(curve).toHaveLength(3);
    expect(curve[0].value).toBe(100);
    expect(curve[1].value).toBe(70);
    expect(curve[2].value).toBe(120);
  });

  it("handles null profitLoss as zero", () => {
    const trades = [makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: null })];
    const curve = buildEquityCurve(trades);

    expect(curve[0].value).toBe(0);
    expect(curve[0].profitLoss).toBe(0);
  });

  it("returns empty array for no trades", () => {
    expect(buildEquityCurve([])).toEqual([]);
  });
});

describe("groupByStrategy", () => {
  it("groups trades and calculates win rate", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: 100 }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: -50 }),
      makeTrade({ entryTime: new Date("2024-01-03"), profitLoss: 30 }),
    ];

    const result = groupByStrategy(trades);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Unassigned");
    expect(result[0].total).toBe(3);
    expect(result[0].winRate).toBe(67);
  });

  it("returns empty array for no trades", () => {
    expect(groupByStrategy([])).toEqual([]);
  });

  it("handles all losers", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: -10 }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: -20 }),
    ];

    const result = groupByStrategy(trades);
    expect(result[0].winRate).toBe(0);
  });

  it("treats null profitLoss as not a win", () => {
    const trades = [makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: null })];
    const result = groupByStrategy(trades);
    expect(result[0].winRate).toBe(0);
    expect(result[0].total).toBe(1);
  });
});

describe("groupByDayOfWeek", () => {
  it("groups P&L by weekday", () => {
    const monday = new Date("2024-01-01");
    const tuesday = new Date("2024-01-02");

    const trades = [
      makeTrade({ entryTime: monday, profitLoss: 100 }),
      makeTrade({ entryTime: tuesday, profitLoss: -50 }),
    ];

    const result = groupByDayOfWeek(trades);

    expect(result).toHaveLength(5);
    expect(result[0].name).toBe("Mon");
    expect(result[0].value).toBe(100);
    expect(result[1].name).toBe("Tue");
    expect(result[1].value).toBe(-50);
  });

  it("returns zeros for all days with no trades", () => {
    const result = groupByDayOfWeek([]);
    expect(result.every((d) => d.value === 0)).toBe(true);
  });

  it("skips weekend trades", () => {
    const saturday = new Date("2024-01-06");
    const trades = [makeTrade({ entryTime: saturday, profitLoss: 100 })];

    const result = groupByDayOfWeek(trades);
    const total = result.reduce((s, d) => s + d.value, 0);
    expect(total).toBe(0);
  });

  it("handles null profitLoss as zero", () => {
    const monday = new Date("2024-01-01");
    const trades = [makeTrade({ entryTime: monday, profitLoss: null })];

    const result = groupByDayOfWeek(trades);
    expect(result[0].value).toBe(0);
  });
});

describe("groupByHour", () => {
  it("groups trades by hour (16-23)", () => {
    const trade1 = makeTrade({
      entryTime: new Date(2024, 0, 1, 16, 30),
      profitLoss: 50,
    });
    const trade2 = makeTrade({
      entryTime: new Date(2024, 0, 1, 18, 0),
      profitLoss: -20,
    });

    const result = groupByHour([trade1, trade2]);

    expect(result).toHaveLength(8);
    expect(result[0].hour).toBe("16:00");
    expect(result[0].value).toBe(50);
    expect(result[0].count).toBe(1);
    expect(result[2].hour).toBe("18:00");
    expect(result[2].value).toBe(-20);
  });

  it("returns zero values for hours with no trades", () => {
    const result = groupByHour([]);
    expect(result).toHaveLength(8);
    expect(result.every((h) => h.count === 0 && h.value === 0)).toBe(true);
  });

  it("handles null profitLoss as zero value", () => {
    const trade = makeTrade({
      entryTime: new Date(2024, 0, 1, 16, 0),
      profitLoss: null,
    });

    const result = groupByHour([trade]);
    expect(result[0].value).toBe(0);
    expect(result[0].count).toBe(1);
  });
});

describe("buildRiskDistribution", () => {
  it("buckets trades by R-multiple", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-01"), riskMultiple: 2.5 }),
      makeTrade({ entryTime: new Date("2024-01-02"), riskMultiple: -1.5 }),
      makeTrade({ entryTime: new Date("2024-01-03"), riskMultiple: 0.5 }),
      makeTrade({ entryTime: new Date("2024-01-04"), riskMultiple: null }),
    ];

    const result = buildRiskDistribution(trades);

    expect(result).toHaveLength(7);
    expect(result.find((b) => b.label === "3R+")?.count).toBe(1);
    expect(result.find((b) => b.label === "-2R")?.count).toBe(1);
    expect(result.find((b) => b.label === "1R")?.count).toBe(1);
  });

  it("returns zeros for all buckets with no trades", () => {
    const result = buildRiskDistribution([]);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });

  it("marks positive buckets correctly", () => {
    const result = buildRiskDistribution([]);
    expect(result[0].isPositive).toBe(false);
    expect(result[4].isPositive).toBe(true);
  });
});

describe("buildStreaks", () => {
  it("returns win/loss array sorted by time", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-03"), profitLoss: -10, ticker: "C" }),
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: 100, ticker: "A" }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: 50, ticker: "B" }),
    ];

    const streaks = buildStreaks(trades);

    expect(streaks[0].ticker).toBe("A");
    expect(streaks[0].isWin).toBe(true);
    expect(streaks[1].ticker).toBe("B");
    expect(streaks[1].isWin).toBe(true);
    expect(streaks[2].ticker).toBe("C");
    expect(streaks[2].isWin).toBe(false);
  });

  it("handles null profitLoss as not a win", () => {
    const trades = [makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: null })];
    const streaks = buildStreaks(trades);
    expect(streaks[0].isWin).toBe(false);
  });
});

describe("buildDrawdown", () => {
  it("computes drawdown from peak", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: 100 }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: -50 }),
      makeTrade({ entryTime: new Date("2024-01-03"), profitLoss: 30 }),
    ];

    const result = buildDrawdown(trades);

    expect(result).toHaveLength(3);
    expect(result[0].drawdown).toBe(0);
    expect(result[1].drawdown).toBe(-50);
    expect(result[2].drawdown).toBe(-20);
  });

  it("resets peak on new equity high", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: 100 }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: -30 }),
      makeTrade({ entryTime: new Date("2024-01-03"), profitLoss: 50 }),
    ];

    const result = buildDrawdown(trades);

    expect(result[2].drawdown).toBe(0);
  });

  it("returns empty array for no trades", () => {
    expect(buildDrawdown([])).toEqual([]);
  });

  it("handles null profitLoss as zero", () => {
    const trades = [makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: null })];
    const result = buildDrawdown(trades);
    expect(result[0].drawdown).toBe(0);
  });
});

describe("computeSummaryMetrics", () => {
  it("computes win rate, profit factor, avg winner/loser", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: 100 }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: -50 }),
      makeTrade({ entryTime: new Date("2024-01-03"), profitLoss: 30 }),
    ];

    const result = computeSummaryMetrics(trades);

    expect(result.totalTrades).toBe(3);
    expect(result.winRate).toBeCloseTo(66.67);
    expect(result.profitFactor).toBeCloseTo(2.6);
    expect(result.avgWinner).toBeCloseTo(65);
    expect(result.avgLoser).toBe(50);
  });

  it("handles empty trade list", () => {
    const result = computeSummaryMetrics([]);

    expect(result.totalTrades).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.profitFactor).toBe(0);
    expect(result.avgWinner).toBe(0);
    expect(result.avgLoser).toBe(0);
  });

  it("handles all winners (no losers)", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: 50 }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: 30 }),
    ];

    const result = computeSummaryMetrics(trades);

    expect(result.profitFactor).toBe(0);
    expect(result.avgLoser).toBe(0);
  });

  it("handles all losers (no winners)", () => {
    const trades = [
      makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: -50 }),
      makeTrade({ entryTime: new Date("2024-01-02"), profitLoss: -30 }),
    ];

    const result = computeSummaryMetrics(trades);

    expect(result.winRate).toBe(0);
    expect(result.avgWinner).toBe(0);
    expect(result.avgLoser).toBe(40);
  });

  it("treats null profitLoss as neither win nor loss", () => {
    const trades = [makeTrade({ entryTime: new Date("2024-01-01"), profitLoss: null })];

    const result = computeSummaryMetrics(trades);

    expect(result.totalTrades).toBe(1);
    expect(result.winRate).toBe(0);
  });
});
