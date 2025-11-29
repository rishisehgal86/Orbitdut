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
import { RATE_SERVICE_TYPES } from "@/../../shared/rates";
import { Search, Save, AlertCircle } from "lucide-react";

export default function ServiceExclusions() {
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

    const toAdd: Array<{
      supplierId: number;
      countryCode?: string;
      cityId?: number;
      serviceType: string;
    }> = [];

    const toRemove: Array<{ id: number; supplierId: number }> = [];

    // Find additions
    localExclusions.forEach((key) => {
      if (!serverKeys.has(key)) {
        const parts = key.split("-");
        if (parts[0] === "city") {
          toAdd.push({
            supplierId,
            cityId: parseInt(parts[1]),
            serviceType: parts[2],
          });
        } else {
          toAdd.push({
            supplierId,
            countryCode: parts[1],
            serviceType: parts[2],
          });
        }
      }
    });

    // Find removals
    exclusions?.forEach((e) => {
      const key = e.cityId
        ? `city-${e.cityId}-${e.serviceType}`
        : `country-${e.countryCode}-${e.serviceType}`;
      if (!localExclusions.has(key)) {
        toRemove.push({ id: e.id, supplierId });
      }
    });

    // Execute mutations
    try {
      if (toAdd.length > 0) {
        await bulkAddMutation.mutateAsync({ exclusions: toAdd });
      }
      if (toRemove.length > 0) {
        await bulkRemoveMutation.mutateAsync({ exclusions: toRemove });
      }
      if (toAdd.length === 0 && toRemove.length === 0) {
        toast.info("No changes to save");
      }
    } catch (error) {
      // Error already handled in mutation callbacks
    }
  };

  const filteredCountries = countries?.filter((country) =>
    country.countryName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  return (
    <SupplierLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service Exclusions</h1>
        <p className="text-muted-foreground mt-2">
          Manage which services you offer in each location. Uncheck services you don't provide.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Exclusions</CardTitle>
              <CardDescription>
                Select which service types you DO NOT offer in each location
              </CardDescription>
            </div>
            {hasChanges && (
              <Button onClick={handleSave} disabled={bulkAddMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasChanges && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                You have unsaved changes. Click "Save Changes" to apply them.
              </p>
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

            <TabsContent value="countries" className="space-y-1 mt-4">
              {filteredCountries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No countries found. Add countries in your coverage settings first.
                </div>
              ) : (
                filteredCountries.map((country) => (
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

            <TabsContent value="cities" className="space-y-1 mt-4">
              {filteredCities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No priority cities found. Add cities in your coverage settings first.
                </div>
              ) : (
                filteredCities.map((city) => (
                  <div key={city.id} className="border rounded-md p-3 hover:bg-accent/30 transition-colors">
                    <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{city.countryCode}</Badge>
                        <span className="text-sm font-medium truncate" title={`${city.cityName}${city.state ? ', ' + city.state : ''}`}>
                          {city.cityName}{city.state && <span className="text-xs text-muted-foreground ml-1">({city.state})</span>}
                        </span>
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
