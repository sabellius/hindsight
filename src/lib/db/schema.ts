import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["live", "paper"] }).notNull().default("live"),
  broker: text("broker"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const trades = sqliteTable("trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  ticker: text("ticker").notNull(),
  side: text("side", { enum: ["long"] })
    .notNull()
    .default("long"),
  strategyId: integer("strategy_id").references(() => strategies.id),
  entryTime: integer("entry_time", { mode: "timestamp_ms" }).notNull(),
  exitTime: integer("exit_time", { mode: "timestamp_ms" }).notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price").notNull(),
  quantity: integer("quantity").notNull(),
  stopLoss: real("stop_loss"),
  target: real("target"),
  commission: real("commission").notNull().default(0),
  profitLoss: real("profit_loss"),
  profitLossPercent: real("profit_loss_percent"),
  riskMultiple: real("risk_multiple"),
  conviction: text("conviction", { enum: ["A", "B", "C"] }),
  processGrade: text("process_grade", { enum: ["A", "B", "C"] }),
  notes: text("notes"),
  ibkrOrderId: text("ibkr_order_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const strategies = sqliteTable("strategies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  name: text("name").notNull(),
  description: text("description"),
  rules: text("rules"),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  date: text("date").notNull(),
  preMarketPlan: text("pre_market_plan"),
  marketCondition: text("market_condition", {
    enum: ["trending", "choppy", "volatile"],
  }),
  mood: integer("mood"),
  energy: integer("energy"),
  dailyGrade: text("daily_grade", { enum: ["A", "B", "C", "D", "F"] }),
  followedRiskRules: integer("followed_risk_rules", { mode: "boolean" }),
  waitedForSetups: integer("waited_for_setups", { mode: "boolean" }),
  noForcedTrades: integer("no_forced_trades", { mode: "boolean" }),
  hitDailyTarget: integer("hit_daily_target", { mode: "boolean" }),
  reviewNotes: text("review_notes"),
});

export const executions = sqliteTable("executions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tradeId: integer("trade_id")
    .notNull()
    .references(() => trades.id, { onDelete: "cascade" }),
  side: text("side", { enum: ["buy", "sell"] }).notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
  commission: real("commission").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tradeScreenshots = sqliteTable("trade_screenshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tradeId: integer("trade_id")
    .notNull()
    .references(() => trades.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["entry", "exit"] }).notNull(),
  filepath: text("filepath").notNull(),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tradeId: integer("trade_id")
    .notNull()
    .references(() => trades.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
