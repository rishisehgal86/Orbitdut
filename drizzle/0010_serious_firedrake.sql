CREATE TABLE `supplierServiceExclusions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`countryCode` varchar(2),
	`cityId` int,
	`serviceType` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierServiceExclusions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `supplierRates` ADD `isServiceable` int unsigned;--> statement-breakpoint
ALTER TABLE `supplierServiceExclusions` ADD CONSTRAINT `supplierServiceExclusions_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierServiceExclusions` ADD CONSTRAINT `supplierServiceExclusions_cityId_supplierPriorityCities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `supplierPriorityCities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `supplierServiceExclusions_supplierId_idx` ON `supplierServiceExclusions` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierServiceExclusions_unique` ON `supplierServiceExclusions` (`supplierId`,`countryCode`,`cityId`,`serviceType`);