CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(50),
	`serviceType` varchar(100) NOT NULL,
	`description` text,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`country` varchar(2) NOT NULL,
	`postalCode` varchar(20),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`scheduledStart` timestamp NOT NULL,
	`estimatedDuration` int NOT NULL,
	`isOutOfHours` int unsigned NOT NULL DEFAULT 0,
	`calculatedPrice` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('pending_supplier_acceptance','assigned_to_supplier','en_route','on_site','completed','cancelled') NOT NULL DEFAULT 'pending_supplier_acceptance',
	`assignedSupplierId` int,
	`acceptedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`paymentType` enum('customer_payment','supplier_payout') NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeTransferId` varchar(255),
	`status` enum('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`supplierId` int NOT NULL,
	`customerId` int,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierCoverageCountries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`isExcluded` int unsigned NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierCoverageCountries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierPriorityCities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`cityName` varchar(255) NOT NULL,
	`stateProvince` varchar(255),
	`placeId` varchar(255),
	`formattedAddress` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierPriorityCities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`countryCode` varchar(2),
	`cityId` int,
	`serviceType` varchar(50) NOT NULL,
	`responseTimeHours` int NOT NULL,
	`rateUsdCents` int,
	`isServiceable` int unsigned,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierRates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierResponseTimeExclusions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`countryCode` varchar(2),
	`cityId` int,
	`serviceType` varchar(50) NOT NULL,
	`responseTimeHours` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierResponseTimeExclusions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierResponseTimes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`countryCode` varchar(2),
	`cityName` varchar(255),
	`responseTimeHours` int NOT NULL,
	`isDefault` int unsigned NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierResponseTimes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `supplierUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`supplierId` int NOT NULL,
	`role` enum('supplier_admin','supplier_tech') NOT NULL DEFAULT 'supplier_tech',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierUsers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50),
	`address` text,
	`city` varchar(100),
	`country` varchar(2) NOT NULL,
	`taxId` varchar(100),
	`verificationStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`stripeAccountId` varchar(255),
	`isActive` int unsigned NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`name` text,
	`email` varchar(320) NOT NULL,
	`passwordHash` text,
	`accountType` enum('customer','supplier') NOT NULL,
	`loginMethod` varchar(64) DEFAULT 'local',
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_assignedSupplierId_suppliers_id_fk` FOREIGN KEY (`assignedSupplierId`) REFERENCES `suppliers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierCoverageCountries` ADD CONSTRAINT `supplierCoverageCountries_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierPriorityCities` ADD CONSTRAINT `supplierPriorityCities_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierRates` ADD CONSTRAINT `supplierRates_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierRates` ADD CONSTRAINT `supplierRates_cityId_supplierPriorityCities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `supplierPriorityCities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierResponseTimeExclusions` ADD CONSTRAINT `rtExcl_supplier_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierResponseTimeExclusions` ADD CONSTRAINT `rtExcl_city_fk` FOREIGN KEY (`cityId`) REFERENCES `supplierPriorityCities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierResponseTimes` ADD CONSTRAINT `supplierResponseTimes_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierServiceExclusions` ADD CONSTRAINT `supplierServiceExclusions_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierServiceExclusions` ADD CONSTRAINT `supplierServiceExclusions_cityId_supplierPriorityCities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `supplierPriorityCities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierUsers` ADD CONSTRAINT `supplierUsers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierUsers` ADD CONSTRAINT `supplierUsers_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `jobs_customerId_idx` ON `jobs` (`customerId`);--> statement-breakpoint
CREATE INDEX `jobs_assignedSupplierId_idx` ON `jobs` (`assignedSupplierId`);--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `payments_jobId_idx` ON `payments` (`jobId`);--> statement-breakpoint
CREATE INDEX `payments_paymentType_idx` ON `payments` (`paymentType`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `reviews_jobId_idx` ON `reviews` (`jobId`);--> statement-breakpoint
CREATE INDEX `reviews_supplierId_idx` ON `reviews` (`supplierId`);--> statement-breakpoint
CREATE INDEX `reviews_customerId_idx` ON `reviews` (`customerId`);--> statement-breakpoint
CREATE INDEX `supplierCoverageCountries_supplierId_idx` ON `supplierCoverageCountries` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierCoverageCountries_unique` ON `supplierCoverageCountries` (`supplierId`,`countryCode`);--> statement-breakpoint
CREATE INDEX `supplierPriorityCities_supplierId_idx` ON `supplierPriorityCities` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierPriorityCities_unique` ON `supplierPriorityCities` (`supplierId`,`placeId`);--> statement-breakpoint
CREATE INDEX `supplierRates_supplierId_idx` ON `supplierRates` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierRates_unique` ON `supplierRates` (`supplierId`,`countryCode`,`cityId`,`serviceType`,`responseTimeHours`);--> statement-breakpoint
CREATE INDEX `rtExcl_supplierId_idx` ON `supplierResponseTimeExclusions` (`supplierId`);--> statement-breakpoint
CREATE INDEX `rtExcl_unique` ON `supplierResponseTimeExclusions` (`supplierId`,`countryCode`,`cityId`,`serviceType`,`responseTimeHours`);--> statement-breakpoint
CREATE INDEX `supplierResponseTimes_supplierId_idx` ON `supplierResponseTimes` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierResponseTimes_unique` ON `supplierResponseTimes` (`supplierId`,`countryCode`,`cityName`,`responseTimeHours`);--> statement-breakpoint
CREATE INDEX `supplierServiceExclusions_supplierId_idx` ON `supplierServiceExclusions` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierServiceExclusions_unique` ON `supplierServiceExclusions` (`supplierId`,`countryCode`,`cityId`,`serviceType`);--> statement-breakpoint
CREATE INDEX `supplierUsers_userId_idx` ON `supplierUsers` (`userId`);--> statement-breakpoint
CREATE INDEX `supplierUsers_supplierId_idx` ON `supplierUsers` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierUsers_unique` ON `supplierUsers` (`userId`,`supplierId`);