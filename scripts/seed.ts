import Database from "better-sqlite3";

const db = new Database("hindsight.db");

const existing = db
  .prepare("SELECT COUNT(*) as count FROM accounts")
  .get() as { count: number };

if (existing.count === 0) {
  db.prepare(
    "INSERT INTO accounts (name, type, created_at) VALUES (?, ?, ?)",
  ).run("Live Account", "live", Date.now());
  db.prepare(
    "INSERT INTO accounts (name, type, created_at) VALUES (?, ?, ?)",
  ).run("Paper Account", "paper", Date.now());
  console.log("Seeded 2 default accounts");
} else {
  console.log("Accounts already exist, skipping seed");
}

const tradeCount = db
  .prepare("SELECT COUNT(*) as count FROM trades")
  .get() as { count: number };

if (tradeCount.count === 0) {
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;

  const insertStrategy = db.prepare(
    "INSERT INTO strategies (account_id, name, description, rules) VALUES (?, ?, ?, ?)",
  );
  insertStrategy.run(
    1,
    "VWAP Reclaim",
    "Long pullback to VWAP with volume confirmation",
    "1. Wait for first 15min range\n2. Enter on pullback to VWAP\n3. Stop below low of day",
  );
  insertStrategy.run(
    1,
    "Opening Range Breakout",
    "Breakout above first 15-minute high with momentum",
    "1. Mark 9:30-9:45 range\n2. Enter on break of high\n3. Target 2R minimum",
  );
  insertStrategy.run(
    1,
    "Gap and Go",
    "Gap up with pre-market volume, ride momentum",
    "1. Pre-market gapper list\n2. Enter on first pullback\n3. Stop below VWAP",
  );

  const insertTrade = db.prepare(
    `INSERT INTO trades (account_id, ticker, side, strategy_id, entry_time, exit_time, entry_price, exit_price, quantity, stop_loss, target, commission, profit_loss, profit_loss_percent, risk_multiple, conviction, process_grade, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const sampleTrades = [
    {
      ticker: "NVDA",
      strategyId: 1,
      daysAgo: 0,
      entryHour: 10,
      durationHours: 1.5,
      entryPrice: 135.2,
      exitPrice: 137.8,
      quantity: 50,
      stopLoss: 134.0,
      target: 138.0,
      commission: 1.0,
      conviction: "A",
      processGrade: "A",
      notes: "Clean VWAP reclaim with increasing volume. Textbook setup.",
    },
    {
      ticker: "AAPL",
      strategyId: 2,
      daysAgo: 0,
      entryHour: 10,
      durationHours: 0.75,
      entryPrice: 198.5,
      exitPrice: 196.8,
      quantity: 30,
      stopLoss: 199.5,
      target: 201.0,
      commission: 1.0,
      conviction: "B",
      processGrade: "B",
      notes: "False breakout, cut quickly. Good discipline.",
    },
    {
      ticker: "TSLA",
      strategyId: 3,
      daysAgo: 1,
      entryHour: 10,
      durationHours: 2,
      entryPrice: 285.0,
      exitPrice: 291.5,
      quantity: 20,
      stopLoss: 282.0,
      target: 295.0,
      commission: 1.0,
      conviction: "A",
      processGrade: "A",
      notes: "Gap and go, held for 2R. Excellent execution.",
    },
    {
      ticker: "AMD",
      strategyId: 1,
      daysAgo: 1,
      entryHour: 12,
      durationHours: 1,
      entryPrice: 158.3,
      exitPrice: 155.9,
      quantity: 40,
      stopLoss: 157.0,
      target: 162.0,
      commission: 1.0,
      conviction: "B",
      processGrade: "C",
      notes: "Chased the entry, didn't wait for VWAP touch. Lesson learned.",
    },
    {
      ticker: "META",
      strategyId: 2,
      daysAgo: 2,
      entryHour: 10,
      durationHours: 0.5,
      entryPrice: 512.0,
      exitPrice: 518.5,
      quantity: 10,
      stopLoss: 509.0,
      target: 520.0,
      commission: 1.0,
      conviction: "A",
      processGrade: "A",
      notes: "ORB on strong earnings follow-through. Quick 2R.",
    },
    {
      ticker: "GOOGL",
      strategyId: 1,
      daysAgo: 3,
      entryHour: 11,
      durationHours: 1.5,
      entryPrice: 178.5,
      exitPrice: 175.2,
      quantity: 35,
      stopLoss: 177.0,
      target: 182.0,
      commission: 1.0,
      conviction: "C",
      processGrade: "C",
      notes: "Low conviction trade, shouldn't have taken it. Market was choppy.",
    },
    {
      ticker: "MSFT",
      strategyId: 2,
      daysAgo: 4,
      entryHour: 10,
      durationHours: 1,
      entryPrice: 442.0,
      exitPrice: 447.5,
      quantity: 12,
      stopLoss: 439.5,
      target: 450.0,
      commission: 1.0,
      conviction: "A",
      processGrade: "A",
      notes: "Clean breakout, great risk/reward. Followed the plan perfectly.",
    },
    {
      ticker: "AMZN",
      strategyId: 3,
      daysAgo: 5,
      entryHour: 10,
      durationHours: 2.5,
      entryPrice: 192.0,
      exitPrice: 196.8,
      quantity: 25,
      stopLoss: 190.0,
      target: 198.0,
      commission: 1.0,
      conviction: "A",
      processGrade: "B",
      notes: "Good entry, could have held longer but locked in profits.",
    },
    {
      ticker: "SPY",
      strategyId: 1,
      daysAgo: 6,
      entryHour: 13,
      durationHours: 0.75,
      entryPrice: 592.0,
      exitPrice: 590.1,
      quantity: 15,
      stopLoss: 591.0,
      target: 595.0,
      commission: 0.5,
      conviction: "C",
      processGrade: "C",
      notes: "Afternoon trade, low volume. Broke my own rule about peak hours.",
    },
    {
      ticker: "NVDA",
      strategyId: 2,
      daysAgo: 7,
      entryHour: 10,
      durationHours: 1.25,
      entryPrice: 132.5,
      exitPrice: 136.0,
      quantity: 60,
      stopLoss: 131.0,
      target: 136.5,
      commission: 1.0,
      conviction: "A",
      processGrade: "A",
      notes: "Strong opening range, perfect execution. Best trade of the week.",
    },
    {
      ticker: "QQQ",
      strategyId: 1,
      daysAgo: 8,
      entryHour: 11,
      durationHours: 1,
      entryPrice: 518.0,
      exitPrice: 515.3,
      quantity: 20,
      stopLoss: 516.5,
      target: 522.0,
      commission: 0.5,
      conviction: "B",
      processGrade: "B",
      notes: "VWAP reclaim failed, market reversed. Decent cut.",
    },
    {
      ticker: "TSLA",
      strategyId: 3,
      daysAgo: 9,
      entryHour: 10,
      durationHours: 3,
      entryPrice: 278.0,
      exitPrice: 286.5,
      quantity: 25,
      stopLoss: 275.0,
      target: 290.0,
      commission: 1.0,
      conviction: "A",
      processGrade: "A",
      notes: "Massive gap and go. Rode it for 3R. Patience paid off.",
    },
    {
      ticker: "AAPL",
      strategyId: 1,
      daysAgo: 10,
      entryHour: 12,
      durationHours: 0.5,
      entryPrice: 195.0,
      exitPrice: 194.2,
      quantity: 40,
      stopLoss: 194.0,
      target: 198.0,
      commission: 1.0,
      conviction: "C",
      processGrade: "D",
      notes: "Terrible entry, chased after missing the initial move. Revenge trade.",
    },
    {
      ticker: "META",
      strategyId: 2,
      daysAgo: 12,
      entryHour: 10,
      durationHours: 0.75,
      entryPrice: 505.0,
      exitPrice: 510.5,
      quantity: 12,
      stopLoss: 502.5,
      target: 512.0,
      commission: 1.0,
      conviction: "B",
      processGrade: "A",
      notes: "Good ORB, followed plan perfectly even with lower conviction.",
    },
    {
      ticker: "AMD",
      strategyId: 1,
      daysAgo: 14,
      entryHour: 11,
      durationHours: 2,
      entryPrice: 162.0,
      exitPrice: 166.5,
      quantity: 30,
      stopLoss: 160.5,
      target: 167.0,
      commission: 1.0,
      conviction: "A",
      processGrade: "A",
      notes: "Perfect VWAP setup, great sector momentum. 3R trade.",
    },
  ];

  const insertMany = db.transaction(() => {
    for (const t of sampleTrades) {
      const entryTime = new Date(now - t.daysAgo * day + t.entryHour * hour);
      const exitTime = new Date(
        entryTime.getTime() + t.durationHours * hour,
      );
      const profitLoss =
        (t.exitPrice - t.entryPrice) * t.quantity - t.commission;
      const profitLossPercent =
        ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100;
      const risk = Math.abs(t.entryPrice - t.stopLoss) * t.quantity;
      const riskMultiple = risk > 0 ? profitLoss / risk : null;

      insertTrade.run(
        1,
        t.ticker,
        "long",
        t.strategyId,
        entryTime.getTime(),
        exitTime.getTime(),
        t.entryPrice,
        t.exitPrice,
        t.quantity,
        t.stopLoss,
        t.target,
        t.commission,
        Math.round(profitLoss * 100) / 100,
        Math.round(profitLossPercent * 100) / 100,
        Math.round((riskMultiple ?? 0) * 100) / 100,
        t.conviction,
        t.processGrade,
        t.notes,
        entryTime.getTime(),
      );
    }
  });

  insertMany();
  console.log(`Seeded ${sampleTrades.length} sample trades + 3 strategies`);
} else {
  console.log("Trades already exist, skipping sample data");
}

db.close();
