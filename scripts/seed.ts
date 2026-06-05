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
  const hour = 3600000;
  const day = 86400000;
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const todayStart = todayUtc.getTime();

  function adjustToWeekday(milliseconds: number): number {
    const date = new Date(milliseconds);
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek === 0) date.setUTCDate(date.getUTCDate() - 2);
    if (dayOfWeek === 6) date.setUTCDate(date.getUTCDate() - 1);
    return date.getTime();
  }

  db.prepare(
    "INSERT INTO strategies (account_id, name, description, rules) VALUES (?, ?, ?, ?)",
  ).run(
    1,
    "VWAP Reclaim",
    "Long pullback to VWAP with volume confirmation",
    "1. Wait for first 15min range\n2. Enter on pullback to VWAP\n3. Stop below low of day",
  );
  db.prepare(
    "INSERT INTO strategies (account_id, name, description, rules) VALUES (?, ?, ?, ?)",
  ).run(
    1,
    "Opening Range Breakout",
    "Breakout above first 15-minute high with momentum",
    "1. Mark 9:30-9:45 range\n2. Enter on break of high\n3. Target 2R minimum",
  );
  db.prepare(
    "INSERT INTO strategies (account_id, name, description, rules) VALUES (?, ?, ?, ?)",
  ).run(
    1,
    "Gap and Go",
    "Gap up with pre-market volume, ride momentum",
    "1. Pre-market gapper list\n2. Enter on first pullback\n3. Stop below VWAP",
  );

  const insertTrade = db.prepare(
    `INSERT INTO trades (account_id, ticker, side, strategy_id, entry_time, exit_time, entry_price, exit_price, quantity, stop_loss, target, commission, profit_loss, profit_loss_percent, risk_multiple, conviction, process_grade, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const staticTrades = [
    { ticker: "NVDA", strategyId: 1, daysAgo: 1, entryHour: 10, durationHours: 1.5, entryPrice: 213.91, exitPrice: 217.63, stopLoss: 210.70, target: 221.39, quantity: 84, commission: 1.0 },
    { ticker: "AAPL", strategyId: 2, daysAgo: 1, entryHour: 10, durationHours: 0.75, entryPrice: 313.30, exitPrice: 309.85, stopLoss: 308.61, target: 324.27, quantity: 57, commission: 1.0 },
    { ticker: "TSLA", strategyId: 3, daysAgo: 2, entryHour: 10, durationHours: 2, entryPrice: 418.70, exitPrice: 422.54, stopLoss: 412.42, target: 433.35, quantity: 42, commission: 1.0 },
    { ticker: "AMD", strategyId: 1, daysAgo: 2, entryHour: 12, durationHours: 1, entryPrice: 530.40, exitPrice: 533.21, stopLoss: 522.44, target: 548.96, quantity: 33, commission: 1.0 },
    { ticker: "META", strategyId: 2, daysAgo: 3, entryHour: 10, durationHours: 0.5, entryPrice: 603.35, exitPrice: 607.92, stopLoss: 594.30, target: 624.47, quantity: 29, commission: 1.0 },
    { ticker: "GOOGL", strategyId: 3, daysAgo: 4, entryHour: 11, durationHours: 1.5, entryPrice: 376.60, exitPrice: 375.44, stopLoss: 370.95, target: 389.78, quantity: 47, commission: 1.0 },
    { ticker: "MSFT", strategyId: 1, daysAgo: 5, entryHour: 10, durationHours: 1, entryPrice: 432.71, exitPrice: 443.52, stopLoss: 426.22, target: 447.86, quantity: 41, commission: 1.0 },
    { ticker: "AMZN", strategyId: 2, daysAgo: 6, entryHour: 10, durationHours: 2.5, entryPrice: 271.31, exitPrice: 272.10, stopLoss: 267.25, target: 280.81, quantity: 66, commission: 1.0 },
    { ticker: "SPY", strategyId: 1, daysAgo: 7, entryHour: 13, durationHours: 0.75, entryPrice: 592.40, exitPrice: 595.80, stopLoss: 583.52, target: 613.13, quantity: 29, commission: 0.5 },
    { ticker: "NVDA", strategyId: 2, daysAgo: 8, entryHour: 10, durationHours: 1.25, entryPrice: 208.15, exitPrice: 204.30, stopLoss: 205.03, target: 215.44, quantity: 86, commission: 1.0 },
    { ticker: "QQQ", strategyId: 1, daysAgo: 9, entryHour: 11, durationHours: 1, entryPrice: 521.70, exitPrice: 524.30, stopLoss: 513.88, target: 539.96, quantity: 34, commission: 0.5 },
    { ticker: "TSLA", strategyId: 3, daysAgo: 10, entryHour: 10, durationHours: 3, entryPrice: 425.60, exitPrice: 432.10, stopLoss: 419.22, target: 440.50, quantity: 41, commission: 1.0 },
    { ticker: "AAPL", strategyId: 1, daysAgo: 11, entryHour: 12, durationHours: 0.5, entryPrice: 310.80, exitPrice: 308.90, stopLoss: 306.14, target: 321.68, quantity: 94, commission: 1.0 },
    { ticker: "META", strategyId: 2, daysAgo: 12, entryHour: 10, durationHours: 0.75, entryPrice: 598.20, exitPrice: 604.50, stopLoss: 589.23, target: 619.14, quantity: 29, commission: 1.0 },
    { ticker: "AMD", strategyId: 1, daysAgo: 14, entryHour: 11, durationHours: 2, entryPrice: 525.90, exitPrice: 518.40, stopLoss: 518.01, target: 544.31, quantity: 29, commission: 1.0 },
  ];

  function deriveMetadata(
    profitLoss: number,
    riskMultiple: number,
    strategyId: number,
  ): { conviction: string; processGrade: string; notes: string } {
    const isWin = profitLoss >= 0;
    const absRisk = Math.abs(riskMultiple);

    if (isWin && absRisk >= 2) {
      return {
        conviction: "A",
        processGrade: "A",
        notes:
          strategyId === 1
            ? "Perfect VWAP setup with strong follow-through. Exceeded target."
            : strategyId === 2
              ? "Clean ORB, momentum carried well past target. Textbook execution."
              : "Gap and go with strong momentum. Rode it for a big winner.",
      };
    }
    if (isWin && absRisk >= 1) {
      return {
        conviction: "A",
        processGrade: "B",
        notes:
          strategyId === 1
            ? "Good VWAP reclaim, followed the plan. Could have held longer."
            : strategyId === 2
              ? "Solid breakout, locked in profits at target area."
              : "Good gap play, managed the position well throughout.",
      };
    }
    if (isWin) {
      return {
        conviction: "B",
        processGrade: "B",
        notes:
          strategyId === 1
            ? "Scratched out a small gain on VWAP play. Timid exit."
            : strategyId === 2
              ? "Small winner on breakout, got shaken out before the real move."
              : "Gap play didn't fully materialize. Took what the market gave.",
      };
    }
    if (!isWin && absRisk <= 1) {
      return {
        conviction: "B",
        processGrade: "B",
        notes: "Quick cut when the setup failed. Good risk management, small loss.",
      };
    }
    if (!isWin && absRisk <= 2) {
      return {
        conviction: "C",
        processGrade: "C",
        notes:
          strategyId === 1
            ? "VWAP setup failed, didn't cut fast enough. Need to trust my stops."
            : "False breakout, hesitated on the exit. Lesson learned.",
      };
    }
    return {
      conviction: "C",
      processGrade: "D",
      notes:
        "Chased the entry, ignored my rules. Revenge trade after a loss. Must follow the plan.",
    };
  }

  const insertMany = db.transaction((trades: unknown[][]) => {
    for (const trade of trades) {
      insertTrade.run(...trade);
    }
  });

  const tradeRows: unknown[][] = [];

  for (const trade of staticTrades) {
    const marketHourUtc = trade.entryHour + 4;
    const entryMs = adjustToWeekday(todayStart - trade.daysAgo * day + marketHourUtc * hour);
    const exitMs = entryMs + trade.durationHours * hour;

    const profitLoss = (trade.exitPrice - trade.entryPrice) * trade.quantity - trade.commission;
    const profitLossPercent = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    const riskPerShare = Math.abs(trade.entryPrice - trade.stopLoss);
    const risk = riskPerShare * trade.quantity;
    const riskMultiple = risk > 0 ? profitLoss / risk : 0;
    const metadata = deriveMetadata(profitLoss, riskMultiple, trade.strategyId);

    tradeRows.push([
      1,
      trade.ticker,
      "long",
      trade.strategyId,
      entryMs,
      exitMs,
      trade.entryPrice,
      trade.exitPrice,
      trade.quantity,
      trade.stopLoss,
      trade.target,
      trade.commission,
      Math.round(profitLoss * 100) / 100,
      Math.round(profitLossPercent * 100) / 100,
      Math.round(riskMultiple * 100) / 100,
      metadata.conviction,
      metadata.processGrade,
      metadata.notes,
      entryMs,
    ]);

    const isWin = profitLoss >= 0;
    console.log(
      `  ${trade.ticker}: entry=$${trade.entryPrice.toFixed(2)} exit=$${trade.exitPrice.toFixed(2)} qty=${trade.quantity} (${isWin ? "win" : "loss"}, ${profitLoss >= 0 ? "+" : ""}$${profitLoss.toFixed(2)}, ${riskMultiple.toFixed(1)}R)`,
    );
  }

  insertMany(tradeRows);
  console.log(
    `Seeded ${tradeRows.length} trades + 3 strategies`,
  );
  db.close();
} else {
  console.log("Trades already exist, skipping sample data");
  db.close();
}
