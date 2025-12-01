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
CREATE TABLE `supplierCoverage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`coverageType` enum('postal_codes','city_radius','polygon') NOT NULL,
	`country` varchar(2) NOT NULL,
	`coverageData` text,
	`radiusKm` int,
	`centerLat` varchar(20),
	`centerLng` varchar(20),
	`geoJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierCoverage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`country` varchar(2) NOT NULL,
	`hourlyRate` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierRates_id` PRIMARY KEY(`id`)
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
