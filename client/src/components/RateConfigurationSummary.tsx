import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RATE_SERVICE_TYPES, RESPONSE_TIME_HOURS } from "../../../shared/rates";

interface RateConfigurationSummaryProps {
  countries: Array<{ countryCode: string }>;
  cities: Array<{ id: number }>;
  rates: Array<{
    countryCode?: string | null;
    cityId?: number | null;
    serviceType: string;
    responseTimeHours: number;
    rateUsdCents?: number | null;
  }>;
  serviceExclusions: Array<{
    countryCode?: string | null;
    cityId?: number | null;
    serviceType: string;
  }>;
  responseTimeExclusions: Array<{
    countryCode?: string | null;
    cityId?: number | null;
    serviceType: string;
    responseTimeHours: number;
  }>;
}

export function RateConfigurationSummary({
  countries,
  cities,
  rates,
  serviceExclusions,
  responseTimeExclusions,
}: RateConfigurationSummaryProps) {
  // Build rate lookup map
  const rateMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!rates) return map;

    rates.forEach((rate) => {
      const key = `${rate.countryCode || ""}-${rate.cityId || ""}-${rate.serviceType}-${rate.responseTimeHours}`;
      map.set(key, rate.rateUsdCents || 0);
    });

    return map;
  }, [rates]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!countries || !cities || !rates || !serviceExclusions || !responseTimeExclusions) {
      return { total: 0, configured: 0, missing: 0, percentage: 0 };
    }

    const SERVICE_TYPES = RATE_SERVICE_TYPES.map((s) => s.value);
    const RESPONSE_TIMES = RESPONSE_TIME_HOURS;

    let total = 0;
    let configured = 0;
    let missing = 0;

    // Count for countries
    countries.forEach((country) => {
      SERVICE_TYPES.forEach((serviceType) => {
        // Check if service is excluded
        const serviceExcluded = serviceExclusions.some(
          (exc) => exc.countryCode === country.countryCode && exc.serviceType === serviceType
        );
        if (serviceExcluded) return;

        RESPONSE_TIMES.forEach((responseTime) => {
          // Check if response time is excluded
          const rtExcluded = responseTimeExclusions.some(
            (exc) =>
              exc.countryCode === country.countryCode &&
              exc.serviceType === serviceType &&
              exc.responseTimeHours === responseTime
          );
          if (rtExcluded) return;

          // Count this rate slot
          total++;
          const key = `${country.countryCode}--${serviceType}-${responseTime}`;
          const rateValue = rateMap.get(key);
          if (rateValue && rateValue > 0) {
            configured++;
          } else {
            missing++;
          }
        });
      });
    });

    // Count for cities
    cities.forEach((city) => {
      SERVICE_TYPES.forEach((serviceType) => {
        // Check if service is excluded
        const serviceExcluded = serviceExclusions.some(
          (exc) => exc.cityId === city.id && exc.serviceType === serviceType
        );
        if (serviceExcluded) return;

        RESPONSE_TIMES.forEach((responseTime) => {
          // Check if response time is excluded
          const rtExcluded = responseTimeExclusions.some(
            (exc) =>
              exc.cityId === city.id &&
              exc.serviceType === serviceType &&
              exc.responseTimeHours === responseTime
          );
          if (rtExcluded) return;

          // Count this rate slot
          total++;
          const key = `-${city.id}-${serviceType}-${responseTime}`;
          const rateValue = rateMap.get(key);
          if (rateValue && rateValue > 0) {
            configured++;
          } else {
            missing++;
          }
        });
      });
    });

    const percentage = total > 0 ? (configured / total) * 100 : 0;
    return { total, configured, missing, percentage };
  }, [countries, cities, rates, rateMap, serviceExclusions, responseTimeExclusions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Configuration Summary</CardTitle>
        <CardDescription>Track your progress and quickly identify missing rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Rates</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">{stats.configured}</p>
            <p className="text-sm text-muted-foreground">Configured</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-orange-600">{stats.missing}</p>
            <p className="text-sm text-muted-foreground">Missing</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">{Math.round(stats.percentage)}%</p>
            <p className="text-sm text-muted-foreground">Completion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
