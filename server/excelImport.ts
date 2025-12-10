import * as XLSX from 'xlsx';
import { RATE_SERVICE_TYPES, RATE_SERVICE_LEVELS } from "../shared/rates";

const SERVICE_TYPES = RATE_SERVICE_TYPES;
const SERVICE_LEVELS = RATE_SERVICE_LEVELS;

export interface ParsedRate {
  serviceType: string;
  locationType: "country" | "city";
  countryCode?: string;
  cityId?: number;
  cityName?: string;
  serviceLevel: string;
  rateUsd: number;
  rowNumber: number;
}

export interface ValidationError {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

export interface ParseResult {
  rates: ParsedRate[];
  errors: ValidationError[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    byService: Record<string, { valid: number; errors: number }>;
  };
}

/**
 * Parse uploaded Excel file and extract rates
 */
export async function parseExcelFile(base64Data: string): Promise<ParseResult> {
  const buffer = Buffer.from(base64Data, "base64");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  
  console.log('[Excel Import] Starting parse...');
  console.log('[Excel Import] Sheet names:', workbook.SheetNames);

  const rates: ParsedRate[] = [];
  const errors: ValidationError[] = [];
  const summary = {
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    byService: {} as Record<string, { valid: number; errors: number }>,
  };

  // Initialize service summary
  SERVICE_TYPES.forEach((service: typeof SERVICE_TYPES[0]) => {
    summary.byService[service.value] = { valid: 0, errors: 0 };
  });

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    // Parse sheet name to determine service type and location type
    const { serviceType, locationType } = parseSheetName(sheetName);
    
    if (!serviceType || !locationType) {
      errors.push({
        sheet: sheetName,
        row: 0,
        column: "",
        message: `Invalid sheet name format. Expected format: "Service Name - Countries" or "Service Name - Cities"`,
      });
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (data.length < 2) {
      continue; // Skip empty sheets
    }

    const headers = data[0];
    const rateColumnIndices = findRateColumns(headers);
    
    console.log(`[Excel Import] Sheet "${sheetName}":`);
    console.log(`  - Service: ${serviceType}, Location: ${locationType}`);
    console.log(`  - Headers:`, headers);
    console.log(`  - Rate columns found:`, rateColumnIndices);
    console.log(`  - Data rows: ${data.length - 1}`);

    // Process data rows (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1; // Excel row number (1-indexed)
      summary.totalRows++;

      if (isEmptyRow(row)) {
        continue; // Skip empty rows
      }

      try {
        if (locationType === "country") {
          const countryCode = row[2]?.toString().trim(); // Country Code column
          
          if (!countryCode) {
            throw new Error("Country Code is required");
          }

          // Extract rates for each service level
          if (rowNumber === 2) { // Only log first data row to avoid spam
            console.log(`[Row ${rowNumber}] Country: ${row[1]}, Code: ${row[2]}`);
            console.log(`[Row ${rowNumber}] Full row:`, row);
            console.log(`[Row ${rowNumber}] Rate column indices:`, rateColumnIndices);
          }
          for (const [serviceLevel, colIndex] of Object.entries(rateColumnIndices)) {
            const rateValue = row[colIndex];
            if (rowNumber === 2) {
              console.log(`[Row ${rowNumber}] ${serviceLevel} rate at col ${colIndex}: ${rateValue}`);
            }
            
            if (rateValue === null || rateValue === undefined || rateValue === "") {
              continue; // Skip empty rates
            }

            const rateUsd = parseRate(rateValue);
            
            if (isNaN(rateUsd) || rateUsd < 0) {
              errors.push({
                sheet: sheetName,
                row: rowNumber,
                column: headers[colIndex],
                message: `Invalid rate format: "${rateValue}". Must be a positive number (e.g., 150.00)`,
              });
              summary.byService[serviceType].errors++;
              continue;
            }

            rates.push({
              serviceType,
              locationType: "country",
              countryCode,
              serviceLevel,
              rateUsd,
              rowNumber,
            });
            
            summary.byService[serviceType].valid++;
          }
        } else {
          // City processing
          const cityName = row[0]?.toString().trim(); // City column
          const countryCode = row[3]?.toString().trim(); // Country Code column
          
          if (!cityName || !countryCode) {
            throw new Error("City and Country Code are required");
          }

          // Extract rates for each service level
          for (const [serviceLevel, colIndex] of Object.entries(rateColumnIndices)) {
            const rateValue = row[colIndex];
            
            if (rateValue === null || rateValue === undefined || rateValue === "") {
              continue; // Skip empty rates
            }

            const rateUsd = parseRate(rateValue);
            
            if (isNaN(rateUsd) || rateUsd < 0) {
              errors.push({
                sheet: sheetName,
                row: rowNumber,
                column: headers[colIndex],
                message: `Invalid rate format: "${rateValue}". Must be a positive number (e.g., 150.00)`,
              });
              summary.byService[serviceType].errors++;
              continue;
            }

            rates.push({
              serviceType,
              locationType: "city",
              cityName,
              countryCode,
              serviceLevel,
              rateUsd,
              rowNumber,
            });
            
            summary.byService[serviceType].valid++;
          }
        }
      } catch (error: any) {
        errors.push({
          sheet: sheetName,
          row: rowNumber,
          column: "",
          message: error.message || "Unknown error",
        });
        if (serviceType && summary.byService[serviceType]) {
          summary.byService[serviceType].errors++;
        }
      }
    }
  }

