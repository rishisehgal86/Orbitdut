ALTER TABLE `supplierResponseTimeExclusions` DROP FOREIGN KEY `supplierResponseTimeExclusions_supplierId_suppliers_id_fk`;
--> statement-breakpoint
ALTER TABLE `supplierResponseTimeExclusions` DROP FOREIGN KEY `supplierResponseTimeExclusions_cityId_supplierPriorityCities_id_fk`;
--> statement-breakpoint
DROP INDEX `supplierResponseTimeExclusions_supplierId_idx` ON `supplierResponseTimeExclusions`;--> statement-breakpoint
DROP INDEX `supplierResponseTimeExclusions_unique` ON `supplierResponseTimeExclusions`;--> statement-breakpoint
ALTER TABLE `supplierResponseTimeExclusions` ADD CONSTRAINT `rtExcl_supplier_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierResponseTimeExclusions` ADD CONSTRAINT `rtExcl_city_fk` FOREIGN KEY (`cityId`) REFERENCES `supplierPriorityCities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `rtExcl_supplierId_idx` ON `supplierResponseTimeExclusions` (`supplierId`);--> statement-breakpoint
CREATE INDEX `rtExcl_unique` ON `supplierResponseTimeExclusions` (`supplierId`,`countryCode`,`cityId`,`serviceType`,`responseTimeHours`);