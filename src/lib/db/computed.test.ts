import { describe, it, expect } from "vitest";
import { computeTradeMetrics, computeTradeMetricsFromExecutions } from "@/lib/db/computed";

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
});

describe("computeTradeMetricsFromExecutions", () => {
  it("computes metrics for simple buy + sell", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "buy", price: 100, quantity: 50, commission: 0.5, timestamp: 1000 },
        { side: "sell", price: 105, quantity: 50, commission: 0.5, timestamp: 2000 },
      ],
      98,
    );

    expect(result.entryPrice).toBe(100);
    expect(result.exitPrice).toBe(105);
    expect(result.quantity).toBe(50);
    expect(result.commission).toBe(1);
    expect(result.entryTime).toBe(1000);
    expect(result.exitTime).toBe(2000);
    expect(result.profitLoss).toBe(249);
    expect(result.profitLossPercent).toBe(5);
    expect(result.riskMultiple).toBe(2.5);
  });

  it("computes metrics for multiple buys (scale in)", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "buy", price: 100, quantity: 100, commission: 1, timestamp: 1000 },
        { side: "buy", price: 102, quantity: 50, commission: 1, timestamp: 1500 },
        { side: "sell", price: 110, quantity: 150, commission: 1, timestamp: 3000 },
      ],
      98,
    );

    expect(result.entryPrice).toBe(100.66666666666667);
    expect(result.exitPrice).toBe(110);
    expect(result.quantity).toBe(150);
    expect(result.commission).toBe(3);
    expect(result.profitLoss).toBeCloseTo(1400 - 3);
  });

  it("computes metrics for multiple sells (partial exits)", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "buy", price: 50, quantity: 100, commission: 1, timestamp: 1000 },
        { side: "sell", price: 52, quantity: 60, commission: 1, timestamp: 2000 },
        { side: "sell", price: 55, quantity: 40, commission: 1, timestamp: 3000 },
      ],
      48,
    );

    expect(result.exitPrice).toBe((52 * 60 + 55 * 40) / 100);
    expect(result.quantity).toBe(100);
    expect(result.commission).toBe(3);
    expect(result.exitTime).toBe(3000);
  });

  it("computes metrics for multiple buys + multiple sells", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "buy", price: 131.20, quantity: 100, commission: 1, timestamp: 1000 },
        { side: "buy", price: 132.40, quantity: 50, commission: 1, timestamp: 1500 },
        { side: "sell", price: 135.00, quantity: 100, commission: 1, timestamp: 3000 },
        { side: "sell", price: 135.80, quantity: 50, commission: 1, timestamp: 3100 },
      ],
      130,
    );

    expect(result.entryPrice).toBeCloseTo(131.6);
    expect(result.exitPrice).toBeCloseTo(135.27);
    expect(result.quantity).toBe(150);
    expect(result.commission).toBe(4);
    expect(result.entryTime).toBe(1000);
    expect(result.exitTime).toBe(3100);
  });

  it("returns null riskMultiple when no stopLoss", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "buy", price: 100, quantity: 10, commission: 0, timestamp: 1000 },
        { side: "sell", price: 105, quantity: 10, commission: 0, timestamp: 2000 },
      ],
      null,
    );

    expect(result.riskMultiple).toBeNull();
    expect(result.profitLoss).toBe(50);
  });

  it("totals commission across all executions", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "buy", price: 50, quantity: 100, commission: 2, timestamp: 1000 },
        { side: "sell", price: 52, quantity: 100, commission: 3, timestamp: 2000 },
      ],
      49,
    );

    expect(result.commission).toBe(5);
    expect(result.profitLoss).toBe(195);
  });

  it("returns null riskMultiple when stopLoss equals entryPrice", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "buy", price: 100, quantity: 10, commission: 0, timestamp: 1000 },
        { side: "sell", price: 105, quantity: 10, commission: 0, timestamp: 2000 },
      ],
      100,
    );

    expect(result.riskMultiple).toBeNull();
  });

  it("handles buys only (open position)", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "buy", price: 100, quantity: 50, commission: 1, timestamp: 1000 },
        { side: "buy", price: 102, quantity: 25, commission: 1, timestamp: 1500 },
      ],
      98,
    );

    expect(result.entryPrice).toBeCloseTo(100.67);
    expect(result.exitPrice).toBe(0);
    expect(result.quantity).toBe(75);
    expect(result.entryTime).toBe(1000);
    expect(result.exitTime).toBe(0);
  });

  it("handles sells only (closing leftover)", () => {
    const result = computeTradeMetricsFromExecutions(
      [
        { side: "sell", price: 105, quantity: 50, commission: 1, timestamp: 2000 },
      ],
      null,
    );

    expect(result.entryPrice).toBe(0);
    expect(result.exitPrice).toBe(105);
    expect(result.quantity).toBe(0);
    expect(result.exitTime).toBe(2000);
  });
});
