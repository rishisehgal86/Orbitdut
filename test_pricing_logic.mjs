/**
 * Test script to verify pricing calculations
 * Run with: node test_pricing_logic.mjs
 */

// Simulate the pricing calculation from pricingEngine.ts
const PRICING_RULES = {
  PLATFORM_FEE_PERCENT: 15,
  OOH_CUSTOMER_SURCHARGE_PERCENT: 50,
  OOH_SUPPLIER_PREMIUM_PERCENT: 25,
};

function calculateJobPricing(input) {
  const { supplierHourlyRateCents, durationMinutes, isOOH, remoteSiteFee } = input;
  
  const durationHours = durationMinutes / 60;
  
  // For simplicity, assume entire job is OOH if isOOH is true
  let regularHours = isOOH ? 0 : durationHours;
  let oohHours = isOOH ? durationHours : 0;
  
  // Supplier calculations
  const supplierBaseCents = Math.round(supplierHourlyRateCents * regularHours);
  const supplierOOHBaseCents = Math.round(supplierHourlyRateCents * oohHours);
  const supplierOOHPremiumCents = Math.round(supplierOOHBaseCents * PRICING_RULES.OOH_SUPPLIER_PREMIUM_PERCENT / 100);
  const supplierRemoteSiteFeeCents = remoteSiteFee?.supplierFeeCents || 0;
  const supplierTotalCents = supplierBaseCents + supplierOOHBaseCents + supplierOOHPremiumCents + supplierRemoteSiteFeeCents;
  
  // Customer calculations
  const customerRegularBaseCents = Math.round(supplierBaseCents * (1 + PRICING_RULES.PLATFORM_FEE_PERCENT / 100));
  const customerOOHBaseCents = Math.round(supplierOOHBaseCents * (1 + PRICING_RULES.PLATFORM_FEE_PERCENT / 100));
  const customerBaseCents = customerRegularBaseCents + customerOOHBaseCents;
  const customerOOHSurchargeCents = Math.round(supplierOOHBaseCents * PRICING_RULES.OOH_CUSTOMER_SURCHARGE_PERCENT / 100);
  const customerRemoteSiteFeeCents = remoteSiteFee?.customerFeeCents || 0;
  const customerTotalCents = customerBaseCents + customerOOHSurchargeCents + customerRemoteSiteFeeCents;
  
  // Platform calculations
  const platformFeeCents = customerBaseCents - (supplierBaseCents + supplierOOHBaseCents);
  const platformOOHMarginCents = customerOOHSurchargeCents - supplierOOHPremiumCents;
  const platformRemoteSiteFeeCents = remoteSiteFee?.platformFeeCents || 0;
  const platformTotalCents = platformFeeCents + platformOOHMarginCents + platformRemoteSiteFeeCents;
  
  return {
    customerPriceCents: customerTotalCents,
    supplierPayoutCents: supplierTotalCents,
    platformRevenueCents: platformTotalCents,
    breakdown: {
      supplierBaseCents,
      supplierOOHBaseCents,
      supplierOOHPremiumCents,
      supplierRemoteSiteFeeCents,
      supplierTotalCents,
      platformFeeCents,
      platformOOHMarginCents,
      platformRemoteSiteFeeCents,
      platformTotalCents,
      customerBaseCents,
      customerOOHSurchargeCents,
      customerRemoteSiteFeeCents,
      customerTotalCents,
      durationHours,
      isOOH,
    },
  };
}

// Test case from the screenshot: 5 hours @ $64.93/hour, OOH, remote site fee $7.96
console.log('=== TEST CASE: 5 hours @ $64.93/hour, OOH, Remote Site Fee ===\n');

const result = calculateJobPricing({
  supplierHourlyRateCents: 6493, // $64.93
  durationMinutes: 300, // 5 hours
  isOOH: true,
  remoteSiteFee: {
    customerFeeCents: 796, // $7.96
    supplierFeeCents: 637, // 80% to supplier
    platformFeeCents: 159, // 20% to platform
  }
});

console.log('SUPPLIER BREAKDOWN:');
console.log(`  Base (regular hours): $${(result.breakdown.supplierBaseCents / 100).toFixed(2)}`);
console.log(`  Base (OOH hours): $${(result.breakdown.supplierOOHBaseCents / 100).toFixed(2)}`);
console.log(`  OOH Premium (25%): $${(result.breakdown.supplierOOHPremiumCents / 100).toFixed(2)}`);
console.log(`  Remote Site Fee: $${(result.breakdown.supplierRemoteSiteFeeCents / 100).toFixed(2)}`);
console.log(`  TOTAL PAYOUT: $${(result.supplierPayoutCents / 100).toFixed(2)}`);

console.log('\nCUSTOMER BREAKDOWN:');
console.log(`  Base Cost (includes 15% platform fee): $${(result.breakdown.customerBaseCents / 100).toFixed(2)}`);
console.log(`  OOH Surcharge (50% of OOH hours): $${(result.breakdown.customerOOHSurchargeCents / 100).toFixed(2)}`);
console.log(`  Remote Site Fee: $${(result.breakdown.customerRemoteSiteFeeCents / 100).toFixed(2)}`);
console.log(`  TOTAL PRICE: $${(result.customerPriceCents / 100).toFixed(2)}`);

console.log('\nPLATFORM BREAKDOWN:');
console.log(`  Platform Fee (15%): $${(result.breakdown.platformFeeCents / 100).toFixed(2)}`);
console.log(`  OOH Margin (50% - 25%): $${(result.breakdown.platformOOHMarginCents / 100).toFixed(2)}`);
console.log(`  Remote Site Fee: $${(result.breakdown.platformRemoteSiteFeeCents / 100).toFixed(2)}`);
console.log(`  TOTAL REVENUE: $${(result.platformRevenueCents / 100).toFixed(2)}`);

console.log('\nVERIFICATION:');
console.log(`  Customer Pays: $${(result.customerPriceCents / 100).toFixed(2)}`);
console.log(`  Supplier Gets: $${(result.supplierPayoutCents / 100).toFixed(2)}`);
console.log(`  Platform Gets: $${(result.platformRevenueCents / 100).toFixed(2)}`);
console.log(`  Sum (Supplier + Platform): $${((result.supplierPayoutCents + result.platformRevenueCents) / 100).toFixed(2)}`);
console.log(`  Match: ${result.customerPriceCents === result.supplierPayoutCents + result.platformRevenueCents ? '✅' : '❌'}`);

console.log('\n=== WHAT CUSTOMER SHOULD SEE ===');
console.log(`  Base service cost: $${(result.breakdown.customerBaseCents / 100).toFixed(2)}`);
console.log(`  + OOH Surcharge (50%): $${(result.breakdown.customerOOHSurchargeCents / 100).toFixed(2)}`);
console.log(`  + Remote Site Fee: $${(result.breakdown.customerRemoteSiteFeeCents / 100).toFixed(2)}`);
console.log(`  = Estimated Total: $${(result.customerPriceCents / 100).toFixed(2)}`);

