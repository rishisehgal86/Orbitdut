import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SupplierLayout from "@/components/SupplierLayout";
import { RATE_SERVICE_TYPES, RATE_RESPONSE_TIMES } from "@shared/rates";

export default function SupplierRates() {
  // Using sonner toast
  const [activeTab, setActiveTab] = useState("quick-setup");

  // Get supplier profile to get supplierId
  const { data: profile } = trpc.supplier.getProfile.useQuery();
  const supplierId = profile?.supplier?.id;

  // Fetch existing rates
  const { data: rates, isLoading: ratesLoading, refetch: refetchRates } = trpc.supplier.getRates.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );

  // Fetch rate completion stats
  const { data: stats, refetch: refetchStats } = trpc.supplier.getRateCompletionStats.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );

  if (!supplierId) {
    return (
      <SupplierLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading supplier information...</p>
        </div>
      </SupplierLayout>
    );
  }

  return (
    <SupplierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Rate Management</h1>
          <p className="text-muted-foreground mt-2">
            Set your hourly rates in USD for each location, service type, and response time
          </p>
        </div>

        {/* Completion Tracker */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Rates configured</CardTitle>
              <CardDescription>
                Set rates for your covered locations to start receiving job offers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {stats.configured} / {stats.totalPossible} ({stats.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quick-setup">Quick Setup</TabsTrigger>
            <TabsTrigger value="by-location">By Location</TabsTrigger>
            <TabsTrigger value="by-service">By Service</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import/Export</TabsTrigger>
          </TabsList>

          {/* Quick Setup Tab */}
          <TabsContent value="quick-setup" className="space-y-6">
            <QuickSetupTab supplierId={supplierId} onSuccess={() => { refetchRates(); refetchStats(); }} />
          </TabsContent>

          {/* By Location Tab */}
          <TabsContent value="by-location" className="space-y-6">
            <ByLocationTab supplierId={supplierId} onSuccess={() => { refetchRates(); refetchStats(); }} />
          </TabsContent>

          {/* By Service Tab */}
          <TabsContent value="by-service">
            <Card>
              <CardHeader>
                <CardTitle>Rates by Service</CardTitle>
                <CardDescription>
                  View and edit rates organized by service type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Import/Export Tab */}
          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import/Export</CardTitle>
                <CardDescription>
                  Download Excel template or upload completed spreadsheet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SupplierLayout>
  );
}

// Quick Setup Tab Component with Regional Tabs
function QuickSetupTab({ supplierId, onSuccess }: { supplierId: number; onSuccess: () => void }) {
  const [selectedService, setSelectedService] = useState(RATE_SERVICE_TYPES[0].value);
  const [regionTab, setRegionTab] = useState("africa");
  const [baseRates, setBaseRates] = useState<Record<number, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  // Reset base rates when service type OR region changes
  useEffect(() => {
    setBaseRates({});
  }, [selectedService, regionTab]);

  // Get covered locations
  const { data: countries } = trpc.supplier.getCountries.useQuery({ supplierId });
  const { data: cities } = trpc.supplier.getPriorityCities.useQuery({ supplierId });

  // Group countries by region
  const countryByRegion = useMemo(() => {
    if (!countries) return {};
    
    const grouped: Record<string, any[]> = {
      africa: [],
      americas: [],
      asia: [],
      europe: [],
      oceania: [],
    };

    countries.forEach((country) => {
      const regionKey = country.region.toLowerCase();
      if (grouped[regionKey]) {
        grouped[regionKey].push(country);
      }
    });

    return grouped;
  }, [countries]);

  const bulkUpsertMutation = trpc.supplier.bulkUpsertRates.useMutation({
    onSuccess: () => {
      toast.success("Base rates applied successfully");
      setIsApplying(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to apply rates");
      setIsApplying(false);
    },
  });

  const handleRateChange = (responseTimeHours: number, value: string) => {
    setBaseRates((prev) => ({
      ...prev,
      [responseTimeHours]: value,
    }));
  };

  const handleApplyToRegion = async () => {
    // Validate that at least one rate is set
    const hasRates = Object.values(baseRates).some((v) => v && v !== "");
    if (!hasRates) {
      toast.error("Please set at least one rate before applying");
      return;
    }

    setIsApplying(true);

    // Build rate entries based on selected region
    const rateEntries = [];

    if (regionTab === "cities") {
      // Apply to all priority cities
      for (const city of cities || []) {
        for (const responseTime of RATE_RESPONSE_TIMES) {
          const rateValue = baseRates[responseTime.hours];
          if (rateValue && rateValue !== "") {
            rateEntries.push({
              supplierId,
              cityId: city.id,
              serviceType: selectedService,
              responseTimeHours: responseTime.hours,
              rateUsdCents: Math.round(parseFloat(rateValue) * 100),
            });
          }
        }
      }
    } else {
      // Apply to countries in selected region
      const regionCountries = countryByRegion[regionTab] || [];
      for (const country of regionCountries) {
        for (const responseTime of RATE_RESPONSE_TIMES) {
          const rateValue = baseRates[responseTime.hours];
          if (rateValue && rateValue !== "") {
            rateEntries.push({
              supplierId,
              countryCode: country.countryCode,
              serviceType: selectedService,
              responseTimeHours: responseTime.hours,
              rateUsdCents: Math.round(parseFloat(rateValue) * 100),
            });
          }
        }
      }
    }

    await bulkUpsertMutation.mutateAsync({ rates: rateEntries });
  };

  // Calculate location count for current tab
  const getLocationCount = () => {
    if (regionTab === "cities") return cities?.length || 0;
    return countryByRegion[regionTab]?.length || 0;
  };

  const locationCount = getLocationCount();
  const regionName = regionTab === "cities" ? "Cities" : regionTab.charAt(0).toUpperCase() + regionTab.slice(1);

  // Get location names for preview
  const getLocationNames = () => {
    if (regionTab === "cities") {
      return cities?.map(c => `${c.cityName}, ${c.countryCode}`).join(", ") || "";
    }
    const locations = countryByRegion[regionTab] || [];
    if (locations.length <= 5) {
      return locations.map(c => c.countryName).join(", ");
    }
    return locations.slice(0, 5).map(c => c.countryName).join(", ") + `, and ${locations.length - 5} more`;
  };

  const locationPreview = getLocationNames();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Setup</CardTitle>
        <CardDescription>
          Set base rates for a service type and region, then apply them to all locations in that region
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Service Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RATE_SERVICE_TYPES.map((service) => (
              <Button
                key={service.value}
                variant={selectedService === service.value ? "default" : "outline"}
                className="justify-start"
                onClick={() => setSelectedService(service.value)}
              >
                {service.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Regional Tabs */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Select Region</label>
          <Tabs value={regionTab} onValueChange={setRegionTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="africa">Africa</TabsTrigger>
              <TabsTrigger value="americas">Americas</TabsTrigger>
              <TabsTrigger value="asia">Asia</TabsTrigger>
              <TabsTrigger value="europe">Europe</TabsTrigger>
              <TabsTrigger value="oceania">Oceania</TabsTrigger>
              <TabsTrigger value="cities">Cities</TabsTrigger>
            </TabsList>

            {/* Base Rates Grid (same for all tabs) */}
            <div className="mt-6 space-y-4">
              <label className="text-sm font-medium">Base Rates (USD per hour)</label>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {RATE_RESPONSE_TIMES.map((responseTime) => (
                  <div key={responseTime.hours} className="space-y-2">
                    <label className="text-sm text-muted-foreground">{responseTime.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={baseRates[responseTime.hours] || ""}
                        onChange={(e) => handleRateChange(responseTime.hours, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tabs>
        </div>

        {/* Apply Button */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                Applying to {locationCount} {regionTab === "cities" ? "cit" : "countr"}
                {locationCount === 1 ? "y" : "ies"} in {regionName}
              </p>
              <p className="text-xs text-muted-foreground">
                {locationPreview}
              </p>
            </div>
            <Button onClick={handleApplyToRegion} disabled={isApplying} className="ml-4">
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply to {regionName}
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Set different base rates for each region to reflect local market conditions.
            You can fine-tune individual location rates in the "By Location" tab.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// By Location Tab Component
function ByLocationTab({ supplierId, onSuccess }: { supplierId: number; onSuccess: () => void }) {
  const [regionTab, setRegionTab] = useState("africa");
  const [selectedService, setSelectedService] = useState(RATE_SERVICE_TYPES[0].value);
  const [searchQuery, setSearchQuery] = useState("");

  // Get covered locations
  const { data: countries } = trpc.supplier.getCountries.useQuery({ supplierId });
  const { data: cities } = trpc.supplier.getPriorityCities.useQuery({ supplierId });
  const { data: rates } = trpc.supplier.getRates.useQuery({ supplierId });

  // Group countries by region
  const countryRatesByRegion = useMemo(() => {
    if (!countries || !rates) return {};
    
    const grouped: Record<string, any[]> = {
      africa: [],
      americas: [],
      asia: [],
      europe: [],
      oceania: [],
    };

    countries.forEach((country) => {
      const regionKey = country.region.toLowerCase();
      if (grouped[regionKey]) {
        // Find rates for this country and selected service
        const countryRates = rates.filter(
          (r) => r.countryCode === country.countryCode && r.serviceType === selectedService
        );
        
        grouped[regionKey].push({
          type: "country",
          code: country.countryCode,
          name: country.countryName,
          rates: countryRates,
        });
      }
    });

    return grouped;
  }, [countries, rates, selectedService]);

  // City rates
  const cityRates = useMemo(() => {
    if (!cities || !rates) return [];
    
    return cities.map((city) => {
      const cityRates = rates.filter(
        (r) => r.cityId === city.id && r.serviceType === selectedService
      );
      
      return {
        type: "city",
        id: city.id,
        name: `${city.cityName}, ${city.stateProvince ? city.stateProvince + ", " : ""}${city.countryName}`,
        rates: cityRates,
      };
    });
  }, [cities, rates, selectedService]);

  // Filter by search query
  const filterLocations = (locations: any[]) => {
    if (!searchQuery) return locations;
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rates by Location</CardTitle>
        <CardDescription>
          View and edit rates for specific locations. Rates shown for selected service type.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Service Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RATE_SERVICE_TYPES.map((service) => (
              <Button
                key={service.value}
                variant={selectedService === service.value ? "default" : "outline"}
                className="justify-start"
                onClick={() => setSelectedService(service.value)}
              >
                {service.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Locations</label>
          <Input
            type="text"
            placeholder="Search countries or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Regional Tabs */}
        <Tabs value={regionTab} onValueChange={setRegionTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="africa">Africa</TabsTrigger>
            <TabsTrigger value="americas">Americas</TabsTrigger>
            <TabsTrigger value="asia">Asia</TabsTrigger>
            <TabsTrigger value="europe">Europe</TabsTrigger>
            <TabsTrigger value="oceania">Oceania</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
          </TabsList>

          {/* Africa Tab */}
          <TabsContent value="africa">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.africa || [])}
              selectedService={selectedService}
              supplierId={supplierId}
              onSuccess={onSuccess}
            />
          </TabsContent>

          {/* Americas Tab */}
          <TabsContent value="americas">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.americas || [])}
              selectedService={selectedService}
              supplierId={supplierId}
              onSuccess={onSuccess}
            />
          </TabsContent>

          {/* Asia Tab */}
          <TabsContent value="asia">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.asia || [])}
              selectedService={selectedService}
              supplierId={supplierId}
              onSuccess={onSuccess}
            />
          </TabsContent>

          {/* Europe Tab */}
          <TabsContent value="europe">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.europe || [])}
              selectedService={selectedService}
              supplierId={supplierId}
              onSuccess={onSuccess}
            />
          </TabsContent>

          {/* Oceania Tab */}
          <TabsContent value="oceania">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.oceania || [])}
              selectedService={selectedService}
              supplierId={supplierId}
              onSuccess={onSuccess}
            />
          </TabsContent>

          {/* Cities Tab */}
          <TabsContent value="cities">
            <LocationRatesTable
              locations={filterLocations(cityRates)}
              selectedService={selectedService}
              supplierId={supplierId}
              onSuccess={onSuccess}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Location Rates Table Component
function LocationRatesTable({
  locations,
  selectedService,
  supplierId,
  onSuccess,
}: {
  locations: any[];
  selectedService: string;
  supplierId: number;
  onSuccess: () => void;
}) {
  const [editingRates, setEditingRates] = useState<Record<string, Record<number, string>>>({});

  const upsertMutation = trpc.supplier.upsertRate.useMutation({
    onSuccess: () => {
      toast.success("Rate updated successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update rate");
    },
  });

  const handleRateChange = (locationKey: string, responseTimeHours: number, value: string) => {
    setEditingRates((prev) => ({
      ...prev,
      [locationKey]: {
        ...(prev[locationKey] || {}),
        [responseTimeHours]: value,
      },
    }));
  };

  const handleRateBlur = async (location: any, responseTimeHours: number) => {
    const locationKey = location.type === "country" ? location.code : `city-${location.id}`;
    const editedValue = editingRates[locationKey]?.[responseTimeHours];
    
    if (editedValue === undefined) return;

    const rateUsdCents = editedValue === "" ? null : Math.round(parseFloat(editedValue) * 100);

    await upsertMutation.mutateAsync({
      supplierId,
      countryCode: location.type === "country" ? location.code : undefined,
      cityId: location.type === "city" ? location.id : undefined,
      serviceType: selectedService,
      responseTimeHours,
      rateUsdCents,
    });

    // Clear editing state for this field
    setEditingRates((prev) => {
      const newState = { ...prev };
      if (newState[locationKey]) {
        delete newState[locationKey][responseTimeHours];
        if (Object.keys(newState[locationKey]).length === 0) {
          delete newState[locationKey];
        }
      }
      return newState;
    });
  };

  const getRateValue = (location: any, responseTimeHours: number): string => {
    const locationKey = location.type === "country" ? location.code : `city-${location.id}`;
    
    // Check if we're editing this field
    const editedValue = editingRates[locationKey]?.[responseTimeHours];
    if (editedValue !== undefined) return editedValue;

    // Find existing rate
    const existingRate = location.rates.find((r: any) => r.responseTimeHours === responseTimeHours);
    if (existingRate && existingRate.rateUsdCents !== null) {
      return (existingRate.rateUsdCents / 100).toFixed(2);
    }

    return "";
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No locations found
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Location</th>
              {RATE_RESPONSE_TIMES.map((rt) => (
                <th key={rt.hours} className="text-center p-3 font-medium min-w-[100px]">
                  {rt.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => {
              const locationKey = location.type === "country" ? location.code : `city-${location.id}`;
              
              return (
                <tr key={locationKey} className="border-t">
                  <td className="p-3 font-medium">{location.name}</td>
                  {RATE_RESPONSE_TIMES.map((rt) => (
                    <td key={rt.hours} className="p-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="pl-6 text-center"
                          value={getRateValue(location, rt.hours)}
                          onChange={(e) => handleRateChange(locationKey, rt.hours, e.target.value)}
                          onBlur={() => handleRateBlur(location, rt.hours)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
