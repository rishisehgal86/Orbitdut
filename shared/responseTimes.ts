/**
 * Response Time Constants
 * Standardized response time options for suppliers - Simplified to 3 service levels
 */

export const RESPONSE_TIME_OPTIONS = [
  { value: 4, label: "Same Business Day", description: "4-hour response" },
  { value: 24, label: "Next Business Day", description: "24-hour response" },
  { value: 48, label: "Scheduled", description: "48-hour response" },
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
