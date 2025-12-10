/**
 * Response Time Constants
 * Standardized response time options for suppliers
 * 
 * System uses 3 active levels + 2 legacy levels:
 * - 4h: Same Business Day (urgent/premium)
 * - 24h: Next Business Day (standard)
 * - 48h: Scheduled (2 business days)
 * - 72h, 96h: Legacy (preserved for backward compatibility)
 */

// Active response time options (3 levels for new configurations)
export const RESPONSE_TIME_OPTIONS = [
  { value: 4, label: "Same Business Day", description: "Urgent/premium service" },
  { value: 24, label: "Next Business Day", description: "Standard fast response" },
  { value: 48, label: "Scheduled", description: "2 business days" },
] as const;

// All response time options including legacy (for viewing existing rates)
export const ALL_RESPONSE_TIME_OPTIONS = [
  { value: 4, label: "Same Business Day", description: "Urgent/premium service" },
  { value: 24, label: "Next Business Day", description: "Standard fast response" },
  { value: 48, label: "Scheduled", description: "2 business days" },
  { value: 72, label: "72h (Legacy)", description: "Extended response (legacy)" },
  { value: 96, label: "96h (Legacy)", description: "Remote/specialized (legacy)" },
] as const;

export type ResponseTimeValue = typeof RESPONSE_TIME_OPTIONS[number]["value"];
export type AllResponseTimeValue = typeof ALL_RESPONSE_TIME_OPTIONS[number]["value"];

export function getResponseTimeLabel(hours: number): string {
  const option = ALL_RESPONSE_TIME_OPTIONS.find(opt => opt.value === hours);
  return option?.label || `${hours} hours`;
}

export function getResponseTimeDescription(hours: number): string {
  const option = ALL_RESPONSE_TIME_OPTIONS.find(opt => opt.value === hours);
  return option?.description || "";
}

// Check if a response time is legacy (72h or 96h)
export function isLegacyResponseTime(hours: number): boolean {
  return hours === 72 || hours === 96;
}
