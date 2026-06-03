import { describe, it, expect } from "vitest";
import { computeTradeMetrics } from "@/lib/db/computed";

describe("computeTradeMetrics", () => {
  it("computes profit for a winning long trade", () => {
    const result = computeTradeMetrics({
      entryPrice: 100,
      exitPrice: 105,
      quantity: 50,
      commission: 1,
      stopLoss: 98,
    });

    expect(result.profitLoss).toBe(249);
    expect(result.profitLossPercent).toBe(5);
    expect(result.riskMultiple).toBe(2.5);
  });

  it("computes loss for a losing long trade", () => {
    const result = computeTradeMetrics({
      entryPrice: 100,
      exitPrice: 97,
      quantity: 30,
      commission: 1,
      stopLoss: 98,
    });

    expect(result.profitLoss).toBe(-91);
    expect(result.profitLossPercent).toBe(-3);
    expect(result.riskMultiple).toBe(-1.5);
  });

  it("returns null riskMultiple when no stopLoss", () => {
    const result = computeTradeMetrics({
      entryPrice: 100,
      exitPrice: 105,
      quantity: 10,
      commission: 0,
      stopLoss: null,
    });

    expect(result.profitLoss).toBe(50);
    expect(result.riskMultiple).toBeNull();
  });

  it("returns null riskMultiple when stopLoss equals entryPrice", () => {
    const result = computeTradeMetrics({
      entryPrice: 100,
      exitPrice: 105,
      quantity: 10,
      commission: 0,
      stopLoss: 100,
    });

    expect(result.riskMultiple).toBeNull();
  });

  it("accounts for commission", () => {
    const noCommission = computeTradeMetrics({
      entryPrice: 50,
      exitPrice: 52,
      quantity: 100,
      commission: 0,
      stopLoss: 49,
    });

    const withCommission = computeTradeMetrics({
      entryPrice: 50,
      exitPrice: 52,
      quantity: 100,
      commission: 5,
      stopLoss: 49,
    });

    expect(noCommission.profitLoss).toBe(200);
    expect(withCommission.profitLoss).toBe(195);
  });

  it("computes percentage to 2 decimal places", () => {
    const result = computeTradeMetrics({
      entryPrice: 131.20,
      exitPrice: 132.50,
      quantity: 50,
      commission: 1,
      stopLoss: 130,
    });

    expect(result.profitLossPercent).toBe(0.99);
  });
});
