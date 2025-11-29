import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RATE_SERVICE_TYPES } from "@/../../shared/rates";
import { Search, Save, AlertCircle } from "lucide-react";

export default function Coverage() {
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
      toast.error(`Failed to save exclusions: \${error.message}`);
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
          return `city-\${e.cityId}-\${e.serviceType}`;
        } else {
          return `country-\${e.countryCode}-\${e.serviceType}`;
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
        const [type, id, serviceType] = key.split("-");
        if (type === "country") {
          toAdd.push({ supplierId, countryCode: id, serviceType });
        } else {
          toAdd.push({ supplierId, cityId: parseInt(id), serviceType });
        }
      }
    });

    // Find removals
    exclusions?.forEach((e) => {
      const key = e.cityId
        ? `city-\${e.cityId}-\${e.serviceType}`
        : `country-\${e.countryCode}-\${e.serviceType}`;
      if (!localExclusions.has(key)) {
        toRemove.push({ id: e.id, supplierId });
      }
    });

    // Execute mutations
    try {
      if (toAdd.length > 0) {
        await bulkAddMutation.mutateAsync({ exclusions: toAdd });
      }
      for (const removal of toRemove) {
        await bulkRemoveMutation.mutateAsync(removal);
      }
      toast.success("Service exclusions saved successfully");
      refetchExclusions();
      setHasChanges(false);
    } catch (error: any) {
      toast.error(`Failed to save exclusions: \${error.message}`);
    }
  };

  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    return countries.filter((c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [countries, searchTerm]);

  const filteredCities = useMemo(() => {
    if (!cities) return [];
    return cities.filter((c) =>
      c.cityName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cities, searchTerm]);

  if (!supplierId) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Coverage Management</CardTitle>
            <CardDescription>Loading supplier profile...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coverage Management</h1>
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

            <TabsContent value="countries" className="space-y-2 mt-4">
              {filteredCountries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No countries found. Add countries in your coverage settings first.
                </p>
              ) : (
                filteredCountries.map((country) => (
                  <Card key={country.countryCode}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-medium">{country.name}</h3>
                            <Badge variant="outline">{country.countryCode}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {RATE_SERVICE_TYPES.map((service) => {
                              const key = `country-${country.countryCode}-${service.value}`;
                              const isExcluded = localExclusions.has(key);
                              return (
                                <div
                                  key={service.value}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={key}
                                    checked={!isExcluded}
                                    onCheckedChange={() => handleToggleExclusion(key)}
                                  />
                                  <label
                                    htmlFor={key}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {service.label}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="cities" className="space-y-2 mt-4">
              {filteredCities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No priority cities found. Add cities in your coverage settings first.
                </p>
              ) : (
                filteredCities.map((city) => (
                  <Card key={city.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-medium">{city.cityName}</h3>
                            {city.stateProvince && (
                              <Badge variant="outline">{city.stateProvince}</Badge>
                            )}
                            <Badge variant="secondary">{city.countryCode}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {RATE_SERVICE_TYPES.map((service) => {
                              const key = `city-${city.id}-${service.value}`;
                              const isExcluded = localExclusions.has(key);
                              return (
                                <div
                                  key={service.value}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={key}
                                    checked={!isExcluded}
                                    onCheckedChange={() => handleToggleExclusion(key)}
                                  />
                                  <label
                                    htmlFor={key}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {service.label}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
