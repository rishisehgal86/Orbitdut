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
	`latitude` varchar(20),
	`longitude` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierPriorityCities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierResponseTimes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`cityName` varchar(255),
	`responseTimeHours` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierResponseTimes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `supplierCoverage`;