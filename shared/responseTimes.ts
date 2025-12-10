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
  { 
    value: 4, 
    label: "Same Business Day", 
    description: "Urgent/premium service",
    tooltip: "Response within 4 hours during business hours (9 AM - 5 PM local time). Ideal for urgent issues requiring immediate attention."
  },
  { 
    value: 24, 
    label: "Next Business Day", 
    description: "Standard fast response",
    tooltip: "Response within 24 hours (next business day). Standard service level for most requests."
  },
  { 
    value: 48, 
    label: "Scheduled", 
    description: "2 business days",
    tooltip: "Response within 48 hours (2 business days). Suitable for planned maintenance and non-urgent work."
  },
] as const;

// All response time options including legacy (for viewing existing rates)
export const ALL_RESPONSE_TIME_OPTIONS = [
  { 
    value: 4, 
    label: "Same Business Day", 
    description: "Urgent/premium service",
    tooltip: "Response within 4 hours during business hours (9 AM - 5 PM local time). Ideal for urgent issues requiring immediate attention."
  },
  { 
    value: 24, 
    label: "Next Business Day", 
    description: "Standard fast response",
    tooltip: "Response within 24 hours (next business day). Standard service level for most requests."
  },
  { 
    value: 48, 
    label: "Scheduled", 
    description: "2 business days",
    tooltip: "Response within 48 hours (2 business days). Suitable for planned maintenance and non-urgent work."
  },
  { 
    value: 72, 
    label: "72h (Legacy)", 
    description: "Extended response (legacy)",
    tooltip: "Legacy service level - no longer available for new configurations."
  },
  { 
    value: 96, 
    label: "96h (Legacy)", 
    description: "Remote/specialized (legacy)",
    tooltip: "Legacy service level - no longer available for new configurations."
  },
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

export function getResponseTimeTooltip(hours: number): string {
  const option = ALL_RESPONSE_TIME_OPTIONS.find(opt => opt.value === hours);
  return option?.tooltip || "";
}

// Check if a response time is legacy (72h or 96h)
export function isLegacyResponseTime(hours: number): boolean {
  return hours === 72 || hours === 96;
}
