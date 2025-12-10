/**
 * Migration script: Convert responseTimeHours to serviceLevel
 * 
 * Mapping:
 * - 4h → same_business_day
 * - 24h → next_business_day
 * - 48h, 72h, 96h → scheduled
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

console.log("🔄 Starting migration: responseTimeHours → serviceLevel\n");

const connection = await mysql.createConnection(DATABASE_URL);

try {
  // Step 1: Add serviceLevel columns to all tables
  console.log("📋 Step 1: Adding serviceLevel columns...");
  
  await connection.query(`
    ALTER TABLE supplierRates 
    ADD COLUMN serviceLevel ENUM('same_business_day', 'next_business_day', 'scheduled') NULL
    AFTER serviceType
  `).catch(e => {
    if (!e.message.includes("Duplicate column")) throw e;
    console.log("   ⚠️  Column already exists in supplierRates");
  });
  
  await connection.query(`
    ALTER TABLE supplierResponseTimeExclusions 
    ADD COLUMN serviceLevel ENUM('same_business_day', 'next_business_day', 'scheduled') NULL
    AFTER serviceType
  `).catch(e => {
    if (!e.message.includes("Duplicate column")) throw e;
    console.log("   ⚠️  Column already exists in supplierResponseTimeExclusions");
  });
  
  await connection.query(`
    ALTER TABLE supplierResponseTimes 
    ADD COLUMN serviceLevel ENUM('same_business_day', 'next_business_day', 'scheduled') NULL
    AFTER cityName
  `).catch(e => {
    if (!e.message.includes("Duplicate column")) throw e;
    console.log("   ⚠️  Column already exists in supplierResponseTimes");
  });
  
  // Jobs table doesn't have responseTimeHours - serviceLevel will be added as new field
  
  console.log("✅ Step 1 complete\n");
  
  // Step 2: Migrate data from responseTimeHours to serviceLevel
  console.log("📋 Step 2: Migrating data...");
  
  // supplierRates
  await connection.query(`
    UPDATE supplierRates 
    SET serviceLevel = CASE 
      WHEN responseTimeHours = 4 THEN 'same_business_day'
      WHEN responseTimeHours = 24 THEN 'next_business_day'
      WHEN responseTimeHours IN (48, 72, 96) THEN 'scheduled'
      ELSE NULL
    END
    WHERE responseTimeHours IS NOT NULL
  `);
  const [ratesResult] = await connection.query("SELECT COUNT(*) as count FROM supplierRates WHERE serviceLevel IS NOT NULL");
  console.log(`   ✅ Migrated ${ratesResult[0].count} supplier rates`);
  
  // supplierResponseTimeExclusions
  await connection.query(`
    UPDATE supplierResponseTimeExclusions 
    SET serviceLevel = CASE 
      WHEN responseTimeHours = 4 THEN 'same_business_day'
      WHEN responseTimeHours = 24 THEN 'next_business_day'
      WHEN responseTimeHours IN (48, 72, 96) THEN 'scheduled'
      ELSE NULL
    END
    WHERE responseTimeHours IS NOT NULL
  `);
  const [exclusionsResult] = await connection.query("SELECT COUNT(*) as count FROM supplierResponseTimeExclusions WHERE serviceLevel IS NOT NULL");
  console.log(`   ✅ Migrated ${exclusionsResult[0].count} response time exclusions`);
  
  // supplierResponseTimes
  await connection.query(`
    UPDATE supplierResponseTimes 
    SET serviceLevel = CASE 
      WHEN responseTimeHours = 4 THEN 'same_business_day'
      WHEN responseTimeHours = 24 THEN 'next_business_day'
      WHEN responseTimeHours IN (48, 72, 96) THEN 'scheduled'
      ELSE NULL
    END
    WHERE responseTimeHours IS NOT NULL
  `);
  const [responseTimesResult] = await connection.query("SELECT COUNT(*) as count FROM supplierResponseTimes WHERE serviceLevel IS NOT NULL");
  console.log(`   ✅ Migrated ${responseTimesResult[0].count} response times`);
  
  // Jobs table doesn't need migration - no existing responseTimeHours column
  console.log(`   ✅ Jobs table ready (serviceLevel will be populated from new requests)`);
  
  console.log("✅ Step 2 complete\n");
  
  // Step 3: Make serviceLevel NOT NULL and drop responseTimeHours
  console.log("📋 Step 3: Finalizing schema changes...");
  
  // Check if there are any NULL serviceLevels that would prevent NOT NULL constraint
  const [nullRates] = await connection.query("SELECT COUNT(*) as count FROM supplierRates WHERE serviceLevel IS NULL AND responseTimeHours IS NOT NULL");
  const [nullExclusions] = await connection.query("SELECT COUNT(*) as count FROM supplierResponseTimeExclusions WHERE serviceLevel IS NULL AND responseTimeHours IS NOT NULL");
  const [nullResponseTimes] = await connection.query("SELECT COUNT(*) as count FROM supplierResponseTimes WHERE serviceLevel IS NULL AND responseTimeHours IS NOT NULL");
  
  if (nullRates[0].count > 0 || nullExclusions[0].count > 0 || nullResponseTimes[0].count > 0) {
    console.error(`❌ Found unmigrated rows! Rates: ${nullRates[0].count}, Exclusions: ${nullExclusions[0].count}, ResponseTimes: ${nullResponseTimes[0].count}`);
    throw new Error("Data migration incomplete");
  }
  
  // Make serviceLevel NOT NULL for tables that require it
  await connection.query(`
    ALTER TABLE supplierRates 
    MODIFY COLUMN serviceLevel ENUM('same_business_day', 'next_business_day', 'scheduled') NOT NULL
  `);
  
  await connection.query(`
    ALTER TABLE supplierResponseTimeExclusions 
    MODIFY COLUMN serviceLevel ENUM('same_business_day', 'next_business_day', 'scheduled') NOT NULL
  `);
  
  await connection.query(`
    ALTER TABLE supplierResponseTimes 
    MODIFY COLUMN serviceLevel ENUM('same_business_day', 'next_business_day', 'scheduled') NOT NULL
  `);
  
  // Drop old responseTimeHours columns
  await connection.query(`ALTER TABLE supplierRates DROP COLUMN responseTimeHours`).catch(e => {
    if (!e.message.includes("check that it exists")) throw e;
    console.log("   ⚠️  Column responseTimeHours already dropped from supplierRates");
  });
  
  await connection.query(`ALTER TABLE supplierResponseTimeExclusions DROP COLUMN responseTimeHours`).catch(e => {
    if (!e.message.includes("check that it exists")) throw e;
    console.log("   ⚠️  Column responseTimeHours already dropped from supplierResponseTimeExclusions");
  });
  
  await connection.query(`ALTER TABLE supplierResponseTimes DROP COLUMN responseTimeHours`).catch(e => {
    if (!e.message.includes("check that it exists")) throw e;
    console.log("   ⚠️  Column responseTimeHours already dropped from supplierResponseTimes");
  });
  
  // Jobs table never had responseTimeHours column
  
  console.log("✅ Step 3 complete\n");
    console.log("\n🎉 Migration completed successfully!\n");
  console.log("Summary:");
  console.log(`  - ${ratesResult[0].count} supplier rates migrated`);
  console.log(`  - ${exclusionsResult[0].count} exclusions migrated`);
  console.log(`  - ${responseTimesResult[0].count} response times migrated`);
  console.log(`  - Jobs table ready for new service level field`);  
} catch (error) {
  console.error("\n❌ Migration failed:", error.message);
  console.error(error);
  process.exit(1);
} finally {
  await connection.end();
}
