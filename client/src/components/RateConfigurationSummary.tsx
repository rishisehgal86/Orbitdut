import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RateConfigurationSummaryProps {
  rates: Array<{
    id: number;
    serviceType: string;
    serviceLevel: string;
    rateUsdCents: number | null;
    countryCode: string | null;
    cityId: number | null;
    isServiceable: number | null;
  }>;
  countries: Array<{ countryCode: string; countryName: string }>;
  cities: Array<{ id: number; cityName: string; countryName?: string; countryCode?: string }>;
  serviceExclusions: Array<{ countryCode: string | null; cityId: number | null; serviceType: string }>;
  responseTimeExclusions: Array<{ countryCode: string | null; cityId: number | null; serviceType: string; serviceLevel: string }>;
}

const SERVICE_LEVELS = ["same_business_day", "next_business_day", "scheduled"];
const SERVICE_TYPES = ["L1_EUC", "L1_NETWORK", "SMART_HANDS"];

export function RateConfigurationSummary({
  rates,
  countries,
  cities,
  serviceExclusions,
  responseTimeExclusions,
}: RateConfigurationSummaryProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showLocationBreakdown, setShowLocationBreakdown] = useState(false);
  const [showServiceBreakdown, setShowServiceBreakdown] = useState(false);

  const stats = useMemo(() => {
    // Build virtual rate matrix
    const locations: Array<{ type: "country" | "city"; code?: string; id?: number }> = [
      ...countries.map((c) => ({ type: "country" as const, code: c.countryCode })),
      ...cities.map((c) => ({ type: "city" as const, id: c.id })),
    ];

    const virtualRates: Array<{
      location: { type: "country" | "city"; code?: string; id?: number };
      serviceType: string;
      serviceLevel: string;
      isExcluded: boolean;
      hasRate: boolean;
    }> = [];

    for (const location of locations) {
      for (const serviceType of SERVICE_TYPES) {
        // Check if service is excluded for this location
        const serviceExcluded = serviceExclusions.some(
          (ex) =>
            ex.serviceType === serviceType &&
            ((location.type === "country" && ex.countryCode === location.code) ||
              (location.type === "city" && ex.cityId === location.id))
        );

        if (serviceExcluded) {
          continue; // Skip this service entirely
        }

        for (const serviceLevel of SERVICE_LEVELS) {
          // Check if response time is excluded
          const responseTimeExcluded = responseTimeExclusions.some(
            (ex) =>
              ex.serviceType === serviceType &&
              ex.serviceLevel === serviceLevel &&
              ((location.type === "country" && ex.countryCode === location.code) ||
                (location.type === "city" && ex.cityId === location.id))
          );

          if (responseTimeExcluded) {
            continue; // Skip this response time
          }

          // Check if rate exists
          const rate = rates.find(
            (r) =>
              r.serviceType === serviceType &&
              r.serviceLevel === serviceLevel &&
              ((location.type === "country" && r.countryCode === location.code) ||
                (location.type === "city" && r.cityId === location.id))
          );

          virtualRates.push({
            location,
            serviceType,
            serviceLevel,
            isExcluded: false,
            hasRate: !!rate && rate.rateUsdCents !== null && rate.rateUsdCents > 0,
          });
        }
      }
    }

    const total = virtualRates.length;
    const configured = virtualRates.filter((r) => r.hasRate).length;
    const missing = total - configured;
    const percentage = total > 0 ? Math.round((configured / total) * 100) : 0;

    // Location type breakdown
    const countryRates = virtualRates.filter((r) => r.location.type === "country");
    const cityRates = virtualRates.filter((r) => r.location.type === "city");

    const byLocationType = [
      {
        locationType: "countries",
        configured: countryRates.filter((r) => r.hasRate).length,
        missing: countryRates.filter((r) => !r.hasRate).length,
        total: countryRates.length,
      },
      {
        locationType: "cities",
        configured: cityRates.filter((r) => r.hasRate).length,
        missing: cityRates.filter((r) => !r.hasRate).length,
        total: cityRates.length,
      },
    ];

    // Service type breakdown
    const byServiceType = SERVICE_TYPES.map((serviceType) => {
      const serviceRates = virtualRates.filter((r) => r.serviceType === serviceType);
      return {
        serviceType,
        configured: serviceRates.filter((r) => r.hasRate).length,
        missing: serviceRates.filter((r) => !r.hasRate).length,
        total: serviceRates.length,
      };
    });

    return {
      overall: { configured, missing, total, percentage },
      byLocationType,
      byServiceType,
    };
  }, [rates, countries, cities, serviceExclusions, responseTimeExclusions]);

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return "text-green-600";
    if (percentage >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-amber-600" />;
  };

  return (
    <Card className="p-4">
      {/* Compact Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(stats.overall.percentage)}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rate Configuration</span>
              <span className={`text-sm font-semibold ${getStatusColor(stats.overall.percentage)}`}>
                {stats.overall.percentage}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.overall.configured} configured · {stats.overall.missing} missing · {stats.overall.total} total
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="h-8 text-xs"
        >
          {showDetails ? "Hide" : "Show"} Details
          {showDetails ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronRight className="ml-1 h-3 w-3" />}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${stats.overall.percentage}%` }}
        />
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {/* Location Type Breakdown */}
          <div>
            <button
              onClick={() => setShowLocationBreakdown(!showLocationBreakdown)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-xs font-medium">By Location Type</span>
              {showLocationBreakdown ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            {showLocationBreakdown && (
              <div className="mt-2 space-y-2">
                {stats.byLocationType.map((item) => (
                  <div key={item.locationType} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{item.locationType}</span>
                    <span>
                      {item.configured}/{item.total} ({item.total > 0 ? Math.round((item.configured / item.total) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service Type Breakdown */}
          <div>
            <button
              onClick={() => setShowServiceBreakdown(!showServiceBreakdown)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-xs font-medium">By Service Type</span>
              {showServiceBreakdown ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            {showServiceBreakdown && (
              <div className="mt-2 space-y-2">
                {stats.byServiceType.map((item) => (
                  <div key={item.serviceType} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.serviceType.replace(/_/g, " ")}</span>
                    <span>
                      {item.configured}/{item.total} ({item.total > 0 ? Math.round((item.configured / item.total) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
