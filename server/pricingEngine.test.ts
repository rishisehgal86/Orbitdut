import { describe, it, expect } from "vitest";
import {
  calculateJobPricing,
  getCustomerPricingDisplay,
  getSupplierPayoutDisplay,
  getAdminPricingDisplay,
  calculatePriceRange,
  PRICING_RULES,
  formatPrice,
  isValidDuration,
} from "./pricingEngine";

describe("Pricing Engine - Core Rules", () => {
  it("should enforce 15% platform fee", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000, // $100/hr
      durationMinutes: 120, // 2 hours
      isOOH: false,
    });

    // Supplier base: $100/hr * 2hr = $200 = 20000 cents
    expect(result.supplierPayoutCents).toBe(20000);
    
    // Platform fee: 15% of 20000 = 3000 cents
    expect(result.platformRevenueCents).toBe(3000);
    
    // Customer pays: 20000 + 3000 = 23000 cents
    expect(result.customerPriceCents).toBe(23000);
  });

  it("should charge customers 50% OOH surcharge", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000, // $100/hr
      durationMinutes: 120, // 2 hours
      isOOH: true,
    });

    // Supplier base: $100/hr * 2hr = $200 = 20000 cents
    // Supplier OOH premium (25%): 5000 cents
    // Supplier total: 25000 cents
    expect(result.supplierPayoutCents).toBe(25000);
    
    // Customer base (with 15% platform fee): 23000 cents
    // Customer OOH surcharge (50% of supplier base): 10000 cents
    // Customer total: 33000 cents
    expect(result.customerPriceCents).toBe(33000);
    
    // Platform earns: 3000 (fee) + 5000 (OOH margin) = 8000 cents
    expect(result.platformRevenueCents).toBe(8000);
  });

  it("should pay suppliers 25% OOH premium", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: true,
    });

    // Supplier base: 20000 cents
    // Supplier OOH premium: 25% of 20000 = 5000 cents
    expect(result.breakdown.supplierOOHPremiumCents).toBe(5000);
    expect(result.breakdown.supplierTotalCents).toBe(25000);
  });

  it("should give platform 25% OOH margin (difference between customer surcharge and supplier premium)", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: true,
    });

    // Customer OOH surcharge: 50% of 20000 = 10000 cents
    // Supplier OOH premium: 25% of 20000 = 5000 cents
    // Platform OOH margin: 10000 - 5000 = 5000 cents
    expect(result.breakdown.platformOOHMarginCents).toBe(5000);
  });

  it("should maintain accounting integrity (customer payment = supplier payout + platform revenue)", () => {
    const testCases = [
      { rate: 5000, duration: 120, isOOH: false },
      { rate: 10000, duration: 240, isOOH: false },
      { rate: 15000, duration: 180, isOOH: true },
      { rate: 20000, duration: 480, isOOH: true },
    ];

    testCases.forEach(({ rate, duration, isOOH }) => {
      const result = calculateJobPricing({
        supplierHourlyRateCents: rate,
        durationMinutes: duration,
        isOOH,
      });

      const total = result.supplierPayoutCents + result.platformRevenueCents;
      expect(total).toBe(result.customerPriceCents);
    });
  });
});

describe("Pricing Engine - Duration Validation", () => {
  it("should enforce minimum 2 hour duration", () => {
    expect(() =>
      calculateJobPricing({
        supplierHourlyRateCents: 10000,
        durationMinutes: 60, // 1 hour - below minimum
        isOOH: false,
      })
    ).toThrow("Duration must be at least 2 hours");
  });

  it("should enforce maximum 16 hour duration", () => {
    expect(() =>
      calculateJobPricing({
        supplierHourlyRateCents: 10000,
        durationMinutes: 1020, // 17 hours - above maximum
        isOOH: false,
      })
    ).toThrow("Duration cannot exceed 16 hours");
  });

  it("should accept valid durations", () => {
    const validDurations = [120, 180, 240, 480, 960]; // 2, 3, 4, 8, 16 hours
    
    validDurations.forEach(duration => {
      expect(() =>
        calculateJobPricing({
          supplierHourlyRateCents: 10000,
          durationMinutes: duration,
          isOOH: false,
        })
      ).not.toThrow();
    });
  });

  it("should validate duration correctly", () => {
    expect(isValidDuration(60)).toBe(false); // 1 hour
    expect(isValidDuration(120)).toBe(true); // 2 hours
    expect(isValidDuration(960)).toBe(true); // 16 hours
    expect(isValidDuration(1020)).toBe(false); // 17 hours
  });
});

describe("Pricing Engine - Customer Display", () => {
  it("should hide platform fee from customer display", () => {
    const display = getCustomerPricingDisplay({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: false,
    });

    // Should not expose platform fee percentage
    expect(display.breakdown).not.toHaveProperty("platformFeePercent");
    
    // Should show total price (which includes platform fee)
    expect(display.totalPriceCents).toBe(23000);
  });

  it("should show OOH surcharge percentage to customers", () => {
    const display = getCustomerPricingDisplay({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: true,
    });

    expect(display.breakdown.isOOH).toBe(true);
    expect(display.breakdown.oohSurchargeCents).toBe(10000);
  });

  it("should show correct base price (including hidden platform fee)", () => {
    const display = getCustomerPricingDisplay({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: false,
    });

    // Base price should include platform fee but not show it separately
    expect(display.breakdown.basePriceCents).toBe(23000); // 20000 * 1.15
  });
});

