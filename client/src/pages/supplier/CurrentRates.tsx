import { useState, useMemo, Fragment } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ChevronDown, ChevronRight, Info } from "lucide-react";
import SupplierLayout from "@/components/SupplierLayout";
import { RATE_SERVICE_TYPES, RATE_SERVICE_LEVELS, SERVICE_LEVEL_LABELS, formatCurrency, SERVICE_LEVEL_TO_HOURS, type ServiceLevel } from "@shared/rates";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RateConfigurationSummary } from "@/components/RateConfigurationSummary";

type ServiceType = typeof RATE_SERVICE_TYPES[number]["value"];

interface FilterState {
  serviceTypes: ServiceType[];
  locationTypes: string[];
  regions: string[];
  serviceLevels: ServiceLevel[];
  statuses: string[];
}

export default function CurrentRates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    serviceTypes: RATE_SERVICE_TYPES.map(s => s.value),
    locationTypes: ["countries", "cities"],
    regions: ["africa", "americas", "asia", "europe", "oceania", "cities"],
    serviceLevels: RATE_SERVICE_LEVELS.map(sl => sl.value),
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
  const { data: serviceExclusions } = trpc.supplier.getServiceExclusions.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: responseTimeExclusions } = trpc.supplier.getResponseTimeExclusions.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );

  // Build rate lookup map for table display
  const rateMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!rates) return map;

    rates.forEach((rate) => {
      const key = `${rate.countryCode || ""}-${rate.cityId || ""}-${rate.serviceType}-${rate.serviceLevel}`;
      map.set(key, rate.rateUsdCents || 0);
    });

    return map;
  }, [rates]);

  // Prepare location data
  const locations = useMemo(() => {
    const locs: any[] = [];

    // Add countries
    if (countries && filters.locationTypes.includes("countries")) {
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
    if (cities && filters.locationTypes.includes("cities") && filters.regions.includes("cities")) {
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
  }, [countries, cities, filters.regions, filters.locationTypes]);

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

  // Check if service level is excluded for a location/service
  const isResponseTimeExcluded = (location: any, serviceType: ServiceType, serviceLevel: ServiceLevel) => {
    if (!responseTimeExclusions) return false;
    return responseTimeExclusions.some((exc) => {
      const matchesCountry = location.type === "country" && exc.countryCode === location.code;
      const matchesCity = location.type === "city" && exc.cityId === location.cityId;
      const matchesService = exc.serviceType === serviceType;
      const matchesServiceLevel = exc.serviceLevel === serviceLevel;
      return (matchesCountry || matchesCity) && matchesService && matchesServiceLevel;
    });
  };

  // Get rate for a location/service/service level
  const getRate = (location: any, serviceType: ServiceType, serviceLevel: ServiceLevel) => {
    const key = `${location.code || ""}-${location.cityId || ""}-${serviceType}-${serviceLevel}`;
    return rateMap.get(key);
  };

  // Get status for a location/service combination
  const getLocationServiceStatus = (location: any, serviceType: ServiceType) => {
    const configuredCount = RATE_SERVICE_LEVELS.filter((sl) => {
      const rate = getRate(location, serviceType, sl.value);
      return rate !== undefined && rate > 0;
    }).length;

    if (configuredCount === 0) return "missing";
    if (configuredCount === RATE_SERVICE_LEVELS.length) return "configured";
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
              View all your configured <strong>hourly rates</strong> across locations and services. All rates are per hour with a <strong>2-hour minimum</strong> job duration.
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Progress Summary */}
        {supplierId && countries && cities && rates && serviceExclusions && responseTimeExclusions && (
          <RateConfigurationSummary
            rates={rates}
            countries={countries}
            cities={cities}
            serviceExclusions={serviceExclusions}
            responseTimeExclusions={responseTimeExclusions}
          />
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Service Types */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service Types</Label>
                {RATE_SERVICE_TYPES.map((service) => (
                  <div key={service.value} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`service-${service.value}`}
                      checked={filters.serviceTypes.includes(service.value)}
                      onCheckedChange={() => toggleFilter("serviceTypes", service.value)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`service-${service.value}`}
                      className="text-xs cursor-pointer leading-none"
                    >
                      {service.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Location Types */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location Types</Label>
                {[
                  { value: "countries", label: "Countries" },
                  { value: "cities", label: "Cities" },
                ].map((locType) => (
                  <div key={locType.value} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`loctype-${locType.value}`}
                      checked={filters.locationTypes.includes(locType.value)}
                      onCheckedChange={() => toggleFilter("locationTypes", locType.value)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`loctype-${locType.value}`}
                      className="text-xs cursor-pointer leading-none"
                    >
                      {locType.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Regions */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Regions</Label>
                {[
                  { value: "africa", label: "Africa" },
                  { value: "americas", label: "Americas" },
                  { value: "asia", label: "Asia" },
                  { value: "europe", label: "Europe" },
                  { value: "oceania", label: "Oceania" },
                  { value: "cities", label: "Cities" },
                ].map((region) => (
                  <div key={region.value} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`region-${region.value}`}
                      checked={filters.regions.includes(region.value)}
                      onCheckedChange={() => toggleFilter("regions", region.value)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`region-${region.value}`}
                      className="text-xs cursor-pointer leading-none"
                    >
                      {region.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Service Levels */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service Levels</Label>
                {RATE_SERVICE_LEVELS.map((sl) => (
                  <div key={sl.value} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`sl-${sl.value}`}
                      checked={filters.serviceLevels.includes(sl.value)}
                      onCheckedChange={() => toggleFilter("serviceLevels", sl.value)}
                      className="h-3.5 w-3.5"
                    />
                    <label htmlFor={`sl-${sl.value}`} className="text-xs cursor-pointer leading-none">
                      {sl.label}
                    </label>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
                {[
                  { value: "configured", label: "Configured" },
                  { value: "partial", label: "Partially Configured" },
                  { value: "missing", label: "Missing" },
                ].map((status) => (
                  <div key={status.value} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={filters.statuses.includes(status.value)}
                      onCheckedChange={() => toggleFilter("statuses", status.value)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="text-xs cursor-pointer leading-none"
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
                          <>
                            {/* Main location row */}
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
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Expanded response time rows */}
                            {isExpanded && filters.serviceLevels.map((serviceLevel) => {
                              const slOption = RATE_SERVICE_LEVELS.find(opt => opt.value === serviceLevel);
                              return (
                              <tr key={`${locationKey}-${serviceLevel}`} className="bg-muted/30">
                                <td className="py-1.5 px-3 pl-12 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    {SERVICE_LEVEL_LABELS[serviceLevel]}
                                    {slOption?.tooltip && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <p className="text-sm">{slOption.tooltip}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </td>
                                {filters.serviceTypes.map((serviceType) => {
                                  const serviceExcluded = isServiceExcluded(location, serviceType);
                                  const rtExcluded = isResponseTimeExcluded(location, serviceType, serviceLevel);
                                  const rate = getRate(location, serviceType, serviceLevel);
                                  return (
                                    <td key={serviceType} className="py-1.5 px-3 text-sm">
                                      {serviceExcluded ? (
                                        <span className="text-muted-foreground text-xs">—</span>
                                      ) : rtExcluded ? (
                                        <span className="text-muted-foreground text-xs">Excluded</span>
                                      ) : rate && rate > 0 ? (
                                        <span className="font-medium">
                                          {formatCurrency(rate)}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                            })}
                          </>
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
