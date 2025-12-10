import { describe, it, expect } from "vitest";
import {
  RESPONSE_TIME_OPTIONS,
  ALL_RESPONSE_TIME_OPTIONS,
  getResponseTimeLabel,
  getResponseTimeDescription,
  isLegacyResponseTime,
} from "../shared/responseTimes";
import {
  RATE_RESPONSE_TIMES,
  ALL_RATE_RESPONSE_TIMES,
  RESPONSE_TIME_LABELS,
  ACTIVE_RESPONSE_TIME_HOURS,
} from "../shared/rates";

describe("Response Time Constants", () => {
  it("should have 3 active response time options", () => {
    expect(RESPONSE_TIME_OPTIONS).toHaveLength(3);
    expect(ACTIVE_RESPONSE_TIME_HOURS).toHaveLength(3);
    expect(RATE_RESPONSE_TIMES).toHaveLength(3);
  });

  it("should have 5 total response time options including legacy", () => {
    expect(ALL_RESPONSE_TIME_OPTIONS).toHaveLength(5);
    expect(ALL_RATE_RESPONSE_TIMES).toHaveLength(5);
  });

  it("should have correct semantic labels for active response times", () => {
    expect(RESPONSE_TIME_OPTIONS[0]).toEqual({
      value: 4,
      label: "Same Business Day",
      description: "Urgent/premium service",
    });
    expect(RESPONSE_TIME_OPTIONS[1]).toEqual({
      value: 24,
      label: "Next Business Day",
      description: "Standard fast response",
    });
    expect(RESPONSE_TIME_OPTIONS[2]).toEqual({
      value: 48,
      label: "Scheduled",
      description: "2 business days",
    });
  });

  it("should have legacy labels for 72h and 96h", () => {
    expect(RESPONSE_TIME_LABELS[72]).toBe("72h (Legacy)");
    expect(RESPONSE_TIME_LABELS[96]).toBe("96h (Legacy)");
  });

  it("should correctly identify legacy response times", () => {
    expect(isLegacyResponseTime(4)).toBe(false);
    expect(isLegacyResponseTime(24)).toBe(false);
    expect(isLegacyResponseTime(48)).toBe(false);
    expect(isLegacyResponseTime(72)).toBe(true);
    expect(isLegacyResponseTime(96)).toBe(true);
  });

  it("should return correct labels via getResponseTimeLabel", () => {
    expect(getResponseTimeLabel(4)).toBe("Same Business Day");
    expect(getResponseTimeLabel(24)).toBe("Next Business Day");
    expect(getResponseTimeLabel(48)).toBe("Scheduled");
    expect(getResponseTimeLabel(72)).toBe("72h (Legacy)");
    expect(getResponseTimeLabel(96)).toBe("96h (Legacy)");
  });

  it("should return correct descriptions via getResponseTimeDescription", () => {
    expect(getResponseTimeDescription(4)).toBe("Urgent/premium service");
    expect(getResponseTimeDescription(24)).toBe("Standard fast response");
    expect(getResponseTimeDescription(48)).toBe("2 business days");
  });

  it("should maintain backward compatibility with all 5 response times in database", () => {
    // Verify all 5 values are still valid in the system
    const allValues = ALL_RESPONSE_TIME_OPTIONS.map(opt => opt.value);
    expect(allValues).toEqual([4, 24, 48, 72, 96]);
  });

  it("should only show 3 active options for new rate configuration", () => {
    const activeValues = RATE_RESPONSE_TIMES.map(rt => rt.hours);
    expect(activeValues).toEqual([4, 24, 48]);
  });
});
