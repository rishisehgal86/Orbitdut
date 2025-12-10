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

// Response Times (in hours) - 3 active levels + 2 legacy
// New rate configuration should only use: 4, 24, 48
// 72 and 96 are preserved for backward compatibility only
export const RESPONSE_TIME_HOURS = [4, 24, 48, 72, 96] as const;

// Active response times for new configurations (3 levels)
export const ACTIVE_RESPONSE_TIME_HOURS = [4, 24, 48] as const;

export type RateResponseTime = typeof RESPONSE_TIME_HOURS[number];
export type ActiveRateResponseTime = typeof ACTIVE_RESPONSE_TIME_HOURS[number];

// Semantic labels for response times
export const RESPONSE_TIME_LABELS: Record<RateResponseTime, string> = {
  4: "Same Business Day",
  24: "Next Business Day",
  48: "Scheduled",
  72: "72h (Legacy)", // Preserved for existing data
  96: "96h (Legacy)", // Preserved for existing data
};

// For UI components - array of objects with hours and label
// Only includes active 3 levels for new rate configuration
export const RATE_RESPONSE_TIMES = [
  { 
    hours: 4, 
    label: "Same Business Day",
    tooltip: "Response within 4 hours during business hours (9 AM - 5 PM local time). Ideal for urgent issues requiring immediate attention."
  },
  { 
    hours: 24, 
    label: "Next Business Day",
    tooltip: "Response within 24 hours (next business day). Standard service level for most requests."
  },
  { 
    hours: 48, 
    label: "Scheduled",
    tooltip: "Response within 48 hours (2 business days). Suitable for planned maintenance and non-urgent work."
  },
];

