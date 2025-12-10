/**
 * Response Time Constants
 * Standardized response time options for suppliers
 */

export const RESPONSE_TIME_OPTIONS = [
  { value: 4, label: "Within 4 hours", description: "Premium/urgent service" },
  { value: 24, label: "Next business day", description: "Standard fast response" },
  { value: 48, label: "Next business day + 1", description: "Standard response" },
  { value: 72, label: "2+ business days", description: "Extended response" },
  { value: 96, label: "3+ business days", description: "Remote/specialized service" },
] as const;

export type ResponseTimeValue = typeof RESPONSE_TIME_OPTIONS[number]["value"];

export function getResponseTimeLabel(hours: number): string {
  const option = RESPONSE_TIME_OPTIONS.find(opt => opt.value === hours);
  return option?.label || `${hours} hours`;
}

export function getResponseTimeDescription(hours: number): string {
  const option = RESPONSE_TIME_OPTIONS.find(opt => opt.value === hours);
  return option?.description || "";
}
