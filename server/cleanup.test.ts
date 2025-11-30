/**
 * Test for orphaned rates cleanup functionality
 */
import { describe, it, expect } from "vitest";
import { cleanupOrphanedRates } from "./rates";

describe("Orphaned Rates Cleanup", () => {
  it("should remove orphaned rates for supplier 12", async () => {
    const supplierId = 12;
    
    // Run cleanup
    const deletedCount = await cleanupOrphanedRates(supplierId);
    
    console.log(`Deleted ${deletedCount} orphaned rates for supplier ${supplierId}`);
    
    // Verify some rates were deleted (supplier 12 should have orphaned rates)
    expect(deletedCount).toBeGreaterThan(0);
  });
});
