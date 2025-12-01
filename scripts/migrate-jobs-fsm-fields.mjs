#!/usr/bin/env node
/**
 * Manual migration script to add FSM fields to jobs table
 * Run with: node scripts/migrate-jobs-fsm-fields.mjs
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function migrate() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('📝 Adding FSM fields to jobs table...\n');
    
    const alterStatements = [
      // Unique identifier for shareable links
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jobToken VARCHAR(64) UNIQUE AFTER id",
      
      // Site Information
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS siteName VARCHAR(255) AFTER customerPhone",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS siteId VARCHAR(100) AFTER siteName",
      "ALTER TABLE jobs CHANGE COLUMN address siteAddress TEXT NOT NULL",
      "ALTER TABLE jobs CHANGE COLUMN latitude siteLatitude VARCHAR(50)",
      "ALTER TABLE jobs CHANGE COLUMN longitude siteLongitude VARCHAR(50)",
      
      // Site Contact Information
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS siteContactName VARCHAR(255) AFTER postalCode",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS siteContactNumber VARCHAR(50) AFTER siteContactName",
      
      // Job Details
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS incidentDetails TEXT AFTER description",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scopeOfWork TEXT AFTER incidentDetails",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS changeNumber VARCHAR(100) AFTER scopeOfWork",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS incidentNumber VARCHAR(100) AFTER changeNumber",
      
      // Technical Requirements
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS toolsRequired TEXT AFTER incidentNumber",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deviceDetails TEXT AFTER toolsRequired",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS downTime BOOLEAN DEFAULT FALSE AFTER deviceDetails",
      
      // Scheduling
      "ALTER TABLE jobs CHANGE COLUMN scheduledStart scheduledDateTime TIMESTAMP",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hoursRequired VARCHAR(100) AFTER scheduledDateTime",
      
      // Booking Type and Duration
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS bookingType ENUM('full_day', 'hourly', 'multi_day') AFTER estimatedDuration",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimatedHours INT AFTER bookingType",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimatedDays INT AFTER estimatedHours",
      
      // Time Scheduling and Negotiation
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requestedStartDate TIMESTAMP AFTER estimatedDays",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requestedStartTime VARCHAR(10) AFTER requestedStartDate",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS proposedStartDate TIMESTAMP AFTER requestedStartTime",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS proposedStartTime VARCHAR(10) AFTER proposedStartDate",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS confirmedStartDate TIMESTAMP AFTER proposedStartTime",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS confirmedStartTime VARCHAR(10) AFTER confirmedStartDate",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS timeNegotiationNotes TEXT AFTER confirmedStartTime",
      
      // Timezone
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) AFTER timeNegotiationNotes",
      
      // Pricing updates
      "ALTER TABLE jobs MODIFY COLUMN calculatedPrice INT",
      "ALTER TABLE jobs MODIFY COLUMN currency VARCHAR(3) DEFAULT 'USD'",
      
      // Additional Information
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT AFTER currency",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS videoConferenceLink VARCHAR(500) AFTER notes",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS coveredByCOI BOOLEAN DEFAULT TRUE AFTER videoConferenceLink",
      
      // Update status enum to include new states
      "ALTER TABLE jobs MODIFY COLUMN status ENUM('pending_supplier_acceptance', 'assigned_to_supplier', 'accepted', 'declined', 'en_route', 'on_site', 'completed', 'cancelled') NOT NULL DEFAULT 'pending_supplier_acceptance'",
      
      // Engineer/Technician Information
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS engineerName VARCHAR(255) AFTER status",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS engineerEmail VARCHAR(320) AFTER engineerName",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS engineerPhone VARCHAR(50) AFTER engineerEmail",
      
      // Timestamps
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS enRouteAt TIMESTAMP AFTER acceptedAt",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS arrivedAt TIMESTAMP AFTER enRouteAt",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancelledAt TIMESTAMP AFTER completedAt",
      
      // Cancellation tracking
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancellationReason VARCHAR(500) AFTER cancelledAt",
      "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancelledBy VARCHAR(255) AFTER cancellationReason",
    ];
    
    for (const statement of alterStatements) {
      try {
        await connection.execute(statement);
        console.log('✅', statement.substring(0, 80) + '...');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⏭️  Column already exists, skipping...');
        } else {
          console.error('❌ Error:', error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
