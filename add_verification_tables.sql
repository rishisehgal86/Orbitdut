-- Add isVerified field to suppliers table
ALTER TABLE suppliers ADD COLUMN isVerified INT UNSIGNED NOT NULL DEFAULT 0 AFTER verificationStatus;

-- Create supplierCompanyProfile table
CREATE TABLE IF NOT EXISTS supplierCompanyProfile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplierId INT NOT NULL UNIQUE,
  companyName VARCHAR(255) NOT NULL,
  registrationNumber VARCHAR(100),
  yearFounded INT,
  headquarters TEXT,
  regionalOffices JSON,
  ownershipStructure ENUM('private', 'group', 'subsidiary') NOT NULL,
  parentCompany VARCHAR(255),
  missionStatement TEXT,
  coreValues TEXT,
  companyOverview TEXT,
  numberOfEmployees INT,
  annualRevenue INT,
  websiteUrl VARCHAR(500),
  linkedInUrl VARCHAR(500),
  primaryContactName VARCHAR(255),
  primaryContactTitle VARCHAR(255),
  primaryContactEmail VARCHAR(320),
  primaryContactPhone VARCHAR(50),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE,
  INDEX supplierCompanyProfile_supplierId_idx (supplierId)
);

-- Create verificationDocuments table
CREATE TABLE IF NOT EXISTS verificationDocuments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplierId INT NOT NULL,
  documentType ENUM(
    'insurance_liability',
    'insurance_indemnity',
    'insurance_workers_comp',
    'dpa_signed',
    'nda_signed',
    'non_compete_signed',
    'security_compliance',
    'engineer_vetting_policy',
    'other'
  ) NOT NULL,
  documentName VARCHAR(255) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileKey VARCHAR(500) NOT NULL,
  fileSize INT NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  uploadedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploadedBy INT,
  expiryDate TIMESTAMP NULL,
  status ENUM('pending_review', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'pending_review',
  reviewedBy INT,
  reviewedAt TIMESTAMP NULL,
  reviewNotes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE,
  FOREIGN KEY (uploadedBy) REFERENCES users(id),
  FOREIGN KEY (reviewedBy) REFERENCES users(id),
  INDEX verificationDocuments_supplierId_idx (supplierId),
  INDEX verificationDocuments_documentType_idx (documentType),
  INDEX verificationDocuments_status_idx (status)
);

-- Create supplierVerification table
CREATE TABLE IF NOT EXISTS supplierVerification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplierId INT NOT NULL UNIQUE,
  status ENUM(
    'not_started',
    'in_progress',
    'pending_review',
    'under_review',
    'approved',
    'rejected',
    'resubmission_required'
  ) NOT NULL DEFAULT 'not_started',
  submittedAt TIMESTAMP NULL,
  reviewedBy INT,
  reviewedAt TIMESTAMP NULL,
  rejectionReason TEXT,
  adminNotes TEXT,
  approvedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewedBy) REFERENCES users(id),
  INDEX supplierVerification_supplierId_idx (supplierId),
  INDEX supplierVerification_status_idx (status)
);

-- Create adminOrganization table
CREATE TABLE IF NOT EXISTS adminOrganization (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create adminUsers table
CREATE TABLE IF NOT EXISTS adminUsers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  organizationId INT NOT NULL,
  role ENUM('owner', 'admin', 'viewer') NOT NULL DEFAULT 'viewer',
  permissions JSON,
  invitedBy INT,
  invitedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  isActive INT UNSIGNED NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organizationId) REFERENCES adminOrganization(id) ON DELETE CASCADE,
  FOREIGN KEY (invitedBy) REFERENCES users(id),
  INDEX adminUsers_userId_idx (userId),
  INDEX adminUsers_organizationId_idx (organizationId),
  UNIQUE INDEX adminUsers_unique (userId, organizationId)
);
