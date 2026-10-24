// @vitest-environment node

import { expect } from "vitest";
import { settings } from "@/server/db/schema";
import {
  DEFAULT_RISK_PARAMETERS,
  getRiskParameters,
  maxDailyLossAmount,
  riskPerTradeAmount,
} from "@/server/risk-parameters";
import { test } from "@/testing/fixtures";

test("returns defaults when no settings rows exist", ({ db }) => {
  expect(getRiskParameters(db)).toEqual(DEFAULT_RISK_PARAMETERS);
});

test("reads stored parameters over defaults, per key", ({ db }) => {
  db.insert(settings)
    .values([
      { key: "risk_capital", value: "50000" },
      { key: "risk_per_trade_percent", value: "2" },
      { key: "max_daily_loss_percent", value: "4" },
    ])
    .run();

  const parameters = getRiskParameters(db);

  expect(parameters.capital).toBe(50000);
  expect(parameters.riskPerTradePercent).toBe(2);
  expect(parameters.maxDailyLossPercent).toBe(4);
});

test("ignores non-numeric stored values", ({ db }) => {
  db.insert(settings)
    .values({ key: "risk_capital", value: "not-a-number" })
    .run();

  expect(getRiskParameters(db).capital).toBe(DEFAULT_RISK_PARAMETERS.capital);
});

test("derives risk amounts from capital and percentages", () => {
  const parameters = {
    capital: 27000,
    riskPerTradePercent: 1,
    maxDailyLossPercent: 3,
  };

  expect(riskPerTradeAmount(parameters)).toBe(270);
  expect(maxDailyLossAmount(parameters)).toBe(810);
});
