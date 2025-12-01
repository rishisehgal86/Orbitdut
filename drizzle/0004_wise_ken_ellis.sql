ALTER TABLE `supplierResponseTimes` MODIFY COLUMN `countryCode` varchar(2);--> statement-breakpoint
ALTER TABLE `supplierResponseTimes` ADD `isDefault` int unsigned DEFAULT 0 NOT NULL;