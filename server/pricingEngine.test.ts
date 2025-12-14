import { describe, it, expect } from "vitest";
import {
  calculateJobPricing,
  getCustomerPricingDisplay,
  getSupplierPayoutDisplay,
  getAdminPricingDisplay,
  calculatePriceRange,
  calculateOOHHours,
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
    // Note: Legacy behavior (no startHour) = entire job is OOH
    // supplierBaseCents = 0 (no regular hours)
    // All work is in OOH hours
    expect(display.breakdown.supplierBaseCents).toBe(0);
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

describe("Pricing Engine - Proportional OOH Calculation", () => {
  it("should calculate OOH hours for job starting at 4 PM and ending at 7 PM (3 hours)", () => {
    
    // 4 PM - 7 PM = 1 hour regular (4-5 PM) + 2 hours OOH (5-7 PM)
    const result = calculateOOHHours(16, 0, 180); // 16:00, 180 minutes
    
    expect(result.regularHours).toBe(1);
    expect(result.oohHours).toBe(2);
  });

  it("should calculate OOH hours for job starting at 3 PM and ending at 6 PM (3 hours)", () => {
    
    // 3 PM - 6 PM = 2 hours regular (3-5 PM) + 1 hour OOH (5-6 PM)
    const result = calculateOOHHours(15, 0, 180); // 15:00, 180 minutes
    
    expect(result.regularHours).toBe(2);
    expect(result.oohHours).toBe(1);
  });

  it("should calculate OOH hours for job starting at 7 AM and ending at 11 AM (4 hours)", () => {
    
    // 7 AM - 11 AM = 2 hours OOH (7-9 AM) + 2 hours regular (9-11 AM)
    const result = calculateOOHHours(7, 0, 240); // 07:00, 240 minutes
    
    expect(result.regularHours).toBe(2);
    expect(result.oohHours).toBe(2);
  });

  it("should calculate OOH hours for job entirely within business hours", () => {
    
    // 10 AM - 2 PM = 4 hours regular, 0 hours OOH
    const result = calculateOOHHours(10, 0, 240); // 10:00, 240 minutes
    
    expect(result.regularHours).toBe(4);
    expect(result.oohHours).toBe(0);
  });

  it("should calculate OOH hours for job entirely outside business hours", () => {
    
    // 6 PM - 10 PM = 0 hours regular, 4 hours OOH
    const result = calculateOOHHours(18, 0, 240); // 18:00, 240 minutes
    
    expect(result.regularHours).toBe(0);
    expect(result.oohHours).toBe(4);
  });

  it("should apply proportional OOH pricing for job from 4 PM to 7 PM", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000, // $100/hr
      durationMinutes: 180, // 3 hours
      isOOH: true,
      startHour: 16, // 4 PM
      startMinute: 0,
    });

    // Regular hours (4-5 PM): $100 * 1 hour = $100 = 10000 cents
    // OOH hours (5-7 PM): $100 * 2 hours = $200 = 20000 cents
    // OOH premium (25% of OOH hours): 25% * 20000 = 5000 cents
    // Supplier total: 10000 + 20000 + 5000 = 35000 cents
    expect(result.supplierPayoutCents).toBe(35000);

    // Customer regular base (with 15% fee): 10000 * 1.15 = 11500 cents
    // Customer OOH base (with 15% fee): 20000 * 1.15 = 23000 cents
    // Customer OOH surcharge (50% of OOH base): 50% * 20000 = 10000 cents
    // Customer total: 11500 + 23000 + 10000 = 44500 cents
    expect(result.customerPriceCents).toBe(44500);

    // Platform fee: (11500 - 10000) + (23000 - 20000) = 1500 + 3000 = 4500 cents
    // Platform OOH margin: 10000 - 5000 = 5000 cents
    // Platform total: 4500 + 5000 = 9500 cents
    expect(result.platformRevenueCents).toBe(9500);

    // Verify accounting integrity
    expect(result.supplierPayoutCents + result.platformRevenueCents).toBe(result.customerPriceCents);
  });

  it("should apply proportional OOH pricing for job from 3 PM to 6 PM", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000, // $100/hr
      durationMinutes: 180, // 3 hours
      isOOH: true,
      startHour: 15, // 3 PM
      startMinute: 0,
    });

    // Regular hours (3-5 PM): $100 * 2 hours = $200 = 20000 cents
    // OOH hours (5-6 PM): $100 * 1 hour = $100 = 10000 cents
    // OOH premium (25% of OOH hours): 25% * 10000 = 2500 cents
    // Supplier total: 20000 + 10000 + 2500 = 32500 cents
    expect(result.supplierPayoutCents).toBe(32500);

    // Customer regular base (with 15% fee): 20000 * 1.15 = 23000 cents
    // Customer OOH base (with 15% fee): 10000 * 1.15 = 11500 cents
    // Customer OOH surcharge (50% of OOH base): 50% * 10000 = 5000 cents
    // Customer total: 23000 + 11500 + 5000 = 39500 cents
    expect(result.customerPriceCents).toBe(39500);

    // Verify accounting integrity
    expect(result.supplierPayoutCents + result.platformRevenueCents).toBe(result.customerPriceCents);
  });

  it("should handle job with minutes (4:30 PM to 7:30 PM)", () => {
    
    // 4:30 PM - 7:30 PM = 0.5 hours regular (4:30-5:00 PM) + 2.5 hours OOH (5:00-7:30 PM)
    const result = calculateOOHHours(16, 30, 180); // 16:30, 180 minutes
    
    expect(result.regularHours).toBe(0.5);
    expect(result.oohHours).toBe(2.5);
  });

  it("should fall back to legacy behavior when startHour is not provided", () => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: 10000, // $100/hr
      durationMinutes: 180, // 3 hours
      isOOH: true,
      // No startHour/startMinute provided
    });

    // Legacy behavior: entire job is OOH
    // OOH hours: $100 * 3 hours = $300 = 30000 cents
    // OOH premium (25%): 25% * 30000 = 7500 cents
    // Supplier total: 30000 + 7500 = 37500 cents
    expect(result.supplierPayoutCents).toBe(37500);
  });

  it("should maintain accounting integrity for proportional OOH jobs", () => {
    const testCases = [
      { startHour: 16, startMinute: 0, duration: 180 }, // 4 PM - 7 PM
      { startHour: 15, startMinute: 0, duration: 180 }, // 3 PM - 6 PM
      { startHour: 7, startMinute: 0, duration: 240 },  // 7 AM - 11 AM
      { startHour: 16, startMinute: 30, duration: 180 }, // 4:30 PM - 7:30 PM
    ];

    testCases.forEach(({ startHour, startMinute, duration }) => {
      const result = calculateJobPricing({
        supplierHourlyRateCents: 10000,
        durationMinutes: duration,
        isOOH: true,
        startHour,
        startMinute,
      });

      const total = result.supplierPayoutCents + result.platformRevenueCents;
      expect(total).toBe(result.customerPriceCents);
    });
  });
});


