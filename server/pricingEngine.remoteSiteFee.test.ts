/**
 * Tests for Pricing Engine with Remote Site Fee Integration
 * 
 * Verifies that remote site fees are correctly integrated into the pricing calculations
 * and that accounting integrity is maintained.
 */

import { describe, it, expect } from "vitest";
import { calculateJobPricing, PRICING_RULES } from "./pricingEngine";

describe("Pricing Engine with Remote Site Fee", () => {
  const baseInput = {
    supplierHourlyRateCents: 10000, // $100/hour
    durationMinutes: 240, // 4 hours
    isOOH: false,
  };

  describe("Regular hours job with remote site fee", () => {
    it("should add remote site fee to customer price", () => {
      const remoteSiteFee = {
        customerFeeCents: 2500, // $25.00 (25km beyond free zone)
        supplierFeeCents: 1250, // $12.50
        platformFeeCents: 1250, // $12.50
        nearestMajorCity: "Sydney",
        distanceKm: 75,
        billableDistanceKm: 25,
      };

      const result = calculateJobPricing({
        ...baseInput,
        remoteSiteFee,
      });

      // Base job: 4 hours × $100 = $400
      // With 15% platform fee: $400 × 1.15 = $460
      // Plus remote site fee: $460 + $25 = $485
      expect(result.customerPriceCents).toBe(48500);

      // Supplier receives: $400 base + $12.50 remote = $412.50
      expect(result.supplierPayoutCents).toBe(41250);

      // Platform receives: $60 (15% fee) + $12.50 (remote) = $72.50
      expect(result.platformRevenueCents).toBe(7250);

      // Verify accounting integrity
      expect(result.supplierPayoutCents + result.platformRevenueCents).toBe(result.customerPriceCents);
    });

    it("should include remote site fee in breakdown", () => {
      const remoteSiteFee = {
        customerFeeCents: 5000, // $50.00
        supplierFeeCents: 2500, // $25.00
        platformFeeCents: 2500, // $25.00
        nearestMajorCity: "Tokyo",
        distanceKm: 100,
        billableDistanceKm: 50,
      };

      const result = calculateJobPricing({
        ...baseInput,
        remoteSiteFee,
      });

      expect(result.breakdown.customerRemoteSiteFeeCents).toBe(5000);
      expect(result.breakdown.supplierRemoteSiteFeeCents).toBe(2500);
      expect(result.breakdown.platformRemoteSiteFeeCents).toBe(2500);
      expect(result.breakdown.remoteSiteInfo).toEqual({
        nearestMajorCity: "Tokyo",
        distanceKm: 100,
        billableDistanceKm: 50,
      });
    });
  });

  describe("OOH job with remote site fee", () => {
    it("should correctly combine OOH surcharge and remote site fee", () => {
      const remoteSiteFee = {
        customerFeeCents: 3000, // $30.00
        supplierFeeCents: 1500, // $15.00
        platformFeeCents: 1500, // $15.00
        nearestMajorCity: "London",
        distanceKm: 80,
        billableDistanceKm: 30,
      };

      const result = calculateJobPricing({
        ...baseInput,
        isOOH: true,
        remoteSiteFee,
      });

      // Base: 4 hours × $100 = $400
      // Supplier OOH premium (25%): $400 × 0.25 = $100
      // Supplier total: $400 + $100 + $15 (remote) = $515

      // Customer base with platform fee: $400 × 1.15 = $460
      // Customer OOH surcharge (50%): $400 × 0.50 = $200
      // Customer remote fee: $30
      // Customer total: $460 + $200 + $30 = $690

      expect(result.supplierPayoutCents).toBe(51500);
      expect(result.customerPriceCents).toBe(69000);

      // Platform: ($460 - $400) + ($200 - $100) + $15 = $60 + $100 + $15 = $175
      expect(result.platformRevenueCents).toBe(17500);

      // Verify accounting integrity
      expect(result.supplierPayoutCents + result.platformRevenueCents).toBe(result.customerPriceCents);
    });

    it("should handle proportional OOH with remote site fee", () => {
      const remoteSiteFee = {
        customerFeeCents: 2000, // $20.00
        supplierFeeCents: 1000, // $10.00
        platformFeeCents: 1000, // $10.00
        nearestMajorCity: "Paris",
        distanceKm: 70,
        billableDistanceKm: 20,
      };

      // Job from 4 PM to 8 PM (1 hour regular, 3 hours OOH)
      const result = calculateJobPricing({
        ...baseInput,
        isOOH: true,
        startHour: 16, // 4 PM
        startMinute: 0,
        remoteSiteFee,
      });

      // Regular hours: 1 hour × $100 = $100
      // OOH hours: 3 hours × $100 = $300
      // Supplier OOH premium (25% of OOH hours): $300 × 0.25 = $75
      // Supplier remote fee: $10
      // Supplier total: $100 + $300 + $75 + $10 = $485

      expect(result.supplierPayoutCents).toBe(48500);

      // Customer base (regular): $100 × 1.15 = $115
      // Customer base (OOH): $300 × 1.15 = $345
      // Customer OOH surcharge (50% of OOH hours): $300 × 0.50 = $150
      // Customer remote fee: $20
      // Customer total: $115 + $345 + $150 + $20 = $630

      expect(result.customerPriceCents).toBe(63000);

      // Verify accounting integrity
      expect(result.supplierPayoutCents + result.platformRevenueCents).toBe(result.customerPriceCents);
    });
  });

  describe("Job without remote site fee", () => {
    it("should work normally when remote site fee is not provided", () => {
      const result = calculateJobPricing(baseInput);

      // Base: 4 hours × $100 = $400
      // With 15% platform fee: $460
      expect(result.customerPriceCents).toBe(46000);
      expect(result.supplierPayoutCents).toBe(40000);
      expect(result.platformRevenueCents).toBe(6000);

      // Remote site fee should be zero
      expect(result.breakdown.customerRemoteSiteFeeCents).toBe(0);
      expect(result.breakdown.supplierRemoteSiteFeeCents).toBe(0);
      expect(result.breakdown.platformRemoteSiteFeeCents).toBe(0);
      expect(result.breakdown.remoteSiteInfo).toBeUndefined();
    });

    it("should handle undefined remote site fee", () => {
      const result = calculateJobPricing({
        ...baseInput,
        remoteSiteFee: undefined,
      });

      expect(result.breakdown.customerRemoteSiteFeeCents).toBe(0);
      expect(result.breakdown.supplierRemoteSiteFeeCents).toBe(0);
      expect(result.breakdown.platformRemoteSiteFeeCents).toBe(0);
    });
  });

  describe("Edge cases with remote site fee", () => {
    it("should handle minimum duration (2 hours) with remote site fee", () => {
      const remoteSiteFee = {
        customerFeeCents: 1000, // $10.00
        supplierFeeCents: 500, // $5.00
        platformFeeCents: 500, // $5.00
        nearestMajorCity: "Berlin",
        distanceKm: 60,
        billableDistanceKm: 10,
      };

      const result = calculateJobPricing({
        supplierHourlyRateCents: 10000,
        durationMinutes: 120, // 2 hours (minimum)
        isOOH: false,
        remoteSiteFee,
      });

      // Base: 2 hours × $100 = $200
      // With platform fee: $230
      // Plus remote: $230 + $10 = $240
      expect(result.customerPriceCents).toBe(24000);

      // Verify accounting integrity
      expect(result.supplierPayoutCents + result.platformRevenueCents).toBe(result.customerPriceCents);
    });

    it("should handle maximum duration (16 hours) with remote site fee", () => {
      const remoteSiteFee = {
        customerFeeCents: 15000, // $150.00 (very remote site)
        supplierFeeCents: 7500, // $75.00
        platformFeeCents: 7500, // $75.00
        nearestMajorCity: "Perth",
        distanceKm: 200,
        billableDistanceKm: 150,
      };

      const result = calculateJobPricing({
        supplierHourlyRateCents: 10000,
        durationMinutes: 960, // 16 hours (maximum)
        isOOH: false,
        remoteSiteFee,
      });

      // Base: 16 hours × $100 = $1600
      // With platform fee: $1840
      // Plus remote: $1840 + $150 = $1990
      expect(result.customerPriceCents).toBe(199000);

      // Verify accounting integrity
      expect(result.supplierPayoutCents + result.platformRevenueCents).toBe(result.customerPriceCents);
    });

    it("should handle fractional remote site fees", () => {
      const remoteSiteFee = {
        customerFeeCents: 2550, // $25.50
        supplierFeeCents: 1275, // $12.75
        platformFeeCents: 1275, // $12.75
        nearestMajorCity: "Dubai",
        distanceKm: 75.5,
        billableDistanceKm: 25.5,
      };

      const result = calculateJobPricing({
        ...baseInput,
        remoteSiteFee,
      });

      expect(result.breakdown.customerRemoteSiteFeeCents).toBe(2550);
      expect(result.breakdown.supplierRemoteSiteFeeCents).toBe(1275);
      expect(result.breakdown.platformRemoteSiteFeeCents).toBe(1275);

      // Verify accounting integrity (allow 1 cent rounding)
      const totalPaid = result.supplierPayoutCents + result.platformRevenueCents;
      expect(Math.abs(totalPaid - result.customerPriceCents)).toBeLessThanOrEqual(1);
    });
  });

  describe("Accounting integrity with remote site fee", () => {
    it("should maintain accounting integrity across various scenarios", () => {
      const scenarios = [
        {
          name: "Small remote fee",
          remoteSiteFee: { customerFeeCents: 500, supplierFeeCents: 250, platformFeeCents: 250, nearestMajorCity: "Test", distanceKm: 55, billableDistanceKm: 5 },
        },
        {
          name: "Large remote fee",
          remoteSiteFee: { customerFeeCents: 20000, supplierFeeCents: 10000, platformFeeCents: 10000, nearestMajorCity: "Test", distanceKm: 250, billableDistanceKm: 200 },
        },
        {
          name: "OOH + remote",
          remoteSiteFee: { customerFeeCents: 5000, supplierFeeCents: 2500, platformFeeCents: 2500, nearestMajorCity: "Test", distanceKm: 100, billableDistanceKm: 50 },
          isOOH: true,
        },
      ];

      scenarios.forEach(({ name, remoteSiteFee, isOOH = false }) => {
        const result = calculateJobPricing({
          ...baseInput,
          isOOH,
          remoteSiteFee,
        });

        // Customer payment must equal supplier payout + platform revenue
        const totalPaid = result.supplierPayoutCents + result.platformRevenueCents;
        expect(Math.abs(totalPaid - result.customerPriceCents)).toBeLessThanOrEqual(1);

        // Remote site fee accounting must be correct
        expect(remoteSiteFee.supplierFeeCents + remoteSiteFee.platformFeeCents).toBe(remoteSiteFee.customerFeeCents);
      });
    });
  });
});
