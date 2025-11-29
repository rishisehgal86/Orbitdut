import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ChevronDown, ChevronRight } from "lucide-react";
import SupplierLayout from "@/components/SupplierLayout";
import { RATE_SERVICE_TYPES, RESPONSE_TIME_HOURS, formatCurrency } from "@shared/rates";

type ServiceType = typeof RATE_SERVICE_TYPES[number]["value"];
type ResponseTime = typeof RESPONSE_TIME_HOURS[number];

interface FilterState {
  serviceTypes: ServiceType[];
  regions: string[];
  responseTimes: ResponseTime[];
  statuses: string[];
}

export default function CurrentRates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    serviceTypes: RATE_SERVICE_TYPES.map(s => s.value),
    regions: ["africa", "americas", "asia", "europe", "oceania", "cities"],
    responseTimes: [...RESPONSE_TIME_HOURS],
    statuses: ["configured", "missing"],
  });

  // Get supplier profile
  const { data: profile } = trpc.supplier.getProfile.useQuery();
  const supplierId = profile?.supplier?.id;

  // Fetch data
  const { data: countries } = trpc.supplier.getCountries.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: cities } = trpc.supplier.getPriorityCities.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: rates } = trpc.supplier.getRates.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: stats } = trpc.supplier.getRateCompletionStats.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: serviceExclusions } = trpc.supplier.getServiceExclusions.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: responseTimeExclusions } = trpc.supplier.getResponseTimeExclusions.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );

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

  // Prepare location data
  const locations = useMemo(() => {
    const locs: any[] = [];

    // Add countries
    if (countries) {
      countries.forEach((country) => {
        if (filters.regions.includes(country.region.toLowerCase())) {
          locs.push({
            type: "country",
            id: country.countryCode,
            name: country.countryName,
            region: country.region.toLowerCase(),
            code: country.countryCode,
          });
        }
      });
    }

    // Add cities
    if (cities && filters.regions.includes("cities")) {
      cities.forEach((city) => {
        locs.push({
          type: "city",
          id: city.id,
          name: `${city.cityName}, ${city.countryCode}`,
          region: "cities",
          cityId: city.id,
        });
      });
    }

    return locs;
  }, [countries, cities, filters.regions]);

  // Filter locations by search
  const filteredLocations = useMemo(() => {
    if (!searchQuery) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter((loc) => loc.name.toLowerCase().includes(query));
  }, [locations, searchQuery]);

  // Check if service is excluded for a location
  const isServiceExcluded = (location: any, serviceType: ServiceType) => {
    if (!serviceExclusions) return false;
    return serviceExclusions.some((exc) => {
      const matchesCountry = location.type === "country" && exc.countryCode === location.code;
      const matchesCity = location.type === "city" && exc.cityId === location.cityId;
      const matchesService = exc.serviceType === serviceType;
      return (matchesCountry || matchesCity) && matchesService;
    });
  };

  // Check if response time is excluded for a location/service
  const isResponseTimeExcluded = (location: any, serviceType: ServiceType, responseTime: ResponseTime) => {
    if (!responseTimeExclusions) return false;
    return responseTimeExclusions.some((exc) => {
      const matchesCountry = location.type === "country" && exc.countryCode === location.code;
      const matchesCity = location.type === "city" && exc.cityId === location.cityId;
      const matchesService = exc.serviceType === serviceType;
      const matchesResponseTime = exc.responseTimeHours === responseTime;
      return (matchesCountry || matchesCity) && matchesService && matchesResponseTime;
    });
  };

  // Get rate for a location/service/response time
  const getRate = (location: any, serviceType: ServiceType, responseTime: ResponseTime) => {
    const key = `${location.code || ""}-${location.cityId || ""}-${serviceType}-${responseTime}`;
    return rateMap.get(key);
  };

  // Get status for a location/service combination
  const getLocationServiceStatus = (location: any, serviceType: ServiceType) => {
    const configuredCount = RESPONSE_TIME_HOURS.filter((rt) => {
      const rate = getRate(location, serviceType, rt);
      return rate !== undefined && rate > 0;
    }).length;

    if (configuredCount === 0) return "missing";
    if (configuredCount === RESPONSE_TIME_HOURS.length) return "configured";
    return "partial";
  };

  // Filter by status
  const displayLocations = useMemo(() => {
    return filteredLocations.filter((location) => {
      // Check if any selected service type matches the status filter
      return filters.serviceTypes.some((serviceType) => {
        const status = getLocationServiceStatus(location, serviceType);
        return filters.statuses.includes(status) || filters.statuses.includes("configured");
      });
    });
  }, [filteredLocations, filters.serviceTypes, filters.statuses]);

  // Toggle filter
  const toggleFilter = (category: keyof FilterState, value: any) => {
    setFilters((prev) => {
      const current = prev[category] as any[];
      const newValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: newValues };
    });
  };

  // Toggle location expansion
  const toggleExpanded = (locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  // Export to CSV
  const handleExport = () => {
    // TODO: Implement CSV export
    alert("Export functionality coming soon!");
  };

  if (!supplierId) {
    return (
      <SupplierLayout>
        <div className="p-8">Loading...</div>
      </SupplierLayout>
    );
  }

  return (
    <SupplierLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Current Rates</h1>
            <p className="text-muted-foreground mt-1">
              View all your configured rates across locations and services
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Progress Summary */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Rate Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats.configured}</div>
                  <div className="text-sm text-muted-foreground">Total Configured</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.totalPossible - stats.configured}
                  </div>
                  <div className="text-sm text-muted-foreground">Missing Rates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(stats.percentage)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completion</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.byLocationType.countries.configured}
                  </div>
                  <div className="text-sm text-muted-foreground">Country Rates</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Rates</CardTitle>
            <CardDescription>Select filters to view specific rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Service Types */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Service Types</Label>
                {RATE_SERVICE_TYPES.map((service) => (
                  <div key={service.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service.value}`}
                      checked={filters.serviceTypes.includes(service.value)}
                      onCheckedChange={() => toggleFilter("serviceTypes", service.value)}
                    />
                    <label
                      htmlFor={`service-${service.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {service.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Regions */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Regions</Label>
                {[
                  { value: "africa", label: "Africa" },
                  { value: "americas", label: "Americas" },
                  { value: "asia", label: "Asia" },
                  { value: "europe", label: "Europe" },
                  { value: "oceania", label: "Oceania" },
                  { value: "cities", label: "Cities" },
                ].map((region) => (
                  <div key={region.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region.value}`}
                      checked={filters.regions.includes(region.value)}
                      onCheckedChange={() => toggleFilter("regions", region.value)}
                    />
                    <label
                      htmlFor={`region-${region.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {region.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Response Times */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Response Times</Label>
                {RESPONSE_TIME_HOURS.map((rt) => (
                  <div key={rt} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rt-${rt}`}
                      checked={filters.responseTimes.includes(rt)}
                      onCheckedChange={() => toggleFilter("responseTimes", rt)}
                    />
                    <label htmlFor={`rt-${rt}`} className="text-sm cursor-pointer">
                      {rt}h
                    </label>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                {[
                  { value: "configured", label: "Configured" },
                  { value: "partial", label: "Partially Configured" },
                  { value: "missing", label: "Missing" },
                ].map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={filters.statuses.includes(status.value)}
                      onCheckedChange={() => toggleFilter("statuses", status.value)}
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {status.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Location</th>
                      {filters.serviceTypes.map((serviceType) => (
                        <th key={serviceType} className="text-left p-3 font-medium">
                          {RATE_SERVICE_TYPES.find((s) => s.value === serviceType)?.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayLocations.length === 0 ? (
                      <tr>
                        <td
                          colSpan={filters.serviceTypes.length + 1}
                          className="text-center p-8 text-muted-foreground"
                        >
                          No locations match your filters
                        </td>
                      </tr>
                    ) : (
                      displayLocations.map((location) => {
                        const locationKey = `${location.type}-${location.id}`;
                        const isExpanded = expandedLocations.has(locationKey);

                        return (
                          <tr key={locationKey} className="border-t hover:bg-muted/50">
                            <td className="p-3">
                              <button
                                onClick={() => toggleExpanded(locationKey)}
                                className="flex items-center gap-2 text-left w-full hover:text-primary"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium">{location.name}</span>
                              </button>

                              {/* Expanded Response Time Details */}
                              {isExpanded && (
                                <div className="ml-6 mt-2 space-y-1">
                                  {filters.responseTimes.map((rt) => (
                                    <div key={rt} className="text-sm text-muted-foreground">
                                      {rt}h
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            {filters.serviceTypes.map((serviceType) => {
                              const serviceExcluded = isServiceExcluded(location, serviceType);
                              const status = getLocationServiceStatus(location, serviceType);

                              return (
                                <td key={serviceType} className="p-3">
                                  {serviceExcluded ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-50 text-red-700 border-red-200"
                                    >
                                      Service Excluded
                                    </Badge>
                                  ) : !isExpanded ? (
                                    <Badge
                                      variant={
                                        status === "configured"
                                          ? "default"
                                          : status === "partial"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className={
                                        status === "configured"
                                          ? "bg-green-100 text-green-800 border-green-200"
                                          : status === "partial"
                                          ? "bg-amber-100 text-amber-800 border-amber-200"
                                          : "bg-gray-100 text-gray-600 border-gray-200"
                                      }
                                    >
                                      {status === "configured"
                                        ? "Configured"
                                        : status === "partial"
                                        ? "Partial"
                                        : "Missing"}
                                    </Badge>
                                  ) : (
                                    <div className="space-y-1">
                                      {filters.responseTimes.map((rt) => {
                                        const rtExcluded = isResponseTimeExcluded(location, serviceType, rt);
                                        const rate = getRate(location, serviceType, rt);
                                        return (
                                          <div key={rt} className="text-sm">
                                            {rtExcluded ? (
                                              <span className="text-red-600 italic">Response Time Excluded</span>
                                            ) : rate && rate > 0 ? (
                                              <span className="text-green-600 font-medium">
                                                {formatCurrency(rate)}
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {displayLocations.length} of {locations.length} locations
            </div>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}
