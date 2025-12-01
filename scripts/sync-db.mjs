#!/usr/bin/env node
/**
 * Database Sync Script
 * 
 * Syncs data between Manus sandbox database and Railway production database.
 * 
 * Usage:
 *   pnpm sync:to-railway    # Copy Manus → Railway
 *   pnpm sync:from-railway  # Copy Railway → Manus
 * 
 * Environment Variables Required:
 *   DATABASE_URL           # Manus sandbox database
 *   RAILWAY_DATABASE_URL   # Railway production database
 */

import mysql from 'mysql2/promise';

// Tables ordered by foreign key dependencies (parents before children)
const TABLES_TO_SYNC = [
  // Base tables (no dependencies)
  'users',
  'suppliers',
  
  // Tables depending on suppliers
  'supplierCoverageCountries',
  'supplierPriorityCities',
  'supplierResponseTimes',
  'supplierServiceExclusions',
  
  // Tables with multiple dependencies (sync last)
  'supplierUsers',  // depends on: users, suppliers
  'supplierRates',  // depends on: suppliers, supplierPriorityCities
  
  // Add more tables as needed
];

async function syncDatabase(sourceUrl, targetUrl, direction) {
  console.log(`\n🔄 Starting database sync: ${direction}\n`);

  let sourceDB, targetDB;

  try {
    // Connect to both databases
    console.log('📡 Connecting to source database...');
    sourceDB = await mysql.createConnection(sourceUrl);
    
    console.log('📡 Connecting to target database...');
    targetDB = await mysql.createConnection(targetUrl);

    console.log('✅ Connected to both databases\n');

    // Sync each table
    for (const table of TABLES_TO_SYNC) {
      try {
        console.log(`📋 Syncing table: ${table}`);

        // Get data from source
        const [rows] = await sourceDB.query(`SELECT * FROM ${table}`);
        
        if (rows.length === 0) {
          console.log(`   ⚠️  No data in ${table}, skipping...`);
          continue;
        }

        // Clear target table
        await targetDB.query(`DELETE FROM ${table}`);
        console.log(`   🗑️  Cleared ${table} in target`);

        // Insert data into target
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const columnNames = columns.join(', ');

        for (const row of rows) {
          const values = columns.map(col => row[col]);
          await targetDB.query(
            `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`,
            values
          );
        }

        console.log(`   ✅ Synced ${rows.length} rows to ${table}\n`);
      } catch (error) {
        console.error(`   ❌ Error syncing ${table}:`, error.message);
        console.log(`   ⏭️  Continuing with next table...\n`);
      }
    }

    console.log('✅ Database sync completed successfully!\n');
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (sourceDB) await sourceDB.end();
    if (targetDB) await targetDB.end();
  }
}

// Main execution
const direction = process.argv[2];

if (!direction || !['to-railway', 'from-railway'].includes(direction)) {
  console.error('❌ Usage: node sync-db.mjs [to-railway|from-railway]');
  process.exit(1);
}

const manusUrl = process.env.DATABASE_URL;
const railwayUrl = process.env.RAILWAY_DATABASE_URL;

if (!manusUrl || !railwayUrl) {
  console.error('❌ Missing environment variables:');
  console.error('   DATABASE_URL (Manus sandbox)');
  console.error('   RAILWAY_DATABASE_URL (Railway production)');
  process.exit(1);
}

if (direction === 'to-railway') {
  await syncDatabase(manusUrl, railwayUrl, 'Manus → Railway');
} else {
  await syncDatabase(railwayUrl, manusUrl, 'Railway → Manus');
}
