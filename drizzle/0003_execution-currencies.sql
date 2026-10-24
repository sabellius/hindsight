ALTER TABLE `executions` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `executions` ADD `commission_currency` text DEFAULT 'USD' NOT NULL;