describe("Pricing Engine - Supplier Display", () => {
  it("should show supplier their payout correctly", () => {
    const display = getSupplierPayoutDisplay({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: false,
    });

    expect(display.totalPayoutCents).toBe(20000);
    expect(display.breakdown.basePayoutCents).toBe(20000);
    expect(display.breakdown.oohPremiumCents).toBe(0);
  });

  it("should show supplier their 25% OOH premium", () => {
    const display = getSupplierPayoutDisplay({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: true,
    });

    expect(display.breakdown.basePayoutCents).toBe(20000);
    expect(display.breakdown.oohPremiumCents).toBe(5000); // 25% of base
    expect(display.totalPayoutCents).toBe(25000);
  });

  it("should not expose customer pricing or platform revenue to suppliers", () => {
    const display = getSupplierPayoutDisplay({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: true,
    });

    expect(display).not.toHaveProperty("customerPriceCents");
    expect(display).not.toHaveProperty("platformRevenueCents");
  });
});

describe("Pricing Engine - Admin Display", () => {
  it("should show complete breakdown to admins", () => {
    const display = getAdminPricingDisplay({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: true,
    });

    expect(display.customerPays).toBe(33000);
    expect(display.supplierReceives).toBe(25000);
    expect(display.platformEarns).toBe(8000);
    
    // Should have full breakdown
    expect(display.breakdown.supplierBaseCents).toBe(20000);
    expect(display.breakdown.supplierOOHPremiumCents).toBe(5000);
    expect(display.breakdown.platformFeeCents).toBe(3000);
    expect(display.breakdown.platformOOHMarginCents).toBe(5000);
    expect(display.breakdown.customerOOHSurchargeCents).toBe(10000);
  });
});

describe("Pricing Engine - Multi-Supplier Range", () => {
  it("should calculate price range from multiple suppliers", () => {
    const supplierRates = [8000, 10000, 12000]; // $80, $100, $120 per hour
    
    const range = calculatePriceRange(supplierRates, 120, false);

    // Min: $80/hr * 2hr * 1.15 = $184 = 18400 cents
    expect(range.minPriceCents).toBe(18400);
    
    // Max: $120/hr * 2hr * 1.15 = $276 = 27600 cents
    expect(range.maxPriceCents).toBe(27600);
    
    // Avg: (18400 + 23000 + 27600) / 3 = 23000 cents
    expect(range.avgPriceCents).toBe(23000);
    
    expect(range.supplierCount).toBe(3);
  });

  it("should calculate OOH price range correctly", () => {
    const supplierRates = [10000]; // $100/hr
    
    const range = calculatePriceRange(supplierRates, 120, true);

    // Customer pays: base (23000) + OOH surcharge (10000) = 33000
    expect(range.avgPriceCents).toBe(33000);
    expect(range.breakdown.isOOH).toBe(true);
    expect(range.breakdown.oohSurchargePercent).toBe(50);
  });

  it("should require at least one supplier rate", () => {
    expect(() =>
      calculatePriceRange([], 120, false)
    ).toThrow("At least one supplier rate is required");
  });
});

describe("Pricing Engine - Real-World Scenarios", () => {
  it("should calculate pricing for 4-hour same-day job", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 12500, // $125/hr
      durationMinutes: 240, // 4 hours
      isOOH: false,
    });

    // Supplier: $125 * 4 = $500 = 50000 cents
    expect(result.supplierPayoutCents).toBe(50000);
    
    // Platform: 15% of 50000 = 7500 cents
    expect(result.platformRevenueCents).toBe(7500);
    
    // Customer: 50000 + 7500 = 57500 cents = $575
    expect(result.customerPriceCents).toBe(57500);
  });

  it("should calculate pricing for 8-hour overnight job", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 15000, // $150/hr
      durationMinutes: 480, // 8 hours
      isOOH: true,
    });

    // Supplier base: $150 * 8 = $1200 = 120000 cents
    // Supplier OOH: 25% of 120000 = 30000 cents
    // Supplier total: 150000 cents = $1500
    expect(result.supplierPayoutCents).toBe(150000);
    
    // Platform fee: 15% of 120000 = 18000 cents
    // Platform OOH margin: 50% - 25% = 25% of 120000 = 30000 cents
    // Platform total: 48000 cents = $480
    expect(result.platformRevenueCents).toBe(48000);
    
    // Customer: 150000 + 48000 = 198000 cents = $1980
    expect(result.customerPriceCents).toBe(198000);
  });

  it("should handle minimum 2-hour job", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000,
      durationMinutes: 120,
      isOOH: false,
    });

    expect(result.breakdown.durationHours).toBe(2);
    expect(result.supplierPayoutCents).toBe(20000);
    expect(result.customerPriceCents).toBe(23000);
  });

  it("should handle maximum 16-hour job", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000,
      durationMinutes: 960,
      isOOH: false,
    });

    expect(result.breakdown.durationHours).toBe(16);
    expect(result.supplierPayoutCents).toBe(160000); // $1600
    expect(result.customerPriceCents).toBe(184000); // $1840
  });
});

describe("Pricing Engine - Utility Functions", () => {
  it("should format prices correctly", () => {
    expect(formatPrice(23000)).toBe("$230.00");
    expect(formatPrice(100)).toBe("$1.00");
    expect(formatPrice(12345)).toBe("$123.45");
  });
});

describe("Pricing Engine - Constants Protection", () => {
  it("should expose pricing rules as read-only constants", () => {
    expect(PRICING_RULES.PLATFORM_FEE_PERCENT).toBe(15);
    expect(PRICING_RULES.OOH_CUSTOMER_SURCHARGE_PERCENT).toBe(50);
    expect(PRICING_RULES.OOH_SUPPLIER_PREMIUM_PERCENT).toBe(25);
    expect(PRICING_RULES.MIN_DURATION_HOURS).toBe(2);
    expect(PRICING_RULES.MAX_DURATION_HOURS).toBe(16);
  });
});
