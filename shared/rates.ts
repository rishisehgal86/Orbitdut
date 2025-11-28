/**
 * Shared constants for rate management system
 */

export const SERVICE_TYPES = [
  { value: "L1_EUC", label: "L1 End User Computing" },
  { value: "L1_NETWORK", label: "L1 Network Support" },
  { value: "SMART_HANDS", label: "Smart Hands" },
] as const;

export type ServiceType = typeof SERVICE_TYPES[number]["value"];

export const RATE_RESPONSE_TIMES = [
  { hours: 4, label: "4 hours (Emergency)", shortLabel: "4h" },
  { hours: 24, label: "24 hours (Next business day)", shortLabel: "24h" },
  { hours: 48, label: "48 hours (2 business days)", shortLabel: "48h" },
  { hours: 72, label: "72 hours (3 business days)", shortLabel: "72h" },
  { hours: 96, label: "96 hours (4 business days)", shortLabel: "96h" },
] as const;

export type RateResponseTime = typeof RATE_RESPONSE_TIMES[number]["hours"];

/**
 * Convert USD dollars to cents for database storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to USD dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as USD currency string
 */
export function formatCurrency(cents: number | null): string {
  if (cents === null) return "Not offered";
  return `$${centsToDollars(cents).toFixed(2)}`;
}
