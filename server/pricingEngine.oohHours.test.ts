import { describe, it, expect } from "vitest";
import { getCustomerPricingDisplay, calculateOOHHours } from "./pricingEngine";

describe("Pricing Engine - OOH Hours Breakdown Display", () => {
  describe("calculateOOHHours", () => {
    it("should calculate 1 hour OOH when job starts at 4 PM and lasts 2 hours", () => {
      // 4 PM - 6 PM = 1 hour regular (4-5 PM) + 1 hour OOH (5-6 PM)
      const result = calculateOOHHours(16, 0, 120); // 16:00, 120 minutes
      
      expect(result.regularHours).toBe(1);
      expect(result.oohHours).toBe(1);
    });

    it("should calculate 2 hours OOH when job starts at 4 PM and lasts 4 hours", () => {
      // 4 PM - 8 PM = 1 hour regular (4-5 PM) + 3 hours OOH (5-8 PM)
      const result = calculateOOHHours(16, 0, 240); // 16:00, 240 minutes
      
      expect(result.regularHours).toBe(1);
      expect(result.oohHours).toBe(3);
    });

    it("should calculate 0.5 hours OOH when job starts at 4:30 PM and lasts 2 hours", () => {
      // 4:30 PM - 6:30 PM = 0.5 hours regular (4:30-5:00 PM) + 1.5 hours OOH (5:00-6:30 PM)
      const result = calculateOOHHours(16, 30, 120); // 16:30, 120 minutes
      
      expect(result.regularHours).toBe(0.5);
      expect(result.oohHours).toBe(1.5);
    });

    it("should calculate all hours as OOH when job is entirely after 5 PM", () => {
      // 6 PM - 8 PM = 0 hours regular + 2 hours OOH
      const result = calculateOOHHours(18, 0, 120); // 18:00, 120 minutes
      
      expect(result.regularHours).toBe(0);
      expect(result.oohHours).toBe(2);
    });

    it("should calculate all hours as regular when job is entirely within business hours", () => {
      // 10 AM - 12 PM = 2 hours regular + 0 hours OOH
      const result = calculateOOHHours(10, 0, 120); // 10:00, 120 minutes
      
      expect(result.regularHours).toBe(2);
      expect(result.oohHours).toBe(0);
    });
  });

  describe("getCustomerPricingDisplay - OOH Hours Breakdown", () => {
    it("should include OOH hours breakdown when job extends beyond business hours", () => {
      const display = getCustomerPricingDisplay({
        supplierHourlyRateCents: 10000, // $100/hr
        durationMinutes: 120, // 2 hours
        isOOH: true,
        startHour: 16, // 4 PM
        startMinute: 0,
      });

      expect(display.breakdown.isOOH).toBe(true);
      expect(display.breakdown.oohHours).toBe(1); // 1 hour OOH (5-6 PM)
      expect(display.breakdown.regularHours).toBe(1); // 1 hour regular (4-5 PM)
      expect(display.breakdown.durationHours).toBe(2);
    });

    it("should include OOH hours breakdown for job starting at 4:30 PM", () => {
      const display = getCustomerPricingDisplay({
        supplierHourlyRateCents: 10000, // $100/hr
        durationMinutes: 120, // 2 hours
        isOOH: true,
        startHour: 16, // 4:30 PM
        startMinute: 30,
      });

      expect(display.breakdown.isOOH).toBe(true);
      expect(display.breakdown.oohHours).toBe(1.5); // 1.5 hours OOH (5:00-6:30 PM)
      expect(display.breakdown.regularHours).toBe(0.5); // 0.5 hours regular (4:30-5:00 PM)
      expect(display.breakdown.durationHours).toBe(2);
    });

    it("should show all hours as OOH when job is entirely after business hours", () => {
      const display = getCustomerPricingDisplay({
        supplierHourlyRateCents: 10000, // $100/hr
        durationMinutes: 180, // 3 hours
        isOOH: true,
        startHour: 18, // 6 PM
        startMinute: 0,
      });

      expect(display.breakdown.isOOH).toBe(true);
      expect(display.breakdown.oohHours).toBe(3); // All 3 hours OOH
      expect(display.breakdown.regularHours).toBe(0);
      expect(display.breakdown.durationHours).toBe(3);
    });

    it("should not include OOH hours breakdown for regular business hours job", () => {
      const display = getCustomerPricingDisplay({
        supplierHourlyRateCents: 10000, // $100/hr
        durationMinutes: 120, // 2 hours
        isOOH: false,
        startHour: 10, // 10 AM
        startMinute: 0,
      });

      expect(display.breakdown.isOOH).toBe(false);
      expect(display.breakdown.oohHours).toBeUndefined();
      expect(display.breakdown.regularHours).toBeUndefined();
      expect(display.breakdown.durationHours).toBe(2);
    });

    it("should handle legacy OOH jobs without startHour/startMinute", () => {
      const display = getCustomerPricingDisplay({
        supplierHourlyRateCents: 10000, // $100/hr
        durationMinutes: 120, // 2 hours
        isOOH: true,
        // No startHour/startMinute provided (legacy)
      });

      expect(display.breakdown.isOOH).toBe(true);
      expect(display.breakdown.oohHours).toBe(2); // All hours treated as OOH
      expect(display.breakdown.regularHours).toBe(0);
      expect(display.breakdown.durationHours).toBe(2);
    });

    it("should calculate correct pricing with proportional OOH hours", () => {
      // Job from 4 PM to 6 PM (1 hour regular + 1 hour OOH)
      const display = getCustomerPricingDisplay({
        supplierHourlyRateCents: 10000, // $100/hr
        durationMinutes: 120, // 2 hours
        isOOH: true,
        startHour: 16, // 4 PM
        startMinute: 0,
      });

      // Base: $100 * 1 regular hour + $100 * 1 OOH hour = $200
      // Platform fee 15%: $200 * 1.15 = $230
      // OOH surcharge 50% on OOH portion only: $100 * 0.50 = $50
      // Total: $230 + $50 = $280

      expect(display.totalPriceCents).toBe(28000); // $280
      expect(display.breakdown.basePriceCents).toBe(23000); // $230 (includes platform fee)
      expect(display.breakdown.oohSurchargeCents).toBe(5000); // $50 (50% of $100 OOH base)
    });
  });
});