describe('Pricing Engine - Detailed Breakdown for Display', () => {
  it('should return detailed breakdown fields in calculatePriceRange', () => {
    const result = calculatePriceRange(
      [6493], // Single supplier at $64.93/hour
      300, // 5 hours
      true, // OOH
      undefined,
      undefined,
      {
        customerFeeCents: 796,
        supplierFeeCents: 637,
        platformFeeCents: 159,
        nearestMajorCity: 'Sydney',
        distanceKm: 150,
        billableDistanceKm: 50,
      }
    );

    // Verify all detailed breakdown fields exist
    expect(result.breakdown).toHaveProperty('minBaseCents');
    expect(result.breakdown).toHaveProperty('maxBaseCents');
    expect(result.breakdown).toHaveProperty('avgBaseCents');
    expect(result.breakdown).toHaveProperty('minOOHSurchargeCents');
    expect(result.breakdown).toHaveProperty('maxOOHSurchargeCents');
    expect(result.breakdown).toHaveProperty('avgOOHSurchargeCents');

    // Verify exact values for single supplier case
    expect(result.breakdown.avgBaseCents).toBe(37335); // $373.35
    expect(result.breakdown.avgOOHSurchargeCents).toBe(16233); // $162.33
    expect(result.avgPriceCents).toBe(54364); // $543.64
  });

  it('should calculate correct breakdown range for multiple suppliers with OOH', () => {
    const result = calculatePriceRange(
      [6000, 6500, 7000], // $60, $65, $70 per hour
      300, // 5 hours
      true, // OOH
    );

    // Verify min < avg < max for base costs
    expect(result.breakdown.minBaseCents).toBeLessThan(result.breakdown.avgBaseCents);
    expect(result.breakdown.avgBaseCents).toBeLessThan(result.breakdown.maxBaseCents);

    // Verify min < avg < max for OOH surcharges
    expect(result.breakdown.minOOHSurchargeCents).toBeLessThan(result.breakdown.avgOOHSurchargeCents);
    expect(result.breakdown.avgOOHSurchargeCents).toBeLessThan(result.breakdown.maxOOHSurchargeCents);

    // Verify total = base + OOH (no remote fee in this case)
    const calculatedMin = result.breakdown.minBaseCents + result.breakdown.minOOHSurchargeCents;
    const calculatedMax = result.breakdown.maxBaseCents + result.breakdown.maxOOHSurchargeCents;
    
    expect(result.minPriceCents).toBe(calculatedMin);
    expect(result.maxPriceCents).toBe(calculatedMax);
  });

  it('should show zero OOH surcharge for regular hours', () => {
    const result = calculatePriceRange(
      [5000, 6000],
      120, // 2 hours
      false, // Not OOH
    );

    expect(result.breakdown.isOOH).toBe(false);
    expect(result.breakdown.minOOHSurchargeCents).toBe(0);
    expect(result.breakdown.maxOOHSurchargeCents).toBe(0);
    expect(result.breakdown.avgOOHSurchargeCents).toBe(0);

    // Total should equal base for regular hours
    expect(result.minPriceCents).toBe(result.breakdown.minBaseCents);
    expect(result.maxPriceCents).toBe(result.breakdown.maxBaseCents);
  });

  it('should provide transparent pricing breakdown matching screenshot scenario', () => {
    // Scenario from user's screenshot: 5 hours @ $64.93/hour, OOH, $7.96 remote fee
    const result = calculatePriceRange(
      [6493],
      300,
      true,
      undefined,
      undefined,
      {
        customerFeeCents: 796,
        supplierFeeCents: 637,
        platformFeeCents: 159,
        nearestMajorCity: 'Sydney',
        distanceKm: 150,
        billableDistanceKm: 50,
      }
    );

    // What customer should see:
    // Base service cost: $373.35
    expect(result.breakdown.avgBaseCents).toBe(37335);
    
    // + OOH Surcharge (50%): $162.33
    expect(result.breakdown.avgOOHSurchargeCents).toBe(16233);
    
    // + Remote Site Fee: $7.96 (passed separately, not in breakdown)
    // = Estimated Total: $543.64
    expect(result.avgPriceCents).toBe(54364);

    // Verify the math: base + OOH + remote = total
    const calculatedTotal = result.breakdown.avgBaseCents + result.breakdown.avgOOHSurchargeCents + 796;
    expect(calculatedTotal).toBe(result.avgPriceCents);
  });
});
