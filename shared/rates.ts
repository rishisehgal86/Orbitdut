/**
 * Shared constants and utilities for supplier rates
 */

// Service Types
export const SERVICE_TYPES = {
  L1_EUC: "L1_EUC",
  L1_NETWORK: "L1_NETWORK",
  SMART_HANDS: "SMART_HANDS",
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [SERVICE_TYPES.L1_EUC]: "L1 End User Computing",
  [SERVICE_TYPES.L1_NETWORK]: "L1 Network Support",
  [SERVICE_TYPES.SMART_HANDS]: "Smart Hands",
};

// For UI components - array of objects with value and label
export const RATE_SERVICE_TYPES = [
  { value: SERVICE_TYPES.L1_EUC, label: "L1 End User Computing" },
  { value: SERVICE_TYPES.L1_NETWORK, label: "L1 Network Support" },
  { value: SERVICE_TYPES.SMART_HANDS, label: "Smart Hands" },
];

// Response Times (in hours)
export const RESPONSE_TIME_HOURS = [4, 24, 48, 72, 96] as const;

export type RateResponseTime = typeof RESPONSE_TIME_HOURS[number];

export const RESPONSE_TIME_LABELS: Record<RateResponseTime, string> = {
  4: "4h",
  24: "24h",
  48: "48h",
  72: "72h",
  96: "96h",
};

// For UI components - array of objects with hours and label
export const RATE_RESPONSE_TIMES = [
  { hours: 4, label: "4h" },
  { hours: 24, label: "24h" },
  { hours: 48, label: "48h" },
  { hours: 72, label: "72h" },
  { hours: 96, label: "96h" },
];

// Currency utilities
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number, currency: string = "USD"): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(dollars);
}
