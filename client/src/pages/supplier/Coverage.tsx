import { useState, useEffect } from "react";
import SupplierLayout from "@/components/SupplierLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, MapPin, Clock, Eye, Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { COUNTRIES, REGIONS_WITH_COUNTRIES } from "@shared/countries";

type CoverageMode = "quick" | "regional" | "custom";

export default function Coverage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("countries");
  const [coverageMode, setCoverageMode] = useState<CoverageMode | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExclusionMode, setIsExclusionMode] = useState(false);
  const [citySearchInput, setCitySearchInput] = useState("");

  // Get supplier profile
  const { data: profile } = trpc.supplier.getProfile.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Get existing coverage
  const { data: existingCountries, refetch: refetchCountries } = trpc.supplier.getCountries.useQuery(
    { supplierId: profile?.supplier.id || 0 },
    { enabled: !!profile }
  );

  const { data: priorityCities, refetch: refetchCities } = trpc.supplier.getPriorityCities.useQuery(
    { supplierId: profile?.supplier.id || 0 },
    { enabled: !!profile }
  );

  const { data: responseTimes, refetch: refetchTimes } = trpc.supplier.getResponseTimes.useQuery(
    { supplierId: profile?.supplier.id || 0 },
    { enabled: !!profile }
  );

  // Mutations
  const updateCountries = trpc.supplier.updateCountries.useMutation({
    onSuccess: () => {
      toast.success("Coverage updated successfully");
      refetchCountries();
      setCoverageMode(null); // Return to main view
      setSelectedRegions([]); // Clear selections
      setSelectedCountries([]);
    },
    onError: (error) => {
      toast.error(`Failed to update coverage: ${error.message}`);
    },
  });

  const addCity = trpc.supplier.addPriorityCity.useMutation({
    onSuccess: () => {
      toast.success("Priority city added");
      refetchCities();
    },
  });

  const deleteCity = trpc.supplier.deletePriorityCity.useMutation({
    onSuccess: () => {
      toast.success("City removed");
      refetchCities();
    },
  });

  const updateResponseTime = trpc.supplier.updateResponseTime.useMutation({
    onSuccess: () => {
      toast.success("Response time updated");
      refetchTimes();
    },
  });

  // Handle quick setup modes
  const handleGlobalCoverage = () => {
    const allCountryCodes = COUNTRIES.map(c => c.code);
    setSelectedCountries(allCountryCodes);
    updateCountries.mutate({
      supplierId: profile?.supplier.id || 0,
      countryCodes: allCountryCodes,
      isExcluded: false,
    });
  };

  const handleRegionalSelection = () => {
    setCoverageMode("regional");
    setSelectedRegions([]);
  };

  const handleCustomSelection = () => {
    setCoverageMode("custom");
  };

  // Load existing countries when entering custom mode
  useEffect(() => {
    if (coverageMode === "custom" && existingCountries) {
      setSelectedCountries(existingCountries.map(c => c.countryCode));
    }
  }, [coverageMode, existingCountries]);

  const handleRegionToggle = (regionName: string) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionName)) {
        return prev.filter(r => r !== regionName);
      } else {
        return [...prev, regionName];
      }
    });
  };

  const applyRegionalSelection = () => {
    const countryCodes: string[] = [];
    selectedRegions.forEach(regionName => {
      const region = REGIONS_WITH_COUNTRIES.find(r => r.name === regionName);
      if (region) {
        countryCodes.push(...region.countries);
      }
    });
    
    setSelectedCountries(countryCodes);
    updateCountries.mutate({
      supplierId: profile?.supplier.id || 0,
      countryCodes,
      isExcluded: false,
    });
  };

  const handleCountryToggle = (countryCode: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryCode)) {
        return prev.filter(c => c !== countryCode);
      } else {
        return [...prev, countryCode];
      }
    });
  };

  const applyCustomSelection = () => {
    updateCountries.mutate({
      supplierId: profile?.supplier.id || 0,
      countryCodes: selectedCountries,
      isExcluded: isExclusionMode,
    });
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularCountries = ["US", "GB", "CA", "AU", "DE", "FR", "JP", "SG"];

  // City management handlers
  const addCityMutation = addCity;
  const removeCityMutation = deleteCity;

  const handleAddCity = () => {
    if (!citySearchInput.trim() || !profile?.supplier.id) return;
    
    addCity.mutate({
      supplierId: profile.supplier.id,
      cityName: citySearchInput.trim(),
      countryCode: "US", // Default to US, will be enhanced with geocoding later
      latitude: undefined,
      longitude: undefined,
    });
    
    setCitySearchInput("");
  };

  const handleRemoveCity = (cityId: number) => {
    deleteCity.mutate({ id: cityId });
  };

  if (!profile) {
    return (
      <SupplierLayout>
        <div className="p-8 text-center">
          <p>Please complete your supplier profile first.</p>
        </div>
      </SupplierLayout>
    );
  }

  return (
    <SupplierLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Geographic Coverage</h1>
          <p className="text-muted-foreground mt-2">
            Define where you can provide services to receive relevant job offers
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="countries">
              <Globe className="w-4 h-4 mr-2" />
              Countries
            </TabsTrigger>
            <TabsTrigger value="cities">
              <MapPin className="w-4 h-4 mr-2" />
              Priority Cities
            </TabsTrigger>
            <TabsTrigger value="response">
              <Clock className="w-4 h-4 mr-2" />
              Response Times
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Countries */}
          <TabsContent value="countries" className="space-y-6">
            {/* Current Coverage Display */}
            {existingCountries && existingCountries.length > 0 && !coverageMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Coverage</CardTitle>
                  <CardDescription>
                    You are currently covering {existingCountries.length} {existingCountries.length === 1 ? 'country' : 'countries'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {existingCountries
                      .map(({ countryCode }) => ({
                        code: countryCode,
                        name: COUNTRIES.find(c => c.code === countryCode)?.name || countryCode
                      }))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(({ code, name }) => (
                        <Badge key={code} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCustomSelection}>
                    Edit Coverage
                  </Button>
                </CardContent>
              </Card>
            )}

            {!coverageMode && (
              <Card>
                <CardHeader>
                  <CardTitle>How would you like to define your coverage?</CardTitle>
                  <CardDescription>
                    Choose the option that best fits your service area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={handleGlobalCoverage}
                    >
                      <CardContent className="pt-6 text-center">
                        <Globe className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <h3 className="font-semibold mb-2">Global Coverage</h3>
                        <p className="text-sm text-muted-foreground">
                          Service all 195 countries worldwide
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={handleRegionalSelection}
                    >
                      <CardContent className="pt-6 text-center">
                        <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <h3 className="font-semibold mb-2">Regional Coverage</h3>
                        <p className="text-sm text-muted-foreground">
                          Select specific regions (e.g., Europe, Asia)
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={handleCustomSelection}
                    >
                      <CardContent className="pt-6 text-center">
                        <Search className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <h3 className="font-semibold mb-2">Custom Select</h3>
                        <p className="text-sm text-muted-foreground">
                          Search and pick individual countries
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {coverageMode === "regional" && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Regions You Cover</CardTitle>
                  <CardDescription>
                    Choose one or more regions to automatically include all countries within them
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {REGIONS_WITH_COUNTRIES.map(region => (
                    <div key={region.name} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedRegions.includes(region.name)}
                        onCheckedChange={() => handleRegionToggle(region.name)}
                      />
                      <div className="flex-1">
                        <Label className="font-medium">{region.name}</Label>
                        <p className="text-sm text-muted-foreground">
                          {region.countries.length} countries
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={applyRegionalSelection} 
                      disabled={selectedRegions.length === 0 || updateCountries.isPending}
                    >
                      {updateCountries.isPending ? "Saving..." : `Save Selection (${selectedRegions.reduce((acc, name) => {
                        const region = REGIONS_WITH_COUNTRIES.find(r => r.name === name);
                        return acc + (region?.countries.length || 0);
                      }, 0)} countries)`}
                    </Button>
                    <Button variant="outline" onClick={() => setCoverageMode(null)}>
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {coverageMode === "custom" && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Country Selection</CardTitle>
                  <CardDescription>
                    Search and select individual countries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search countries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Selected countries */}
                  {selectedCountries.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Selected ({selectedCountries.length}):</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCountries.map(code => {
                          const country = COUNTRIES.find(c => c.code === code);
                          return (
                            <Badge key={code} variant="secondary" className="gap-1">
                              {country?.name}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => handleCountryToggle(code)}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Popular countries */}
                  <div>
                    <Label className="mb-2 block">Popular:</Label>
                    <div className="flex flex-wrap gap-2">
                      {popularCountries.map(code => {
                        const country = COUNTRIES.find(c => c.code === code);
                        const isSelected = selectedCountries.includes(code);
                        return (
                          <Button
                            key={code}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCountryToggle(code)}
                          >
                            {isSelected ? "✓ " : "+ "}{country?.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* All countries list */}
                  <div>
                    <Label className="mb-2 block">All Countries (A-Z):</Label>
                    <div className="border rounded-lg max-h-96 overflow-y-auto p-4 space-y-2">
                      {filteredCountries.map(country => (
                        <div key={country.code} className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedCountries.includes(country.code)}
                            onCheckedChange={() => handleCountryToggle(country.code)}
                          />
                          <Label className="flex-1 cursor-pointer">
                            {country.name} ({country.code})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={applyCustomSelection} 
                      disabled={selectedCountries.length === 0 || updateCountries.isPending}
                    >
                      {updateCountries.isPending ? "Saving..." : `Save Selection (${selectedCountries.length} countries)`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCountries(COUNTRIES.map(c => c.code))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCountries([])}
                    >
                      Deselect All
                    </Button>
                    <Button variant="outline" onClick={() => setCoverageMode(null)}>
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Priority Cities */}
          <TabsContent value="cities">
            <Card>
              <CardHeader>
                <CardTitle>Priority Cities</CardTitle>
                <CardDescription>
                  Add cities where you can provide faster response times. These will be highlighted to customers in your coverage area.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* City Search Input */}
                  <div>
                    <Label htmlFor="city-search">Search for a city</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="city-search"
                        placeholder="Start typing a city name..."
                        value={citySearchInput}
                        onChange={(e) => setCitySearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && citySearchInput.trim()) {
                            handleAddCity();
                          }
                        }}
                      />
                      <Button
                        onClick={handleAddCity}
                        disabled={!citySearchInput.trim() || addCityMutation.isPending}
                      >
                        {addCityMutation.isPending ? 'Adding...' : 'Add City'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter city name (e.g., "New York", "London", "Tokyo")
                    </p>
                  </div>

                  {/* Current Priority Cities */}
                  {priorityCities && priorityCities.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Your Priority Cities ({priorityCities.length})</Label>
                      <div className="space-y-2">
                        {priorityCities.map((city) => (
                          <div
                            key={city.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-primary" />
                              <div>
                                <p className="font-medium">{city.cityName}</p>
                                {city.countryCode && (
                                  <p className="text-xs text-muted-foreground">
                                    {COUNTRIES.find(c => c.code === city.countryCode)?.name || city.countryCode}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCity(city.id)}
                              disabled={removeCityMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!priorityCities || priorityCities.length === 0) && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="font-semibold mb-1">No Priority Cities Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Add cities where you can provide faster service to attract more customers
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Response Times - Placeholder */}
          <TabsContent value="response">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>
                  Set your typical on-site arrival time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Preview */}
          <TabsContent value="preview">
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Countries</CardDescription>
                    <CardTitle className="text-4xl">{existingCountries?.length || 0}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {existingCountries?.length === 195 || existingCountries?.length === 196 ? "Global coverage" : "Custom coverage"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Priority Cities</CardDescription>
                    <CardTitle className="text-4xl">{priorityCities?.length || 0}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Fast response locations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Regions Covered</CardDescription>
                    <CardTitle className="text-4xl">
                      {existingCountries ? (() => {
                        const coveredRegions = new Set<string>();
                        existingCountries.forEach(({ countryCode }) => {
                          REGIONS_WITH_COUNTRIES.forEach(region => {
                            if (region.countries.includes(countryCode)) {
                              coveredRegions.add(region.name);
                            }
                          });
                        });
                        return coveredRegions.size;
                      })() : 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Out of 5 global regions
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Region Breakdown */}
              {existingCountries && existingCountries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Coverage by Region</CardTitle>
                    <CardDescription>
                      Breakdown of your geographic coverage across continents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {REGIONS_WITH_COUNTRIES.map(region => {
                        const coveredInRegion = existingCountries.filter(({ countryCode }) =>
                          region.countries.includes(countryCode)
                        );
                        const percentage = Math.round((coveredInRegion.length / region.countries.length) * 100);
                        
                        if (coveredInRegion.length === 0) return null;

                        return (
                          <div key={region.name} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="font-medium">{region.name}</Label>
                              <span className="text-sm text-muted-foreground">
                                {coveredInRegion.length} / {region.countries.length} countries ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {coveredInRegion.slice(0, 10).map(({ countryCode }) => {
                                const country = COUNTRIES.find(c => c.code === countryCode);
                                return (
                                  <span key={countryCode} className="text-xs text-muted-foreground">
                                    {country?.name}
                                  </span>
                                );
                              }).reduce((prev: any, curr: any, i: number) => [
                                prev,
                                i > 0 && <span key={`sep-${i}`} className="text-xs text-muted-foreground">, </span>,
                                curr
                              ], [])}
                              {coveredInRegion.length > 10 && (
                                <span className="text-xs text-muted-foreground">
                                  , +{coveredInRegion.length - 10} more
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {(!existingCountries || existingCountries.length === 0) && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Coverage Defined</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Go to the Countries tab to set up your service coverage
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SupplierLayout>
  );
}
