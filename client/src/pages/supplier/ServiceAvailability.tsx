import { useState, useMemo } from "react";
import SupplierLayout from "@/components/SupplierLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RATE_SERVICE_TYPES, COUNTRY_REGIONS } from "@/../../shared/rates";
import { Search, Save, AlertCircle } from "lucide-react";

export default function ServiceAvailability() {
  const { data: profile } = trpc.supplier.getProfile.useQuery();
  const supplierId = profile?.supplier?.id;

  const { data: countries, refetch: refetchCountries } = trpc.supplier.getCountries.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );

  const { data: cities, refetch: refetchCities } = trpc.supplier.getPriorityCities.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );

  const { data: exclusions, refetch: refetchExclusions } = trpc.supplier.getServiceExclusions.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [regionTab, setRegionTab] = useState("all");
  const [localExclusions, setLocalExclusions] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local exclusions from server data
  useMemo(() => {
    if (exclusions) {
      const keys = new Set(
        exclusions.map((e) => {
          if (e.cityId) {
            return `city-${e.cityId}-${e.serviceType}`;
          } else {
            return `country-${e.countryCode}-${e.serviceType}`;
          }
        })
      );
      setLocalExclusions(keys);
    }
  }, [exclusions]);

  const bulkAddMutation = trpc.supplier.bulkAddServiceExclusions.useMutation({
    onSuccess: () => {
      toast.success("Service exclusions saved successfully");
      refetchExclusions();
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(`Failed to save exclusions: ${error.message}`);
    },
  });

  const bulkRemoveMutation = trpc.supplier.bulkRemoveServiceExclusions.useMutation();

  const handleToggleExclusion = (key: string) => {
    const newExclusions = new Set(localExclusions);
    if (newExclusions.has(key)) {
      newExclusions.delete(key);
    } else {
      newExclusions.add(key);
    }
    setLocalExclusions(newExclusions);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!supplierId) return;

    // Calculate what to add and what to remove
    const serverKeys = new Set(
      exclusions?.map((e) => {
        if (e.cityId) {
          return `city-${e.cityId}-${e.serviceType}`;
        } else {
          return `country-${e.countryCode}-${e.serviceType}`;
        }
      }) || []
    );

    const toAdd: Array<{ supplierId: number; countryCode?: string; cityId?: number; serviceType: string }> = [];
    const toRemove: Array<{ supplierId: number; countryCode?: string; cityId?: number; serviceType: string }> = [];

    // Find new exclusions to add
    localExclusions.forEach((key) => {
      if (!serverKeys.has(key)) {
        const parts = key.split("-");
        if (parts[0] === "city") {
          toAdd.push({ supplierId, cityId: parseInt(parts[1]), serviceType: parts[2] });
        } else {
          toAdd.push({ supplierId, countryCode: parts[1], serviceType: parts[2] });
        }
      }
    });

    // Find removed exclusions
    serverKeys.forEach((key) => {
      if (!localExclusions.has(key)) {
        const parts = key.split("-");
        if (parts[0] === "city") {
          toRemove.push({ supplierId, cityId: parseInt(parts[1]), serviceType: parts[2] });
        } else {
          toRemove.push({ supplierId, countryCode: parts[1], serviceType: parts[2] });
        }
      }
    });

    // Execute mutations
    try {
      if (toAdd.length > 0) {
        await bulkAddMutation.mutateAsync({ supplierId, exclusions: toAdd });
      }
      if (toRemove.length > 0) {
        await bulkRemoveMutation.mutateAsync({ supplierId, exclusions: toRemove });
      }
      if (toAdd.length === 0 && toRemove.length === 0) {
        toast.info("No changes to save");
      }
    } catch (error) {
      // Error already handled in mutation callbacks
    }
  };

  const filteredCountries = countries?.filter((country) => {
    if (!searchTerm) return true;
    return country.countryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           country.countryCode?.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  // Group countries by region
  const countriesByRegion = useMemo(() => {
    const grouped = {
      africa: [] as typeof filteredCountries,
      americas: [] as typeof filteredCountries,
      asia: [] as typeof filteredCountries,
      europe: [] as typeof filteredCountries,
      oceania: [] as typeof filteredCountries,
    };
    
    filteredCountries.forEach(country => {
      const region = COUNTRY_REGIONS[country.countryCode]?.toLowerCase();
      if (region && region in grouped) {
        grouped[region as keyof typeof grouped].push(country);
      }
    });
    
    return grouped;
  }, [filteredCountries]);

  const filteredCities = cities?.filter((city) =>
    city.cityName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!supplierId) {
    return (
      <SupplierLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Loading supplier profile...
            </p>
          </div>
        </div>
      </SupplierLayout>
    );
  }

  // Helper function to render country rows
  const renderCountryRow = (country: typeof filteredCountries[0]) => (
    <div key={country.countryCode} className="border rounded-md p-3 hover:bg-accent/30 transition-colors">
      <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4 items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">{country.countryCode}</Badge>
          <span className="text-sm font-medium truncate">{country.countryName}</span>
        </div>
        {RATE_SERVICE_TYPES.map((service) => {
          const key = `country-${country.countryCode}-${service.value}`;
          const isExcluded = localExclusions.has(key);
          return (
            <div key={service.value} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={!isExcluded}
                onCheckedChange={() => handleToggleExclusion(key)}
                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <Label
                htmlFor={key}
                className="text-sm font-normal cursor-pointer"
              >
                {service.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <SupplierLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service Availability</h1>
        <p className="text-muted-foreground mt-2">
          Manage which services you offer in each location. Check the services you provide.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Availability by Location</CardTitle>
          <CardDescription>
            Select which services you provide in each country and priority city
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasChanges && (
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                You have unsaved changes
              </p>
              <Button onClick={handleSave} size="sm" disabled={bulkAddMutation.isPending || bulkRemoveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="countries">
            <TabsList>
              <TabsTrigger value="countries">
                Countries ({filteredCountries.length})
              </TabsTrigger>
              <TabsTrigger value="cities">
                Priority Cities ({filteredCities.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="countries" className="space-y-4 mt-4">
              {/* Regional Tabs */}
              <Tabs value={regionTab} onValueChange={setRegionTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="africa">Africa</TabsTrigger>
                  <TabsTrigger value="americas">Americas</TabsTrigger>
                  <TabsTrigger value="asia">Asia</TabsTrigger>
                  <TabsTrigger value="europe">Europe</TabsTrigger>
                  <TabsTrigger value="oceania">Oceania</TabsTrigger>
                </TabsList>

                {/* All Tab */}
                <TabsContent value="all" className="space-y-1 mt-4">
                  {filteredCountries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No countries found. Add countries in your coverage settings first.
                    </div>
                  ) : (
                    filteredCountries.map(renderCountryRow)
                  )}
                </TabsContent>

                {/* Africa Tab */}
                <TabsContent value="africa" className="space-y-1 mt-4">
                  {countriesByRegion.africa.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No African countries in your coverage.
                    </div>
                  ) : (
                    countriesByRegion.africa.map(renderCountryRow)
                  )}
                </TabsContent>

                {/* Americas Tab */}
                <TabsContent value="americas" className="space-y-1 mt-4">
                  {countriesByRegion.americas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No American countries in your coverage.
                    </div>
                  ) : (
                    countriesByRegion.americas.map(renderCountryRow)
                  )}
                </TabsContent>

                {/* Asia Tab */}
                <TabsContent value="asia" className="space-y-1 mt-4">
                  {countriesByRegion.asia.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No Asian countries in your coverage.
                    </div>
                  ) : (
                    countriesByRegion.asia.map(renderCountryRow)
                  )}
                </TabsContent>

                {/* Europe Tab */}
                <TabsContent value="europe" className="space-y-1 mt-4">
                  {countriesByRegion.europe.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No European countries in your coverage.
                    </div>
                  ) : (
                    countriesByRegion.europe.map(renderCountryRow)
                  )}
                </TabsContent>

                {/* Oceania Tab */}
                <TabsContent value="oceania" className="space-y-1 mt-4">
                  {countriesByRegion.oceania.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No Oceania countries in your coverage.
                    </div>
                  ) : (
                    countriesByRegion.oceania.map(renderCountryRow)
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="cities" className="space-y-1 mt-4">
              {filteredCities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No priority cities found. Add cities in your coverage settings first.
                </div>
              ) : (
                filteredCities.map((city) => (
                  <div key={city.id} className="border rounded-md p-3 hover:bg-accent/30 transition-colors">
                    <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4 items-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{city.cityName}</span>
                        <span className="text-xs text-muted-foreground">{city.countryCode}</span>
                      </div>
                      {RATE_SERVICE_TYPES.map((service) => {
                        const key = `city-${city.id}-${service.value}`;
                        const isExcluded = localExclusions.has(key);
                        return (
                          <div key={service.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={!isExcluded}
                              onCheckedChange={() => handleToggleExclusion(key)}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Label
                              htmlFor={key}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {service.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </SupplierLayout>
  );
}
