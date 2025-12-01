ALTER TABLE `supplierRates` ADD `countryCode` varchar(2);--> statement-breakpoint
ALTER TABLE `supplierRates` ADD `cityId` int;--> statement-breakpoint
ALTER TABLE `supplierRates` ADD `serviceType` enum('L1_EUC','L1_NETWORK','SMART_HANDS') NOT NULL;--> statement-breakpoint
ALTER TABLE `supplierRates` ADD `responseTimeHours` int NOT NULL;--> statement-breakpoint
ALTER TABLE `supplierRates` ADD `rateUsdCents` int;--> statement-breakpoint
ALTER TABLE `supplierRates` DROP COLUMN `country`;--> statement-breakpoint
ALTER TABLE `supplierRates` DROP COLUMN `hourlyRate`;--> statement-breakpoint
ALTER TABLE `supplierRates` DROP COLUMN `currency`;