ALTER TABLE `jobs` ADD CONSTRAINT `jobs_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_assignedSupplierId_suppliers_id_fk` FOREIGN KEY (`assignedSupplierId`) REFERENCES `suppliers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierResponseTimes` ADD CONSTRAINT `supplierResponseTimes_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX `supplierResponseTimes_supplierId_idx` ON `supplierResponseTimes` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierResponseTimes_unique` ON `supplierResponseTimes` (`supplierId`,`countryCode`,`cityName`,`responseTimeHours`);--> statement-breakpoint
CREATE INDEX `supplierUsers_userId_idx` ON `supplierUsers` (`userId`);--> statement-breakpoint
CREATE INDEX `supplierUsers_supplierId_idx` ON `supplierUsers` (`supplierId`);--> statement-breakpoint
CREATE INDEX `supplierUsers_unique` ON `supplierUsers` (`userId`,`supplierId`);