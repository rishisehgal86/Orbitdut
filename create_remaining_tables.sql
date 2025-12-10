CREATE TABLE IF NOT EXISTS `siteVisitReports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobId` int NOT NULL UNIQUE,
  `visitDate` timestamp NOT NULL,
  `ticketNumbers` text,
  `engineerName` varchar(255) NOT NULL,
  `onsiteContact` varchar(255),
  `timeOnsite` varchar(50),
  `timeLeftSite` varchar(50),
  `issueFault` text,
  `actionsPerformed` text,
  `issueResolved` boolean DEFAULT FALSE,
  `contactAgreed` boolean DEFAULT FALSE,
  `clientSignatory` varchar(255),
  `clientSignatureData` text,
  `signedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `siteVisitReports_id` PRIMARY KEY(`id`),
  CONSTRAINT `siteVisitReports_jobId_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE,
  INDEX `siteVisitReports_jobId_idx` (`jobId`)
);

CREATE TABLE IF NOT EXISTS `svrMediaFiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `svrId` int NOT NULL,
  `fileKey` varchar(500) NOT NULL,
  `fileUrl` varchar(1000) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileType` enum('image','video') NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `fileSize` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `svrMediaFiles_id` PRIMARY KEY(`id`),
  CONSTRAINT `svrMediaFiles_svrId_fk` FOREIGN KEY (`svrId`) REFERENCES `siteVisitReports`(`id`) ON DELETE CASCADE,
  INDEX `svrMediaFiles_svrId_idx` (`svrId`)
);