  summary.validRows = rates.length;
  summary.errorRows = errors.length;
  
  console.log('[Excel Import] Parse complete:');
  console.log(`  - Total rates found: ${rates.length}`);
  console.log(`  - Total errors: ${errors.length}`);
  console.log(`  - Summary:`, summary);

  return { rates, errors, summary };
}

/**
 * Parse sheet name to extract service type and location type
 */
function parseSheetName(sheetName: string): {
  serviceType: string | null;
  locationType: "country" | "city" | null;
} {
  const normalized = sheetName.toLowerCase();
  
  let serviceType: string | null = null;
  let locationType: "country" | "city" | null = null;

  // Determine service type - must match SERVICE_TYPES from shared/rates.ts
  if (normalized.includes("l1 euc") || normalized.includes("end user computing")) {
    serviceType = "L1_EUC";
  } else if (normalized.includes("l1 network") || normalized.includes("network support")) {
    serviceType = "L1_NETWORK";
  } else if (normalized.includes("smart hands")) {
    serviceType = "SMART_HANDS";
  }

  // Determine location type
  if (normalized.includes("countries")) {
    locationType = "country";
  } else if (normalized.includes("cities")) {
    locationType = "city";
  }

  return { serviceType, locationType };
}

/**
 * Find column indices for rate columns (service levels)
 */
function findRateColumns(headers: any[]): Record<string, number> {
  const rateColumns: Record<string, number> = {};

  console.log('[findRateColumns] Headers:', headers);

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.toString().toLowerCase() || "";
    
    for (const serviceLevel of SERVICE_LEVELS) {
      // Match service level rate columns (e.g., "Same Business Day Rate", "Next Business Day Rate", "Scheduled Rate")
      const labelLower = serviceLevel.label.toLowerCase();
      if (header.includes(labelLower) && header.includes('rate')) {
        rateColumns[serviceLevel.value] = i;
        console.log(`[findRateColumns] Matched "${serviceLevel.label} Rate" at column ${i}`);
        break;
      }
    }
  }

  console.log('[findRateColumns] Final mapping:', rateColumns);
  return rateColumns;
}

/**
 * Parse rate value from cell
 */
function parseRate(value: any): number {
  if (typeof value === "number") {
    return value;
  }
  
  if (typeof value === "string") {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,]/g, "").trim();
    return parseFloat(cleaned);
  }
  
  return NaN;
}

/**
 * Check if row is empty
 */
function isEmptyRow(row: any[]): boolean {
  return row.every((cell) => cell === null || cell === undefined || cell === "");
}
