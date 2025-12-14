/**
 * Tests for Remote Site Fee Calculator
 * 
 * Business Rules:
 * - Free zone: 0-50km from nearest major city (250k+ population)
 * - Remote site fee: $1.00 USD per km for distance beyond 50km
 * - Customer pays: $1.00/km
 * - Supplier receives: $0.50/km
 * - Platform keeps: $0.50/km (50% margin on travel fees)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateRemoteSiteFee, REMOTE_SITE_FEE_RULES } from "./remoteSiteFeeCalculator";

// Mock the geonames module
vi.mock("./geonames", () => ({
  findNearestMajorCity: vi.fn(),
}));

import { findNearestMajorCity } from "./geonames";

describe("Remote Site Fee Calculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Sites within free zone (< 50km)", () => {
    it("should return zero fee for site 30km from major city", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "New York",
        distanceKm: 30,
        countryCode: "US",
        countryName: "United States",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: 40.7128,
        siteLongitude: -74.0060,
      });

      expect(result.isRemoteSite).toBe(false);
      expect(result.hasNearbyMajorCity).toBe(true);
      expect(result.isServiceable).toBe(true);
      expect(result.nearestMajorCity).toBe("New York");
      expect(result.distanceToMajorCityKm).toBe(30);
      expect(result.billableDistanceKm).toBe(0);
      expect(result.customerFeeCents).toBe(0);
      expect(result.supplierFeeCents).toBe(0);
      expect(result.platformFeeCents).toBe(0);
    });

    it("should return zero fee for site exactly 50km from major city", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "London",
        distanceKm: 50,
        countryCode: "GB",
        countryName: "United Kingdom",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: 51.5074,
        siteLongitude: -0.1278,
      });

      expect(result.isRemoteSite).toBe(false);
      expect(result.isServiceable).toBe(true);
      expect(result.billableDistanceKm).toBe(0);
      expect(result.customerFeeCents).toBe(0);
    });
  });

  describe("Sites beyond free zone (> 50km)", () => {
    it("should calculate correct fee for site 75km from major city", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "Sydney",
        distanceKm: 75,
        countryCode: "AU",
        countryName: "Australia",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: -33.8688,
        siteLongitude: 151.2093,
      });

      expect(result.isRemoteSite).toBe(true);
      expect(result.hasNearbyMajorCity).toBe(true);
      expect(result.isServiceable).toBe(true);
      expect(result.nearestMajorCity).toBe("Sydney");
      expect(result.distanceToMajorCityKm).toBe(75);
      expect(result.billableDistanceKm).toBe(25); // 75 - 50 = 25km

      // Customer pays $1/km for 25km = $25.00 = 2500 cents
      expect(result.customerFeeCents).toBe(2500);

      // Supplier receives $0.50/km for 25km = $12.50 = 1250 cents
      expect(result.supplierFeeCents).toBe(1250);

      // Platform keeps $0.50/km for 25km = $12.50 = 1250 cents
      expect(result.platformFeeCents).toBe(1250);
    });

    it("should calculate correct fee for site 100km from major city", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "Tokyo",
        distanceKm: 100,
        countryCode: "JP",
        countryName: "Japan",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: 35.6762,
        siteLongitude: 139.6503,
      });

      expect(result.billableDistanceKm).toBe(50); // 100 - 50 = 50km
      expect(result.customerFeeCents).toBe(5000); // $50.00
      expect(result.supplierFeeCents).toBe(2500); // $25.00
      expect(result.platformFeeCents).toBe(2500); // $25.00
    });

    it("should calculate correct fee for very remote site (200km)", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "Perth",
        distanceKm: 200,
        countryCode: "AU",
        countryName: "Australia",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: -31.9505,
        siteLongitude: 115.8605,
      });

      expect(result.billableDistanceKm).toBe(150); // 200 - 50 = 150km
      expect(result.customerFeeCents).toBe(15000); // $150.00
      expect(result.supplierFeeCents).toBe(7500); // $75.00
      expect(result.platformFeeCents).toBe(7500); // $75.00
    });
  });

  describe("Sites with no nearby major city", () => {
    it("should mark location as unserviceable when no major city found within 300km", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue(null);

      const result = await calculateRemoteSiteFee({
        siteLatitude: 0,
        siteLongitude: 0,
      });

      expect(result.isRemoteSite).toBe(false);
      expect(result.hasNearbyMajorCity).toBe(false);
      expect(result.isServiceable).toBe(false); // NEW: Location is unserviceable
      expect(result.nearestMajorCity).toBe(null);
      expect(result.distanceToMajorCityKm).toBe(null);
      expect(result.billableDistanceKm).toBe(0);
      expect(result.customerFeeCents).toBe(0);
      expect(result.supplierFeeCents).toBe(0);
      expect(result.platformFeeCents).toBe(0);
    });
  });

  describe("Accounting integrity", () => {
    it("should ensure customer fee equals supplier fee plus platform fee", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "Paris",
        distanceKm: 80,
        countryCode: "FR",
        countryName: "France",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: 48.8566,
        siteLongitude: 2.3522,
      });

      // Verify accounting integrity
      const calculatedTotal = result.supplierFeeCents + result.platformFeeCents;
      expect(Math.abs(calculatedTotal - result.customerFeeCents)).toBeLessThanOrEqual(1);
    });

    it("should maintain 50/50 split between supplier and platform", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "Berlin",
        distanceKm: 120,
        countryCode: "DE",
        countryName: "Germany",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: 52.5200,
        siteLongitude: 13.4050,
      });

      // Supplier and platform should receive equal amounts
      expect(result.supplierFeeCents).toBe(result.platformFeeCents);

      // Each should be 50% of customer fee
      expect(result.supplierFeeCents).toBeCloseTo(result.customerFeeCents / 2, 0);
    });
  });

  describe("Edge cases", () => {
    it("should handle fractional distances correctly", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "Dubai",
        distanceKm: 75.5,
        countryCode: "AE",
        countryName: "United Arab Emirates",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: 25.2048,
        siteLongitude: 55.2708,
      });

      expect(result.billableDistanceKm).toBe(25.5); // 75.5 - 50 = 25.5km
      expect(result.customerFeeCents).toBe(2550); // $25.50
      expect(result.supplierFeeCents).toBe(1275); // $12.75
      expect(result.platformFeeCents).toBe(1275); // $12.75
    });

    it("should handle site just beyond free zone (50.1km)", async () => {
      vi.mocked(findNearestMajorCity).mockResolvedValue({
        cityName: "Singapore",
        distanceKm: 50.1,
        countryCode: "SG",
        countryName: "Singapore",
      });

      const result = await calculateRemoteSiteFee({
        siteLatitude: 1.3521,
        siteLongitude: 103.8198,
      });

      expect(result.isRemoteSite).toBe(true);
      expect(result.billableDistanceKm).toBeCloseTo(0.1, 1);
      expect(result.customerFeeCents).toBe(10); // $0.10
    });
  });

  describe("Business rules constants", () => {
    it("should have correct fee structure constants", () => {
      expect(REMOTE_SITE_FEE_RULES.FREE_ZONE_KM).toBe(50);
      expect(REMOTE_SITE_FEE_RULES.CUSTOMER_RATE_PER_KM_USD).toBe(1.00);
      expect(REMOTE_SITE_FEE_RULES.SUPPLIER_RATE_PER_KM_USD).toBe(0.50);
      expect(REMOTE_SITE_FEE_RULES.PLATFORM_RATE_PER_KM_USD).toBe(0.50);
      expect(REMOTE_SITE_FEE_RULES.SEARCH_RADIUS_KM).toBe(300);
    });

    it("should maintain 50/50 revenue split in constants", () => {
      const supplierRate = REMOTE_SITE_FEE_RULES.SUPPLIER_RATE_PER_KM_USD;
      const platformRate = REMOTE_SITE_FEE_RULES.PLATFORM_RATE_PER_KM_USD;
      const customerRate = REMOTE_SITE_FEE_RULES.CUSTOMER_RATE_PER_KM_USD;

      expect(supplierRate + platformRate).toBe(customerRate);
      expect(supplierRate).toBe(platformRate);
    });
  });
});
