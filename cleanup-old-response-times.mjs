import { getDb } from "./server/db.ts";
import { supplierRates, supplierResponseTimeExclusions } from "./drizzle/schema.ts";
import { inArray } from "drizzle-orm";

console.log("🧹 Cleaning up 72h and 96h response times...\n");

try {
  const db = await getDb();
  
  // Delete 72h and 96h rates
  const deletedRates = await db
    .delete(supplierRates)
    .where(inArray(supplierRates.responseTimeHours, [72, 96]));
  
  console.log(`✅ Deleted ${deletedRates.rowsAffected || 0} rates with 72h or 96h response times`);

  // Delete 72h and 96h exclusions
  const deletedExclusions = await db
    .delete(supplierResponseTimeExclusions)
    .where(inArray(supplierResponseTimeExclusions.responseTimeHours, [72, 96]));
  
  console.log(`✅ Deleted ${deletedExclusions.rowsAffected || 0} response time exclusions for 72h or 96h`);

  console.log("\n✨ Cleanup complete!");
  process.exit(0);
} catch (error) {
  console.error("❌ Error during cleanup:", error);
  process.exit(1);
}
