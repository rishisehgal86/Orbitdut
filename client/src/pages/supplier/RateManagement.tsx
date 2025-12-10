import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Info, Check, X, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SupplierLayout from "@/components/SupplierLayout";
import { RATE_SERVICE_TYPES, RATE_SERVICE_LEVELS, HOURS_TO_SERVICE_LEVEL, SERVICE_LEVEL_TO_HOURS } from "@shared/rates";
import { validateBaseRates } from "@shared/rateValidation";
import { RateConfigurationSummary } from "@/components/RateConfigurationSummary";

export default function RateManagement() {
  // Using sonner toast
  const [activeTab, setActiveTab] = useState("quick-setup");

  // Get supplier profile to get supplierId
  const { data: profile } = trpc.supplier.getProfile.useQuery();
  const supplierId = profile?.supplier?.id;

  // Fetch data (same as Current Rates page)
  const { data: countries } = trpc.supplier.getCountries.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: cities } = trpc.supplier.getPriorityCities.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: rates, isLoading: ratesLoading, refetch: refetchRates } = trpc.supplier.getRates.useQuery(
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

  // Stats are now calculated by the shared RateConfigurationSummary component

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

        {/* Service Availability Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Rates are only shown for services you've marked as available. To manage which services you offer in each location, visit{" "}
            <Link href="/supplier/coverage/availability" className="font-medium underline underline-offset-4 hover:text-primary">
              Service Availability
            </Link>
            .
          </AlertDescription>
        </Alert>

        {/* Rate Configuration Summary */}
        {/* TODO: Update RateConfigurationSummary to use serviceLevel */}
        {/* {countries && cities && rates && serviceExclusions && responseTimeExclusions && (
          <RateConfigurationSummary
            countries={countries}
            cities={cities}
            rates={rates}
            serviceExclusions={serviceExclusions}
            responseTimeExclusions={responseTimeExclusions}
          />
        )} */}

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
            <QuickSetupTab supplierId={supplierId} onSuccess={() => { refetchRates(); }} />
          </TabsContent>

          {/* By Location Tab */}
          <TabsContent value="by-location" className="space-y-6">
            <ByLocationTab supplierId={supplierId} onSuccess={() => { refetchRates(); }} />
          </TabsContent>

          {/* By Service Tab */}
          <TabsContent value="by-service">
            <ByServiceTab supplierId={supplierId} onSuccess={() => { refetchRates(); }} />
          </TabsContent>

          {/* Bulk Import/Export Tab */}
          <TabsContent value="bulk">
            <BulkImportExportTab supplierId={supplierId} onSuccess={() => { refetchRates(); }} />
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
        for (const serviceLevel of RATE_SERVICE_LEVELS) {
          const rateValue = baseRates[serviceLevel.hours];
          if (rateValue && rateValue !== "") {
            rateEntries.push({
              supplierId,
              cityId: city.id,
              serviceType: selectedService,
              serviceLevel: serviceLevel.value,
              rateUsdCents: Math.round(parseFloat(rateValue) * 100),
            });
          }
        }
      }
    } else {
      // Apply to countries in selected region
      const regionCountries = countryByRegion[regionTab] || [];
      for (const country of regionCountries) {
        for (const serviceLevel of RATE_SERVICE_LEVELS) {
          const rateValue = baseRates[serviceLevel.hours];
          if (rateValue && rateValue !== "") {
            rateEntries.push({
              supplierId,
              countryCode: country.countryCode,
              serviceType: selectedService,
              serviceLevel: serviceLevel.value,
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {RATE_SERVICE_LEVELS.map((responseTime) => (
                  <div key={responseTime.hours} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <label className="text-sm text-muted-foreground">{responseTime.label}</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">{responseTime.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
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

              {/* Validation Warnings */}
              <RateValidationWarnings baseRates={baseRates} />
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
  const [regionTab, setRegionTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get covered locations
  const { data: countries } = trpc.supplier.getCountries.useQuery({ supplierId });
  const { data: cities } = trpc.supplier.getPriorityCities.useQuery({ supplierId });
  const { data: rates } = trpc.supplier.getRates.useQuery({ supplierId });
  const { data: exclusions } = trpc.supplier.getServiceExclusions.useQuery({ supplierId });
  const { data: responseTimeExclusions } = trpc.supplier.getResponseTimeExclusions.useQuery({ supplierId });

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
        // Find rates for this country (all services)
        const countryRates = rates.filter(
          (r) => r.countryCode === country.countryCode
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
  }, [countries, rates]);

  // City rates
  const cityRates = useMemo(() => {
    if (!cities || !rates) return [];
    
    return cities.map((city) => {
      const cityRates = rates.filter(
        (r) => r.cityId === city.id
      );
      
      return {
        type: "city",
        id: city.id,
        name: `${city.cityName}, ${city.stateProvince ? city.stateProvince + ", " : ""}${city.countryCode}`,
        rates: cityRates,
      };
    });
  }, [cities, rates]);

  // Filter by search query
  const filterLocations = (locations: any[]) => {
    if (!searchQuery) return locations;
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Add loading state
  if (!countries || !cities || !rates) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rates by Location</CardTitle>
        <CardDescription>
          View and edit rates for all service types at each location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="africa">Africa</TabsTrigger>
            <TabsTrigger value="americas">Americas</TabsTrigger>
            <TabsTrigger value="asia">Asia</TabsTrigger>
            <TabsTrigger value="europe">Europe</TabsTrigger>
            <TabsTrigger value="oceania">Oceania</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all">
            <LocationRatesTable
              locations={filterLocations([
                ...(countryRatesByRegion.africa || []),
                ...(countryRatesByRegion.americas || []),
                ...(countryRatesByRegion.asia || []),
                ...(countryRatesByRegion.europe || []),
                ...(countryRatesByRegion.oceania || []),
                ...cityRates,
              ])}
              supplierId={supplierId}
              onSuccess={onSuccess}
              exclusions={exclusions || []}
              responseTimeExclusions={responseTimeExclusions || []}
            />
          </TabsContent>

          {/* Africa Tab */}
          <TabsContent value="africa">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.africa || [])}
              supplierId={supplierId}
              onSuccess={onSuccess}
              exclusions={exclusions || []}
              responseTimeExclusions={responseTimeExclusions || []}
            />
          </TabsContent>

          {/* Americas Tab */}
          <TabsContent value="americas">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.americas || [])}
              supplierId={supplierId}
              onSuccess={onSuccess}
              exclusions={exclusions || []}
              responseTimeExclusions={responseTimeExclusions || []}
            />
          </TabsContent>

          {/* Asia Tab */}
          <TabsContent value="asia">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.asia || [])}
              supplierId={supplierId}
              onSuccess={onSuccess}
              exclusions={exclusions || []}
              responseTimeExclusions={responseTimeExclusions || []}
            />
          </TabsContent>

          {/* Europe Tab */}
          <TabsContent value="europe">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.europe || [])}
              supplierId={supplierId}
              onSuccess={onSuccess}
              exclusions={exclusions || []}
              responseTimeExclusions={responseTimeExclusions || []}
            />
          </TabsContent>

          {/* Oceania Tab */}
          <TabsContent value="oceania">
            <LocationRatesTable
              locations={filterLocations(countryRatesByRegion.oceania || [])}
              supplierId={supplierId}
              onSuccess={onSuccess}
              exclusions={exclusions || []}
              responseTimeExclusions={responseTimeExclusions || []}
            />
          </TabsContent>

          {/* Cities Tab */}
          <TabsContent value="cities">
            <LocationRatesTable
              locations={filterLocations(cityRates)}
              supplierId={supplierId}
              onSuccess={onSuccess}
              exclusions={exclusions || []}
              responseTimeExclusions={responseTimeExclusions || []}
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
  supplierId,
  onSuccess,
  exclusions,
  responseTimeExclusions,
}: {
  locations: any[];
  supplierId: number;
  onSuccess: () => void;
  exclusions: any[];
  responseTimeExclusions: any[];
}) {
  const [editingRates, setEditingRates] = useState<Record<string, Record<number, string>>>({});
  const [savingStates, setSavingStates] = useState<Record<string, Record<number, 'saving' | 'saved' | 'error'>>>({});
  const [saveTimers, setSaveTimers] = useState<Record<string, Record<number, NodeJS.Timeout>>>({});

  // Helper to check if a service/location combination is excluded (service-level)
  const isServiceExcluded = (location: any, serviceType: string): boolean => {
    return exclusions.some((exclusion: any) => {
      // Check if service type matches
      if (exclusion.serviceType !== serviceType) return false;
      
      // Check if location matches (country or city)
      if (location.type === "country") {
        return exclusion.countryCode === location.code;
      } else {
        return exclusion.cityId === location.id;
      }
    });
  };

  // Helper to check if a specific response time is excluded (response time-level)
  const isResponseTimeExcluded = (location: any, serviceType: string, responseTimeHours: number): boolean => {
    const serviceLevel = HOURS_TO_SERVICE_LEVEL[responseTimeHours];
    
    return responseTimeExclusions.some((exclusion: any) => {
      // Check if service type and service level match
      if (exclusion.serviceType !== serviceType) return false;
      if (exclusion.serviceLevel !== serviceLevel) return false;
      
      // Check if location matches (country or city)
      if (location.type === "country") {
        return exclusion.countryCode === location.code;
      } else {
        return exclusion.cityId === location.id;
      }
    });
  };

  const upsertMutation = trpc.supplier.upsertRate.useMutation({
    onSuccess: (_, variables) => {
      const locationKey = variables.countryCode || `city-${variables.cityId}`;
      const stateKey = `${locationKey}-${variables.serviceType}`;

      const responseTimeHours = SERVICE_LEVEL_TO_HOURS[variables.serviceLevel];
      
      // Set saved state
      setSavingStates((prev) => ({
        ...prev,
        [stateKey]: {
          ...(prev[stateKey] || {}),
          [responseTimeHours]: 'saved',
        },
      }));

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSavingStates((prev) => {
          const newState = { ...prev };
          if (newState[stateKey]?.[responseTimeHours] === 'saved') {
            delete newState[stateKey][responseTimeHours];
            if (Object.keys(newState[stateKey] || {}).length === 0) {
              delete newState[stateKey];
            }
          }
          return newState;
        });
      }, 2000);

      onSuccess();
    },
    onError: (error, variables) => {
      const locationKey = variables.countryCode || `city-${variables.cityId}`;
      const stateKey = `${locationKey}-${variables.serviceType}`;

      const responseTimeHours = SERVICE_LEVEL_TO_HOURS[variables.serviceLevel];
      
      setSavingStates((prev) => ({
        ...prev,
        [stateKey]: {
          ...(prev[stateKey] || {}),
          [responseTimeHours]: 'error',
        },
      }));
      
      toast.error(error.message || "Failed to update rate");
    },
  });

  const utils = trpc.useUtils();

  const addResponseTimeExclusionMutation = trpc.supplier.addResponseTimeExclusion.useMutation({
    onMutate: async (newExclusion) => {
      // Cancel outgoing refetches
      await utils.supplier.getResponseTimeExclusions.cancel();
      
      // Snapshot previous value
      const previousExclusions = utils.supplier.getResponseTimeExclusions.getData({ supplierId });
      
      // Optimistically update
      utils.supplier.getResponseTimeExclusions.setData({ supplierId }, (old) => {
        if (!old) return [newExclusion as any];
        return [...old, newExclusion as any];
      });
      
      return { previousExclusions };
    },
    onSuccess: () => {
      toast.success("Response time marked as not offered");
      onSuccess();
    },
    onError: (error, _newExclusion, context) => {
      // Rollback on error
      if (context?.previousExclusions) {
        utils.supplier.getResponseTimeExclusions.setData({ supplierId }, context.previousExclusions);
      }
      toast.error(error.message || "Failed to update exclusion");
    },
    onSettled: () => {
      utils.supplier.getResponseTimeExclusions.invalidate({ supplierId });
    },
  });

  const removeResponseTimeExclusionMutation = trpc.supplier.removeResponseTimeExclusion.useMutation({
    onMutate: async (exclusionToRemove) => {
      // Cancel outgoing refetches
      await utils.supplier.getResponseTimeExclusions.cancel();
      
      // Snapshot previous value
      const previousExclusions = utils.supplier.getResponseTimeExclusions.getData({ supplierId });
      
      // Optimistically update by removing the exclusion
      utils.supplier.getResponseTimeExclusions.setData({ supplierId }, (old) => {
        if (!old) return [];
        return old.filter((exc) => {
          const matchesCountry = exclusionToRemove.countryCode && exc.countryCode === exclusionToRemove.countryCode;
          const matchesCity = exclusionToRemove.cityId && exc.cityId === exclusionToRemove.cityId;
          const matchesService = exc.serviceType === exclusionToRemove.serviceType;
          const matchesResponseTime = exc.serviceLevel === exclusionToRemove.serviceLevel;
          
          // Keep the exclusion if it doesn't match all criteria
          return !((matchesCountry || matchesCity) && matchesService && matchesResponseTime);
        });
      });
      
      return { previousExclusions };
    },
    onSuccess: () => {
      toast.success("Response time enabled");
      onSuccess();
    },
    onError: (error, _exclusionToRemove, context) => {
      // Rollback on error
      if (context?.previousExclusions) {
        utils.supplier.getResponseTimeExclusions.setData({ supplierId }, context.previousExclusions);
      }
      toast.error(error.message || "Failed to update exclusion");
    },
    onSettled: () => {
      utils.supplier.getResponseTimeExclusions.invalidate({ supplierId });
    },
  });

  const handleToggleResponseTimeExclusion = (location: any, serviceType: string, responseTimeHours: number) => {
    const isExcluded = isResponseTimeExcluded(location, serviceType, responseTimeHours);
    const { HOURS_TO_SERVICE_LEVEL } = require("@shared/rates");
    const serviceLevel = HOURS_TO_SERVICE_LEVEL[responseTimeHours];
    
    if (isExcluded) {
      // Remove exclusion (enable this response time)
      removeResponseTimeExclusionMutation.mutate({
        supplierId,
        countryCode: location.type === "country" ? location.code : undefined,
        cityId: location.type === "city" ? location.id : undefined,
        serviceType,
        serviceLevel,
      });
    } else {
      // Add exclusion (disable this response time)
      addResponseTimeExclusionMutation.mutate({
        supplierId,
        countryCode: location.type === "country" ? location.code : undefined,
        cityId: location.type === "city" ? location.id : undefined,
        serviceType,
        serviceLevel,
      });
    }
  };

  const handleRateChange = (locationKey: string, serviceType: string, responseTimeHours: number, value: string, location: any) => {
    const stateKey = `${locationKey}-${serviceType}`;
    setEditingRates((prev) => ({
      ...prev,
      [stateKey]: {
        ...(prev[stateKey] || {}),
        [responseTimeHours]: value,
      },
    }));

    // Clear existing timer for this field
    if (saveTimers[stateKey]?.[responseTimeHours]) {
      clearTimeout(saveTimers[stateKey][responseTimeHours]);
    }

    // Set up debounced auto-save (500ms)
    const timer = setTimeout(() => {
      handleAutoSave(location, serviceType, responseTimeHours, value);
    }, 500);

    setSaveTimers((prev) => ({
      ...prev,
      [stateKey]: {
        ...(prev[stateKey] || {}),
        [responseTimeHours]: timer,
      },
    }));
  };

  const handleAutoSave = async (location: any, serviceType: string, responseTimeHours: number, value: string) => {
    const locationKey = location.type === "country" ? location.code : `city-${location.id}`;
    const stateKey = `${locationKey}-${serviceType}`;
    
    // Set saving state
    setSavingStates((prev) => ({
      ...prev,
      [stateKey]: {
        ...(prev[stateKey] || {}),
        [responseTimeHours]: 'saving',
      },
    }));

    const rateUsdCents = value === "" ? null : Math.round(parseFloat(value) * 100);
    const { HOURS_TO_SERVICE_LEVEL } = require("@shared/rates");
    const serviceLevel = HOURS_TO_SERVICE_LEVEL[responseTimeHours];

    await upsertMutation.mutateAsync({
      supplierId,
      countryCode: location.type === "country" ? location.code : undefined,
      cityId: location.type === "city" ? location.id : undefined,
      serviceType,
      serviceLevel,
      rateUsdCents,
    });

    // Clear editing state for this field
    setEditingRates((prev) => {
      const newState = { ...prev };
      if (newState[stateKey]) {
        delete newState[stateKey][responseTimeHours];
        if (Object.keys(newState[stateKey]).length === 0) {
          delete newState[stateKey];
        }
      }
      return newState;
    });
  };

  const getRateValue = (location: any, serviceType: string, responseTimeHours: number): string => {
    const locationKey = location.type === "country" ? location.code : `city-${location.id}`;
    const stateKey = `${locationKey}-${serviceType}`;
    
    // Check if we're editing this field
    const editedValue = editingRates[stateKey]?.[responseTimeHours];
    if (editedValue !== undefined) return editedValue;

    // Find existing rate
    const existingRate = location.rates.find((r: any) => r.serviceType === serviceType && r.responseTimeHours === responseTimeHours);
    if (existingRate && existingRate.rateUsdCents !== null) {
      return (existingRate.rateUsdCents / 100).toFixed(2);
    }

    return "";
  };

  // Check if a rate has pricing inconsistencies
  const hasValidationWarning = (location: any, serviceType: string, responseTimeHours: number): string | null => {
    const locationKey = location.type === "country" ? location.code : `city-${location.id}`;
    const currentValue = getRateValue(location, serviceType, responseTimeHours);
    
    if (!currentValue || parseFloat(currentValue) === 0) return null;

    const currentRate = parseFloat(currentValue);
    
    // Check if faster response times are more expensive (as they should be)
    for (const rt of RATE_SERVICE_LEVELS) {
      if (rt.hours < responseTimeHours) {
        const fasterValue = getRateValue(location, serviceType, rt.hours);
        if (fasterValue && parseFloat(fasterValue) > 0) {
          const fasterRate = parseFloat(fasterValue);
          if (fasterRate < currentRate) {
            return `${rt.label} response ($${fasterRate.toFixed(2)}) is cheaper than this slower ${responseTimeHours}h response`;
          }
        }
      }
    }

    return null;
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No locations found
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {locations.map((location) => {
        const locationKey = location.type === "country" ? location.code : `city-${location.id}`;
        
        return (
          <AccordionItem key={locationKey} value={locationKey} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="font-medium">{location.name}</span>
                {location.type === "country" && (
                  <span className="text-xs text-muted-foreground">{location.code}</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-8 mt-4">
                {RATE_SERVICE_TYPES.map((service) => {
                  const serviceExcluded = isServiceExcluded(location, service.value);
                  const stateKey = `${locationKey}-${service.value}`;
                  
                  // Count configured rates (valid prices > 0)
                  const configuredCount = RATE_SERVICE_LEVELS.filter(rt => {
                    const val = getRateValue(location, service.value, rt.hours);
                    return val !== "" && parseFloat(val) > 0;
                  }).length;
                  
                  // Count excluded response times for this service/location
                  const excludedCount = RATE_SERVICE_LEVELS.filter(rt => 
                    isResponseTimeExcluded(location, service.value, rt.hours)
                  ).length;
                  
                  // Total possible rates = 3 - excluded
                  const totalPossibleRates = RATE_SERVICE_LEVELS.length - excludedCount;

                  return (
                    <div key={service.value} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{service.label}</h4>
                        {serviceExcluded ? (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Not Offered
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {configuredCount} / {totalPossibleRates} rates configured
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {RATE_SERVICE_LEVELS.map((rt) => {
                          const isResponseTimeDisabled = serviceExcluded || isResponseTimeExcluded(location, service.value, rt.hours);
                          
                          return (
                            <div key={rt.hours} className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <label className="text-sm font-medium text-muted-foreground">
                                  {rt.label}
                                </label>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-sm">{rt.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <div className="relative">
                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
                                  isResponseTimeDisabled ? "text-muted-foreground/50" : "text-muted-foreground"
                                }`}>
                                  $
                                </span>
                                <Input
                                  type="number"
                                  placeholder={isResponseTimeDisabled ? "Not Offered" : "0.00"}
                                  className={`pl-7 pr-16 ${
                                    isResponseTimeDisabled ? "bg-muted text-muted-foreground cursor-not-allowed" : ""
                                  }`}
                                  value={isResponseTimeDisabled ? "" : getRateValue(location, service.value, rt.hours)}
                                  onChange={(e) => !isResponseTimeDisabled && handleRateChange(locationKey, service.value, rt.hours, e.target.value, location)}
                                  disabled={isResponseTimeDisabled}
                                  min="0"
                                  step="0.01"
                                  title={isResponseTimeDisabled ? "This response time is not offered" : ""}
                                />
                                {!serviceExcluded && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {/* X icon toggle for response time exclusions */}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleResponseTimeExclusion(location, service.value, rt.hours)}
                                            className={`p-0.5 rounded hover:bg-muted transition-colors ${
                                              isResponseTimeExcluded(location, service.value, rt.hours)
                                                ? "text-green-600 hover:text-green-700"
                                                : "text-muted-foreground hover:text-destructive"
                                            }`}
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                          <p className="text-sm">
                                            {isResponseTimeExcluded(location, service.value, rt.hours)
                                              ? "Click to re-enable this response time"
                                              : "Click to mark this response time as not offered"}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    {hasValidationWarning(location, service.value, rt.hours) && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="max-w-xs">
                                            <p className="text-sm">{hasValidationWarning(location, service.value, rt.hours)}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {savingStates[stateKey]?.[rt.hours] && (
                                      <>
                                        {savingStates[stateKey][rt.hours] === 'saving' && (
                                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                        {savingStates[stateKey][rt.hours] === 'saved' && (
                                          <Check className="h-4 w-4 text-green-600" />
                                        )}
                                        {savingStates[stateKey][rt.hours] === 'error' && (
                                          <X className="h-4 w-4 text-destructive" />
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// By Service Tab Component
function ByServiceTab({ supplierId, onSuccess }: { supplierId: number; onSuccess: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get covered locations
  const { data: countries } = trpc.supplier.getCountries.useQuery({ supplierId });
  const { data: cities } = trpc.supplier.getPriorityCities.useQuery({ supplierId });
  const { data: rates } = trpc.supplier.getRates.useQuery({ supplierId });
  const { data: exclusions } = trpc.supplier.getServiceExclusions.useQuery({ supplierId });
  const { data: responseTimeExclusions } = trpc.supplier.getResponseTimeExclusions.useQuery({ supplierId });

  // Group locations by service type
  const locationsByService = useMemo(() => {
    if (!countries || !cities || !rates) return {};
    
    const grouped: Record<string, any[]> = {};
    
    RATE_SERVICE_TYPES.forEach((serviceType) => {
      const locations: any[] = [];
      
      // Add countries
      countries.forEach((country) => {
        const countryRates = rates.filter(
          (r) => r.countryCode === country.countryCode && r.serviceType === serviceType.value
        );
        
        locations.push({
          type: "country",
          code: country.countryCode,
          name: country.countryName,
          region: country.region,
          rates: countryRates,
        });
      });
      
      // Add cities
      cities.forEach((city) => {
        const cityRates = rates.filter(
          (r) => r.cityId === city.id && r.serviceType === serviceType.value
        );
        
        locations.push({
          type: "city",
          id: city.id,
          name: `${city.cityName}, ${city.stateProvince ? city.stateProvince + ", " : ""}${city.countryCode}`,
          rates: cityRates,
        });
      });
      
      // Sort locations alphabetically
      locations.sort((a, b) => a.name.localeCompare(b.name));
      
      grouped[serviceType.value] = locations;
    });
    
    return grouped;
  }, [countries, cities, rates]);

  // Filter by search query
  const filterLocations = (locations: any[]) => {
    if (!searchQuery) return locations;
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Add loading state
  if (!countries || !cities || !rates) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rates by Service</CardTitle>
        <CardDescription>
          View and edit rates organized by service type. All locations shown for each service.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Service Type Tabs */}
        <Tabs defaultValue={RATE_SERVICE_TYPES[0].value}>
          <TabsList className="grid w-full grid-cols-3">
            {RATE_SERVICE_TYPES.map((service) => (
              <TabsTrigger key={service.value} value={service.value}>
                {service.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {RATE_SERVICE_TYPES.map((service) => (
            <TabsContent key={service.value} value={service.value}>
              <LocationRatesTable
                locations={filterLocations(locationsByService[service.value] || [])}
                supplierId={supplierId}
                onSuccess={onSuccess}
                exclusions={exclusions || []}
                responseTimeExclusions={responseTimeExclusions || []}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Rate Validation Warnings Component
function RateValidationWarnings({ baseRates }: { baseRates: Record<number, string> }) {
  const warnings = useMemo(() => {
    return validateBaseRates(baseRates);
  }, [baseRates]);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4">
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            warning.severity === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {warning.severity === "warning" ? (
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {warning.severity === "warning" ? "Pricing Issue" : "Suggestion"}
            </p>
            <p className="text-sm mt-1">{warning.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}


// Bulk Import/Export Tab Component
function BulkImportExportTab({ supplierId, onSuccess }: { supplierId: number; onSuccess: () => void }) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadTemplateMutation = trpc.supplier.downloadExcelTemplate.useQuery(
    { supplierId },
    { enabled: false }
  );

  const handleDownloadTemplate = async () => {
    toast.info("Generating Excel template...");
    try {
      const result = await downloadTemplateMutation.refetch();
      if (result.data) {
        // Convert base64 to blob and trigger download
        const byteCharacters = atob(result.data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.data.mimeType });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("Template downloaded!");
      }
    } catch (error) {
      toast.error("Failed to generate template");
      console.error(error);
    }
  };

  const parseFileMutation = trpc.supplier.parseExcelFile.useMutation();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(file);
      const fileData = await base64Promise;
      
      // Parse and validate file
      toast.info("Validating Excel file...");
      const result = await parseFileMutation.mutateAsync({
        supplierId,
        fileData,
      });
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from server');
      }
      
      setPreviewData(result);
      setValidationErrors(result.errors || []);
      
      if ((result.errors || []).length > 0) {
        toast.warning(`File uploaded with ${result.errors.length} validation error(s). Review below.`);
      } else {
        toast.success(`File validated successfully! ${result.summary.validRows} rates ready to import.`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to parse Excel file");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const importRatesMutation = trpc.supplier.importRatesFromExcel.useMutation();

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.rates) return;
    
    setIsProcessing(true);
    try {
      toast.info("Importing rates...");
      const result = await importRatesMutation.mutateAsync({
        supplierId,
        rates: previewData.rates,
      });
      
      toast.success(`Successfully imported ${result.imported} rates!${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}`);
      onSuccess();
      setUploadedFile(null);
      setPreviewData(null);
      setValidationErrors([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to import rates");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Current Rates</CardTitle>
          <CardDescription>
            Download an Excel file with all your current rates. The template includes separate sheets for each service type (L1 EUC, L1 Network, Smart Hands) with countries and cities separated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-2">Template Structure:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>6 sheets total:</strong> 3 services × 2 location types (Countries, Cities)</li>
                  <li><strong>Only your covered locations</strong> from Coverage settings</li>
                  <li><strong>Pre-filled with current rates</strong> where they exist</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Column Guide:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong className="text-amber-600">Fixed columns (Do Not Edit):</strong> Region, Location, Country Code</li>
                  <li><strong className="text-green-600">Editable columns:</strong> 4h Rate, 24h Rate, 48h Rate, 72h Rate, 96h Rate</li>
                  <li><strong>Rate format:</strong> USD with 2 decimal places (e.g., 150.00, 89.50)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Button onClick={handleDownloadTemplate} className="w-full sm:w-auto">
            Download Excel Template
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Rates from Excel</CardTitle>
          <CardDescription>
            Upload a completed Excel file to bulk update your rates. The file will be validated before import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Validation Rules:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Do not modify</strong> Region, Location, or Country Code columns</li>
                <li><strong>Rates must be in USD</strong> with exactly 2 decimal places (e.g., 150.00)</li>
                <li><strong>Locations must match</strong> your Coverage settings</li>
                <li><strong>Empty rates</strong> will be skipped (not deleted)</li>
                <li><strong>Invalid rows</strong> will be highlighted with specific error messages</li>
              </ul>
            </div>
          </div>

          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                const file = files[0];
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                  const fakeEvent = {
                    target: { files: [file] }
                  } as any;
                  handleFileUpload(fakeEvent);
                }
              }
            }}
          >
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">Excel files only (.xlsx, .xls)</p>
                </div>
              </div>
            </label>
          </div>

          {uploadedFile && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                <strong>{uploadedFile.name}</strong> uploaded successfully. Review the preview below and click "Confirm Import" to proceed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Section (shown after file upload) */}
      {uploadedFile && (
        <Card>
          <CardHeader>
            <CardTitle>Import Preview</CardTitle>
            <CardDescription>
              Review the data before confirming import. Errors must be fixed before proceeding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Summary */}
              {previewData?.summary && (
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <h4 className="font-medium mb-2">Import Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Rows:</span>
                      <span className="ml-2 font-medium">{previewData.summary.totalRows}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid Rates:</span>
                      <span className="ml-2 font-medium text-green-600">{previewData.summary.validRows}</span>
                    </div>
                  </div>
                  
                  {/* By Service Type */}
                  {Object.keys(previewData.summary.byService || {}).length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">By Service Type:</h5>
                      <div className="space-y-1 text-sm">
                        {Object.entries(previewData.summary.byService).map(([service, stats]: [string, any]) => (
                          <div key={service} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{service.replace(/_/g, ' ')}</span>
                            <span>
                              <span className="text-green-600">{stats.valid} valid</span>
                              {stats.errors > 0 && <span className="text-red-600 ml-2">{stats.errors} errors</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-900">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-3">Validation Errors ({validationErrors.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {validationErrors.map((error: any, idx: number) => (
                      <div key={idx} className="text-sm bg-white dark:bg-gray-900 rounded p-3 border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 font-mono text-xs mt-0.5">⚠</span>
                          <div className="flex-1">
                            <div className="font-medium text-red-900 dark:text-red-100">
                              {error.sheet} {error.row > 0 && `- Row ${error.row}`} {error.column && `- Column "${error.column}"`}
                            </div>
                            <div className="text-red-700 dark:text-red-300 mt-1">{error.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-3">
                    Fix these errors in your Excel file and upload again.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmImport} 
                disabled={isProcessing || validationErrors.length > 0}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Confirm Import"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setUploadedFile(null);
                  setPreviewData(null);
                  setValidationErrors([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
