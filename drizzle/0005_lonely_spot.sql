ALTER TABLE `supplierPriorityCities` MODIFY COLUMN `latitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `supplierPriorityCities` MODIFY COLUMN `longitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `supplierPriorityCities` ADD `stateProvince` varchar(255);--> statement-breakpoint
ALTER TABLE `supplierPriorityCities` ADD `placeId` varchar(255);--> statement-breakpoint
ALTER TABLE `supplierPriorityCities` ADD `formattedAddress` text;