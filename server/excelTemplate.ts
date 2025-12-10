import * as XLSX from "xlsx";
import { getDb } from "./db";
import { supplierRates, supplierCoverageCountries, supplierPriorityCities } from "../drizzle/schema";
import { eq, and, or } from "drizzle-orm";
import { COUNTRIES } from "../shared/countries";

const SERVICE_TYPES = [
  { value: "l1_end_user_computing", label: "L1 End User Computing" },
  { value: "l1_network_support", label: "L1 Network Support" },
  { value: "smart_hands", label: "Smart Hands" },
];

const RESPONSE_TIMES = [4, 24, 48, 72, 96];

const REGIONS = {
  africa: "Africa",
  americas: "Americas",
  asia: "Asia",
  europe: "Europe",
  oceania: "Oceania",
};

export async function generateExcelTemplate(supplierId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get supplier's covered countries
  const coveredCountries = await db
    .select()
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));

  const coveredCountryCodes = coveredCountries.map((c) => c.countryCode);

  // Get supplier's priority cities
  const coveredCities = await db
    .select()
    .from(supplierPriorityCities)
    .where(eq(supplierPriorityCities.supplierId, supplierId));

  // Get all current rates for this supplier
  const allRates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));

  // Create a workbook
  const workbook = XLSX.utils.book_new();

  // Generate sheets for each service type
  for (const service of SERVICE_TYPES) {
    // Countries sheet
    const countriesData = generateCountriesSheet(
      coveredCountryCodes,
      service.value,
      allRates
    );
    const countriesSheet = XLSX.utils.aoa_to_sheet(countriesData);
    
    // Style fixed columns (first 3 columns)
    styleFixedColumns(countriesSheet, countriesData.length);
    
    // Excel sheet names must be ≤31 chars
    // "L1 End User Computing - Countries" = 33 chars (too long)
    // Shorten to "L1 EUC - Countries" = 20 chars
    const shortLabel = service.label
      .replace("End User Computing", "EUC")
      .replace("Network Support", "Network")
      .replace("Smart Hands", "Smart Hands");
    
    XLSX.utils.book_append_sheet(
      workbook,
      countriesSheet,
      `${shortLabel} - Countries`
    );

    // Cities sheet
    const citiesData = generateCitiesSheet(coveredCities, service.value, allRates);
    const citiesSheet = XLSX.utils.aoa_to_sheet(citiesData);
    
    // Style fixed columns (first 4 columns for cities: City, State, Country, Code)
    styleFixedColumns(citiesSheet, citiesData.length, 4);
    
    XLSX.utils.book_append_sheet(
      workbook,
      citiesSheet,
      `${shortLabel} - Cities`
    );
  }

  // Generate Excel file as base64
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const base64 = excelBuffer.toString("base64");

  return {
    filename: `orbidut-rates-template-${Date.now()}.xlsx`,
    data: base64,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

function generateCountriesSheet(
  coveredCountryCodes: string[],
  serviceType: string,
  allRates: any[]
): any[][] {
  const headers = [
    "Region",
    "Country",
    "Country Code",
    "4h Rate (USD)",
    "24h Rate (USD)",
    "48h Rate (USD)",
    "72h Rate (USD)",
    "96h Rate (USD)",
  ];

  const rows: any[][] = [headers];

  // Filter countries by coverage
  const coveredCountryData = COUNTRIES.filter((country: typeof COUNTRIES[0]) =>
    coveredCountryCodes.includes(country.code)
  );

  // Sort by region, then by name
  coveredCountryData.sort((a: typeof COUNTRIES[0], b: typeof COUNTRIES[0]) => {
    if (a.region !== b.region) {
      return a.region.localeCompare(b.region);
    }
    return a.name.localeCompare(b.name);
  });

  for (const country of coveredCountryData) {
    const row = [
      REGIONS[country.region as keyof typeof REGIONS] || country.region,
      country.name,
      country.code,
    ];

    // Add rate columns
    for (const responseTime of RESPONSE_TIMES) {
      const rate = allRates.find(
        (r) =>
          r.countryCode === country.code &&
          r.serviceType === serviceType &&
          r.responseTimeHours === responseTime &&
          r.rateUsdCents !== null
      );

      if (rate && rate.rateUsdCents !== null) {
        row.push((rate.rateUsdCents / 100).toFixed(2));
      } else {
        row.push("");
      }
    }

    rows.push(row);
  }

  return rows;
}

function generateCitiesSheet(
  coveredCities: Array<{
    id: number;
    cityName: string;
    stateProvince: string | null;
    countryCode: string;
  }>,
  serviceType: string,
  allRates: any[]
): any[][] {
  const headers = [
    "City",
    "State/Province",
    "Country",
    "Country Code",
    "4h Rate (USD)",
    "24h Rate (USD)",
    "48h Rate (USD)",
    "72h Rate (USD)",
    "96h Rate (USD)",
  ];

  const rows: any[][] = [headers];

  // Sort by country, then by name
  const sortedCities = [...coveredCities].sort((a, b) => {
    if ((a.countryCode || "") !== (b.countryCode || "")) {
      return (a.countryCode || "").localeCompare(b.countryCode || "");
    }
    return (a.cityName || "").localeCompare(b.cityName || "");
  });

  for (const city of sortedCities) {
    const country = COUNTRIES.find((c: typeof COUNTRIES[0]) => c.code === city.countryCode);
    
    const row = [
      city.cityName || "",
      city.stateProvince || "",
      country?.name || city.countryCode || "",
      city.countryCode || "",
    ];

    // Add rate columns
    for (const responseTime of RESPONSE_TIMES) {
      const rate = allRates.find(
        (r) =>
          r.cityId === city.id &&
          r.serviceType === serviceType &&
          r.responseTimeHours === responseTime &&
          r.rateUsdCents !== null
      );

      if (rate && rate.rateUsdCents !== null) {
        row.push((rate.rateUsdCents / 100).toFixed(2));
      } else {
        row.push("");
      }
    }

    rows.push(row);
  }

  return rows;
}

function styleFixedColumns(sheet: XLSX.WorkSheet, rowCount: number, fixedColCount: number = 3) {
  // Add cell styling for fixed columns (light gray background)
  // Note: xlsx library has limited styling support in free version
  // This is a placeholder for future enhancement with xlsx-style or similar
  
  // Set column widths
  const colWidths = [];
  for (let i = 0; i < fixedColCount; i++) {
    colWidths.push({ wch: 20 }); // Fixed columns
  }
  for (let i = 0; i < 5; i++) {
    colWidths.push({ wch: 15 }); // Rate columns
  }
  
  sheet['!cols'] = colWidths;
}
