CREATE TABLE `cash_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`type` text,
	`amount` real,
	`currency` text NOT NULL,
	`event_date` integer,
	`dedupe_key` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cash_transactions_dedupe_key_unique` ON `cash_transactions` (`dedupe_key`);--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text,
	`raw_file_path` text,
	`account_id` integer,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`flagged_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `import_flags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` integer NOT NULL,
	`reason` text NOT NULL,
	`raw_fields` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `import_batches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_executions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trade_id` integer NOT NULL,
	`side` text NOT NULL,
	`price` real NOT NULL,
	`quantity` real NOT NULL,
	`timestamp` integer NOT NULL,
	`commission` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_executions`("id", "trade_id", "side", "price", "quantity", "timestamp", "commission", "created_at") SELECT "id", "trade_id", "side", "price", "quantity", "timestamp", "commission", "created_at" FROM `executions`;--> statement-breakpoint
DROP TABLE `executions`;--> statement-breakpoint
ALTER TABLE `__new_executions` RENAME TO `executions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trade_id` integer NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "trade_id", "name") SELECT "id", "trade_id", "name" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
CREATE TABLE `__new_trade_screenshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trade_id` integer NOT NULL,
	`type` text NOT NULL,
	`filepath` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_trade_screenshots`("id", "trade_id", "type", "filepath") SELECT "id", "trade_id", "type", "filepath" FROM `trade_screenshots`;--> statement-breakpoint
DROP TABLE `trade_screenshots`;--> statement-breakpoint
ALTER TABLE `__new_trade_screenshots` RENAME TO `trade_screenshots`;--> statement-breakpoint
CREATE TABLE `__new_trades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`ticker` text NOT NULL,
	`side` text DEFAULT 'long' NOT NULL,
	`strategy_id` integer,
	`entry_time` integer NOT NULL,
	`exit_time` integer NOT NULL,
	`entry_price` real NOT NULL,
	`exit_price` real NOT NULL,
	`quantity` real NOT NULL,
	`stop_loss` real,
	`target` real,
	`commission` real DEFAULT 0 NOT NULL,
	`profit_loss` real,
	`profit_loss_percent` real,
	`risk_multiple` real,
	`conviction` text,
	`process_grade` text,
	`notes` text,
	`ibkr_order_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_trades`("id", "account_id", "ticker", "side", "strategy_id", "entry_time", "exit_time", "entry_price", "exit_price", "quantity", "stop_loss", "target", "commission", "profit_loss", "profit_loss_percent", "risk_multiple", "conviction", "process_grade", "notes", "ibkr_order_id", "created_at") SELECT "id", "account_id", "ticker", "side", "strategy_id", "entry_time", "exit_time", "entry_price", "exit_price", "quantity", "stop_loss", "target", "commission", "profit_loss", "profit_loss_percent", "risk_multiple", "conviction", "process_grade", "notes", "ibkr_order_id", "created_at" FROM `trades`;--> statement-breakpoint
DROP TABLE `trades`;--> statement-breakpoint
ALTER TABLE `__new_trades` RENAME TO `trades`;