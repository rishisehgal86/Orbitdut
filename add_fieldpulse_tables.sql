-- Add FieldPulse tables to Orbidut database

-- Job Status History Table
CREATE TABLE IF NOT EXISTS `jobStatusHistory` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobId` int NOT NULL,
  `status` varchar(50) NOT NULL,
  `notes` text,
  `latitude` varchar(50),
  `longitude` varchar(50),
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `jobStatusHistory_id` PRIMARY KEY(`id`),
  CONSTRAINT `jobStatusHistory_jobId_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE,
  INDEX `jobStatusHistory_jobId_idx` (`jobId`)
);

-- Job Locations Table
CREATE TABLE IF NOT EXISTS `
