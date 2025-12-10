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

// Service Levels
export const SERVICE_LEVELS = {
  SAME_BUSINESS_DAY: "same_business_day",
  NEXT_BUSINESS_DAY: "next_business_day",
  SCHEDULED: "scheduled",
} as const;

export type ServiceLevel = typeof SERVICE_LEVELS[keyof typeof SERVICE_LEVELS];

export const SERVICE_LEVEL_LABELS: Record<ServiceLevel, string> = {
  [SERVICE_LEVELS.SAME_BUSINESS_DAY]: "Same Business Day",
  [SERVICE_LEVELS.NEXT_BUSINESS_DAY]: "Next Business Day",
  [SERVICE_LEVELS.SCHEDULED]: "Scheduled",
};

export const SERVICE_LEVEL_DESCRIPTIONS: Record<ServiceLevel, string> = {
  [SERVICE_LEVELS.SAME_BUSINESS_DAY]: "Service completed within today's business hours. Best for urgent issues and critical downtime.",
  [SERVICE_LEVELS.NEXT_BUSINESS_DAY]: "Service scheduled for next business day. Best for important but not critical issues.",
  [SERVICE_LEVELS.SCHEDULED]: "Service scheduled 2+ business days out. Best for planned maintenance and non-urgent work.",
};

// For UI components - array of objects with value and label
export const RATE_SERVICE_LEVELS = [
  { 
    value: SERVICE_LEVELS.SAME_BUSINESS_DAY, 
    label: "Same Business Day",
    description: "Service completed within today's business hours",
    icon: "🔴",
    color: "red"
  },
  { 
    value: SERVICE_LEVELS.NEXT_BUSINESS_DAY, 
    label: "Next Business Day",
    description: "Service scheduled for next business day",
    icon: "🟡",
    color: "yellow"
  },
  { 
    value: SERVICE_LEVELS.SCHEDULED, 
    label: "Scheduled",
    description: "Service scheduled 2+ business days out",
    icon: "🟢",
    color: "green"
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