// All response times including legacy (for viewing existing rates)
export const ALL_RATE_RESPONSE_TIMES = [
  { 
    hours: 4, 
    label: "Same Business Day",
    tooltip: "Response within 4 hours during business hours (9 AM - 5 PM local time). Ideal for urgent issues requiring immediate attention."
  },
  { 
    hours: 24, 
    label: "Next Business Day",
    tooltip: "Response within 24 hours (next business day). Standard service level for most requests."
  },
  { 
    hours: 48, 
    label: "Scheduled",
    tooltip: "Response within 48 hours (2 business days). Suitable for planned maintenance and non-urgent work."
  },
  { 
    hours: 72, 
    label: "72h (Legacy)",
    tooltip: "Legacy service level - no longer available for new configurations."
  },
  { 
    hours: 96, 
    label: "96h (Legacy)",
    tooltip: "Legacy service level - no longer available for new configurations."
  },
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

// Region mapping for countries
export const COUNTRY_REGIONS: Record<string, string> = {
  // Africa
  "DZ": "Africa", "AO": "Africa", "BJ": "Africa", "BW": "Africa", "BF": "Africa",
  "BI": "Africa", "CM": "Africa", "CV": "Africa", "CF": "Africa", "TD": "Africa",
  "KM": "Africa", "CG": "Africa", "CD": "Africa", "CI": "Africa", "DJ": "Africa",
  "EG": "Africa", "GQ": "Africa", "ER": "Africa", "ET": "Africa", "GA": "Africa",
  "GM": "Africa", "GH": "Africa", "GN": "Africa", "GW": "Africa", "KE": "Africa",
  "LS": "Africa", "LR": "Africa", "LY": "Africa", "MG": "Africa", "MW": "Africa",
  "ML": "Africa", "MR": "Africa", "MU": "Africa", "YT": "Africa", "MA": "Africa",
  "MZ": "Africa", "NA": "Africa", "NE": "Africa", "NG": "Africa", "RE": "Africa",
  "RW": "Africa", "ST": "Africa", "SN": "Africa", "SC": "Africa", "SL": "Africa",
  "SO": "Africa", "ZA": "Africa", "SS": "Africa", "SD": "Africa", "SZ": "Africa",
  "TZ": "Africa", "TG": "Africa", "TN": "Africa", "UG": "Africa", "ZM": "Africa",
  "ZW": "Africa",
  
  // Americas
  "AI": "Americas", "AG": "Americas", "AR": "Americas", "AW": "Americas", "BS": "Americas",
  "BB": "Americas", "BZ": "Americas", "BM": "Americas", "BO": "Americas", "BR": "Americas",
  "CA": "Americas", "KY": "Americas", "CL": "Americas", "CO": "Americas", "CR": "Americas",
  "CU": "Americas", "CW": "Americas", "DM": "Americas", "DO": "Americas", "EC": "Americas",
  "SV": "Americas", "FK": "Americas", "GF": "Americas", "GL": "Americas", "GD": "Americas",
  "GP": "Americas", "GT": "Americas", "GY": "Americas", "HT": "Americas", "HN": "Americas",
  "JM": "Americas", "MQ": "Americas", "MX": "Americas", "MS": "Americas", "NI": "Americas",
  "PA": "Americas", "PY": "Americas", "PE": "Americas", "PR": "Americas", "BL": "Americas",
  "KN": "Americas", "LC": "Americas", "MF": "Americas", "PM": "Americas", "VC": "Americas",
  "SR": "Americas", "TT": "Americas", "TC": "Americas", "US": "Americas", "UY": "Americas",
  "VE": "Americas", "VG": "Americas", "VI": "Americas",
  
  // Asia
  "AF": "Asia", "AM": "Asia", "AZ": "Asia", "BH": "Asia", "BD": "Asia",
  "BT": "Asia", "BN": "Asia", "KH": "Asia", "CN": "Asia", "GE": "Asia",
  "HK": "Asia", "IN": "Asia", "ID": "Asia", "IR": "Asia", "IQ": "Asia",
  "IL": "Asia", "JP": "Asia", "JO": "Asia", "KZ": "Asia", "KW": "Asia",
  "KG": "Asia", "LA": "Asia", "LB": "Asia", "MO": "Asia", "MY": "Asia",
  "MV": "Asia", "MN": "Asia", "MM": "Asia", "NP": "Asia", "KP": "Asia",
  "OM": "Asia", "PK": "Asia", "PS": "Asia", "PH": "Asia", "QA": "Asia",
  "SA": "Asia", "SG": "Asia", "KR": "Asia", "LK": "Asia", "SY": "Asia",
  "TW": "Asia", "TJ": "Asia", "TH": "Asia", "TL": "Asia", "TR": "Asia",
  "TM": "Asia", "AE": "Asia", "UZ": "Asia", "VN": "Asia", "YE": "Asia",
  
  // Europe
  "AX": "Europe", "AL": "Europe", "AD": "Europe", "AT": "Europe", "BY": "Europe",
  "BE": "Europe", "BA": "Europe", "BG": "Europe", "HR": "Europe", "CY": "Europe",
  "CZ": "Europe", "DK": "Europe", "EE": "Europe", "FO": "Europe", "FI": "Europe",
  "FR": "Europe", "DE": "Europe", "GI": "Europe", "GR": "Europe", "GG": "Europe",
  "HU": "Europe", "IS": "Europe", "IE": "Europe", "IM": "Europe", "IT": "Europe",
  "JE": "Europe", "XK": "Europe", "LV": "Europe", "LI": "Europe", "LT": "Europe",
  "LU": "Europe", "MK": "Europe", "MT": "Europe", "MD": "Europe", "MC": "Europe",
  "ME": "Europe", "NL": "Europe", "NO": "Europe", "PL": "Europe", "PT": "Europe",
  "RO": "Europe", "RU": "Europe", "SM": "Europe", "RS": "Europe", "SK": "Europe",
  "SI": "Europe", "ES": "Europe", "SJ": "Europe", "SE": "Europe", "CH": "Europe",
  "UA": "Europe", "GB": "Europe", "VA": "Europe",
  
  // Oceania
  "AS": "Oceania", "AU": "Oceania", "CK": "Oceania", "FJ": "Oceania", "PF": "Oceania",
  "GU": "Oceania", "KI": "Oceania", "MH": "Oceania", "FM": "Oceania", "NR": "Oceania",
  "NC": "Oceania", "NZ": "Oceania", "NU": "Oceania", "NF": "Oceania", "MP": "Oceania",
  "PW": "Oceania", "PG": "Oceania", "PN": "Oceania", "WS": "Oceania", "SB": "Oceania",
  "TK": "Oceania", "TO": "Oceania", "TV": "Oceania", "VU": "Oceania", "WF": "Oceania",
};
