import { useState, useEffect } from "react";
import SupplierLayout from "@/components/SupplierLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, MapPin, Clock, Eye, Search, X, AlertCircle } from "lucide-react";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { COUNTRIES, REGIONS_WITH_COUNTRIES } from "@shared/countries";
import { RESPONSE_TIME_OPTIONS, getResponseTimeLabel } from "@shared/responseTimes";


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
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [selectedCityIds, setSelectedCityIds] = useState<number[]>([]);

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

  const utils = trpc.useUtils();

  const deleteCity = trpc.supplier.deletePriorityCity.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.supplier.getPriorityCities.cancel();
      
      // Snapshot the previous value
      const previousCities = utils.supplier.getPriorityCities.getData({ supplierId: profile?.supplier.id || 0 });
      
      // Optimistically update to remove the city
      utils.supplier.getPriorityCities.setData(
        { supplierId: profile?.supplier.id || 0 },
        (old) => old?.filter((city) => city.id !== variables.id) || []
      );
      
      return { previousCities };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCities) {
        utils.supplier.getPriorityCities.setData(
          { supplierId: profile?.supplier.id || 0 },
          context.previousCities
        );
      }
      toast.error("Failed to remove city");
    },
    onSuccess: () => {
      toast.success("City removed");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      refetchCities();
    },
  });

  const updateResponseTime = trpc.supplier.updateResponseTime.useMutation({
    onSuccess: () => {
      toast.success("Response time updated");
      refetchTimes();
    },
  });

  const deleteResponseTime = trpc.supplier.deleteResponseTime.useMutation({
    onSuccess: () => {
      toast.success("Response time removed");
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
  ).sort((a, b) => a.name.localeCompare(b.name));

  const popularCountries = ["US", "GB", "CA", "AU", "DE", "FR", "JP", "SG"];

  // City management handlers
  const addCityMutation = addCity;
  const removeCityMutation = deleteCity;

  const handlePlaceSelect = (place: {
    placeId: string;
    cityName: string;
    stateProvince?: string;
    countryCode: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  }) => {
    if (!profile?.supplier.id) return;
    
    addCity.mutate({
      supplierId: profile.supplier.id,
      cityName: place.cityName,
      stateProvince: place.stateProvince,
      countryCode: place.countryCode,
      placeId: place.placeId,
      formattedAddress: place.formattedAddress,
      latitude: place.latitude,
      longitude: place.longitude,
    });
  };

  const handleRemoveCity = (cityId: number) => {
    if (!profile?.supplier?.id) return;
    deleteCity.mutate({ id: cityId, supplierId: profile.supplier.id });
  };

  // Response time management
  const defaultResponseTime = responseTimes?.find(rt => rt.isDefault === 1)?.responseTimeHours;

  const handleSetDefaultResponseTime = (hours: number) => {
    if (!profile?.supplier.id) return;
    
    updateResponseTime.mutate({
      supplierId: profile.supplier.id,
      countryCode: null,
      cityName: null,
      responseTimeHours: hours,
      isDefault: 1,
    });
  };

  const handleSetCountryResponseTime = (countryCode: string, hours: number | null) => {
    if (!profile?.supplier.id) return;
    
    if (hours === null) {
      // Delete custom setting to use default
      const existing = responseTimes?.find(rt => rt.countryCode === countryCode && !rt.cityName);
      if (existing) {
        deleteResponseTime.mutate({ id: existing.id });
      }
    } else {
      updateResponseTime.mutate({
        supplierId: profile.supplier.id,
        countryCode,
        cityName: null,
        responseTimeHours: hours,
        isDefault: 0,
      });
    }
  };

  const handleSetCityResponseTime = (countryCode: string, cityName: string, hours: number | null) => {
    if (!profile?.supplier.id) return;
    
    if (hours === null) {
      // Delete custom setting to use country/default
      const existing = responseTimes?.find(rt => rt.countryCode === countryCode && rt.cityName === cityName);
      if (existing) {
        deleteResponseTime.mutate({ id: existing.id });
      }
    } else {
      updateResponseTime.mutate({
        supplierId: profile.supplier.id,
        countryCode,
        cityName,
        responseTimeHours: hours,
        isDefault: 0,
      });
    }
  };

  const handleToggleCountrySelection = (countryCode: string) => {
    setSelectedCountryCodes(prev => 
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleToggleAllCountries = () => {
    if (!existingCountries) return;
    const filteredCountries = existingCountries.filter(country => {
      const countryInfo = COUNTRIES.find(c => c.code === country.countryCode);
      return !countrySearchQuery || countryInfo?.name.toLowerCase().includes(countrySearchQuery.toLowerCase());
    });
    
    if (selectedCountryCodes.length === filteredCountries.length) {
      setSelectedCountryCodes([]);
    } else {
      setSelectedCountryCodes(filteredCountries.map(c => c.countryCode));
    }
  };

  const handleBulkSetSelectedCountries = (hours: number) => {
    if (!profile?.supplier.id || selectedCountryCodes.length === 0) return;
    
    // Update each selected country
    selectedCountryCodes.forEach(countryCode => {
      updateResponseTime.mutate({
        supplierId: profile.supplier.id,
        countryCode,
        responseTimeHours: hours,
      });
    });
    
    toast.success(`Response time set for ${selectedCountryCodes.length} countries`);
    setSelectedCountryCodes([]);
  };

  const handleToggleCitySelection = (cityId: number) => {
    setSelectedCityIds(prev => 
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const handleToggleAllCities = () => {
    if (!priorityCities) return;
    const filteredCities = priorityCities.filter(city =>
      !citySearchQuery || city.cityName.toLowerCase().includes(citySearchQuery.toLowerCase())
    );
    
    if (selectedCityIds.length === filteredCities.length) {
      setSelectedCityIds([]);
    } else {
      setSelectedCityIds(filteredCities.map(c => c.id));
    }
  };

  const handleBulkSetSelectedCities = (hours: number) => {
    if (!profile?.supplier.id || selectedCityIds.length === 0 || !priorityCities) return;
    
    // Update each selected city
    const selectedCities = priorityCities.filter(c => selectedCityIds.includes(c.id));
    selectedCities.forEach(city => {
      updateResponseTime.mutate({
        supplierId: profile.supplier.id,
        countryCode: city.countryCode,
        cityName: city.cityName,
        responseTimeHours: hours,
      });
    });
    
    toast.success(`Response time set for ${selectedCityIds.length} ${selectedCityIds.length === 1 ? 'city' : 'cities'}`);
    setSelectedCityIds([]);
  };

  const handleBulkSetCountries = (hours: number) => {
    if (!profile?.supplier.id || !existingCountries) return;
    
    // Set response time for all countries
    existingCountries.forEach(country => {
      updateResponseTime.mutate({
        supplierId: profile.supplier.id!,
        countryCode: country.countryCode,
        cityName: null,
        responseTimeHours: hours,
        isDefault: 0,
      });
    });
    
    toast.success(`Set response time for all ${existingCountries.length} countries`);
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
                              <button
                                type="button"
                                className="ml-1 hover:bg-muted rounded-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCountryToggle(code);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </button>
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
                  {/* City Search Input with Google Places */}
                  <div>
                    <Label htmlFor="city-search">Search for a city</Label>
                    <div className="mt-2">
                      <PlacesAutocomplete
                        value={citySearchInput}
                        onChange={setCitySearchInput}
                        onPlaceSelect={handlePlaceSelect}
                        placeholder="Start typing a city name (e.g., London, New York, Tokyo)..."
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a city from the dropdown to add it with accurate location details
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
                                <p className="text-xs text-muted-foreground">
                                  {[city.stateProvince, COUNTRIES.find(c => c.code === city.countryCode)?.name].filter(Boolean).join(", ") || city.countryCode}
                                </p>
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

          {/* Tab 3: Response Times */}
          <TabsContent value="response">
            <div className="space-y-6">
              {/* Default Response Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Default Response Time</CardTitle>
                  <CardDescription>
                    Set your default response time for all locations without specific settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Label htmlFor="default-response" className="min-w-[200px]">
                      For all unconfigured locations, respond within:
                    </Label>
                    <Select
                      value={defaultResponseTime?.toString() || ""}
                      onValueChange={(value) => handleSetDefaultResponseTime(parseInt(value))}
                    >
                      <SelectTrigger id="default-response" className="w-[300px]">
                        <SelectValue placeholder="Select default response time" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESPONSE_TIME_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label} ({option.description})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {defaultResponseTime && (
                    <p className="text-sm text-muted-foreground mt-3">
                      This will apply to all countries and cities that don't have a custom response time set.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Country-Level Response Times */}
              <Card>
                <CardHeader>
                  <CardTitle>Country-Level Response Times</CardTitle>
                  <CardDescription>
                    Set specific response times for individual countries (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search countries..."
                        value={countrySearchQuery}
                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Bulk Actions */}
                    <div className="space-y-3">
                      {/* Selection info and actions */}
                      {selectedCountryCodes.length > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-sm font-medium">
                            {selectedCountryCodes.length} {selectedCountryCodes.length === 1 ? 'country' : 'countries'} selected
                          </p>
                          <Select onValueChange={(value) => handleBulkSetSelectedCountries(parseInt(value))}>
                            <SelectTrigger className="w-[250px]">
                              <SelectValue placeholder="Set response time for selected" />
                            </SelectTrigger>
                            <SelectContent>
                              {RESPONSE_TIME_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCountryCodes([])}
                          >
                            Clear Selection
                          </Button>
                        </div>
                      )}
                      
                      {/* Set all countries */}
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Label className="min-w-[150px]">Bulk set all countries to:</Label>
                        <Select onValueChange={(value) => handleBulkSetCountries(parseInt(value))}>
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select time for all" />
                          </SelectTrigger>
                          <SelectContent>
                            {RESPONSE_TIME_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          This will override all existing country settings
                        </p>
                      </div>
                    </div>

                    {/* Country List */}
                    {existingCountries && existingCountries.length > 0 ? (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-muted-foreground">
                            Showing response times for your {existingCountries.filter(country => {
                              const countryInfo = COUNTRIES.find(c => c.code === country.countryCode);
                              return !countrySearchQuery || countryInfo?.name.toLowerCase().includes(countrySearchQuery.toLowerCase());
                            }).length} covered countries{countrySearchQuery && ` matching "${countrySearchQuery}"`}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleAllCountries}
                          >
                            {selectedCountryCodes.length === existingCountries.filter(country => {
                              const countryInfo = COUNTRIES.find(c => c.code === country.countryCode);
                              return !countrySearchQuery || countryInfo?.name.toLowerCase().includes(countrySearchQuery.toLowerCase());
                            }).length ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        {existingCountries
                          .filter(country => {
                            const countryInfo = COUNTRIES.find(c => c.code === country.countryCode);
                            return !countrySearchQuery || countryInfo?.name.toLowerCase().includes(countrySearchQuery.toLowerCase());
                          })
                          .map((country) => {
                          const countryInfo = COUNTRIES.find(c => c.code === country.countryCode);
                          const countryResponseTime = responseTimes?.find(
                            rt => rt.countryCode === country.countryCode && !rt.cityName
                          );
                          
                          return (
                            <div
                              key={country.countryCode}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  checked={selectedCountryCodes.includes(country.countryCode)}
                                  onCheckedChange={() => handleToggleCountrySelection(country.countryCode)}
                                />
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{countryInfo?.name || country.countryCode}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Select
                                  value={countryResponseTime?.responseTimeHours?.toString() || "default"}
                                  onValueChange={(value) => 
                                    handleSetCountryResponseTime(country.countryCode, value === "default" ? null : parseInt(value))
                                  }
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">
                                      Default ({defaultResponseTime ? getResponseTimeLabel(defaultResponseTime) : "Not set"})
                                    </SelectItem>
                                    {RESPONSE_TIME_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <h3 className="font-semibold mb-1">No Countries in Coverage</h3>
                        <p className="text-sm text-muted-foreground">
                          Add countries in the Countries tab first
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Priority City Response Times */}
              {priorityCities && priorityCities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Priority City Response Times</CardTitle>
                    <CardDescription>
                      Set faster response times for your priority cities (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search cities..."
                          value={citySearchQuery}
                          onChange={(e) => setCitySearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Bulk Actions */}
                      <div className="space-y-3">
                        {/* Selection info and actions */}
                        {selectedCityIds.length > 0 && (
                          <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-sm font-medium">
                              {selectedCityIds.length} {selectedCityIds.length === 1 ? 'city' : 'cities'} selected
                            </p>
                            <Select onValueChange={(value) => handleBulkSetSelectedCities(parseInt(value))}>
                              <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Set response time for selected" />
                              </SelectTrigger>
                              <SelectContent>
                                {RESPONSE_TIME_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCityIds([])}
                            >
                              Clear Selection
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* City List */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-muted-foreground">
                            Showing {priorityCities.filter(city =>
                              !citySearchQuery || city.cityName.toLowerCase().includes(citySearchQuery.toLowerCase())
                            ).length} priority {priorityCities.filter(city =>
                              !citySearchQuery || city.cityName.toLowerCase().includes(citySearchQuery.toLowerCase())
                            ).length === 1 ? 'city' : 'cities'}{citySearchQuery && ` matching "${citySearchQuery}"`}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleAllCities}
                          >
                            {selectedCityIds.length === priorityCities.filter(city =>
                              !citySearchQuery || city.cityName.toLowerCase().includes(citySearchQuery.toLowerCase())
                            ).length ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        {priorityCities
                          .filter(city =>
                            !citySearchQuery || city.cityName.toLowerCase().includes(citySearchQuery.toLowerCase())
                          )
                          .map((city) => {
                            const cityResponseTime = responseTimes?.find(
                              rt => rt.countryCode === city.countryCode && rt.cityName === city.cityName
                            );
                            const countryResponseTime = responseTimes?.find(
                              rt => rt.countryCode === city.countryCode && !rt.cityName
                            );
                            const fallbackTime = countryResponseTime?.responseTimeHours || defaultResponseTime;
                            
                            // Validation: City response time should be faster (lower hours) than country/default
                            const cityTime = cityResponseTime?.responseTimeHours;
                            const isInvalid = cityTime && fallbackTime && cityTime > fallbackTime;
                            
                            return (
                              <div
                                key={city.id}
                                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                                  isInvalid ? 'border-destructive bg-destructive/5' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Checkbox
                                    checked={selectedCityIds.includes(city.id)}
                                    onCheckedChange={() => handleToggleCitySelection(city.id)}
                                  />
                                  <MapPin className="w-4 h-4 text-primary" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{city.cityName}</p>
                                      {isInvalid && (
                                        <AlertCircle className="w-4 h-4 text-destructive" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {COUNTRIES.find(c => c.code === city.countryCode)?.name || city.countryCode}
                                    </p>
                                    {isInvalid && (
                                      <p className="text-xs text-destructive mt-1">
                                        ⚠️ Priority city response time ({getResponseTimeLabel(cityTime!)}) should be faster than country default ({getResponseTimeLabel(fallbackTime!)})
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Select
                                    value={cityResponseTime?.responseTimeHours?.toString() || "default"}
                                    onValueChange={(value) => 
                                      handleSetCityResponseTime(city.countryCode, city.cityName, value === "default" ? null : parseInt(value))
                                    }
                                  >
                                    <SelectTrigger className="w-[200px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="default">
                                        Country default ({fallbackTime ? getResponseTimeLabel(fallbackTime) : "Not set"})
                                      </SelectItem>
                                      {RESPONSE_TIME_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value.toString()}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 4: Preview */}
          <TabsContent value="preview">
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Response Time</CardDescription>
                    <CardTitle className="text-2xl">
                      {defaultResponseTime ? getResponseTimeLabel(defaultResponseTime) : "Not set"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {responseTimes && responseTimes.filter(rt => rt.countryCode && !rt.cityName).length > 0
                        ? `${responseTimes.filter(rt => rt.countryCode && !rt.cityName).length} custom country settings`
                        : "Default for all locations"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Response Time Breakdown */}
              {existingCountries && existingCountries.length > 0 && responseTimes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Response Time Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of countries by response time commitment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {RESPONSE_TIME_OPTIONS.map(option => {
                        const countriesWithThisTime = existingCountries.filter(({ countryCode }) => {
                          const countryRT = responseTimes.find(
                            rt => rt.countryCode === countryCode && !rt.cityName
                          );
                          const effectiveTime = countryRT?.responseTimeHours || defaultResponseTime;
                          return effectiveTime === option.value;
                        });
                        
                        const percentage = existingCountries.length > 0
                          ? Math.round((countriesWithThisTime.length / existingCountries.length) * 100)
                          : 0;
                        
                        if (countriesWithThisTime.length === 0) return null;

                        return (
                          <div key={option.value} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <Label className="font-medium">{option.label}</Label>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {countriesWithThisTime.length} {countriesWithThisTime.length === 1 ? 'country' : 'countries'} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {countriesWithThisTime.slice(0, 10).map(c => COUNTRIES.find(country => country.code === c.countryCode)?.name || c.countryCode).join(' , ')}
                              {countriesWithThisTime.length > 10 && ` , +${countriesWithThisTime.length - 10} more`}
                            </p>
                          </div>
                        );
                      })}
                      
                      {/* Countries using default */}
                      {(() => {
                        const countriesUsingDefault = existingCountries.filter(({ countryCode }) => {
                          const countryRT = responseTimes.find(
                            rt => rt.countryCode === countryCode && !rt.cityName
                          );
                          return !countryRT?.responseTimeHours;
                        });
                        
                        if (countriesUsingDefault.length === 0) return null;
                        
                        const percentage = Math.round((countriesUsingDefault.length / existingCountries.length) * 100);
                        
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <Label className="font-medium">Using Default ({defaultResponseTime ? getResponseTimeLabel(defaultResponseTime) : "Not set"})</Label>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {countriesUsingDefault.length} {countriesUsingDefault.length === 1 ? 'country' : 'countries'} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-gray-400 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Priority City Response Time Distribution */}
              {priorityCities && priorityCities.length > 0 && responseTimes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Priority City Response Time Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of priority cities by response time commitment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {RESPONSE_TIME_OPTIONS.map(option => {
                        const citiesWithThisTime = priorityCities.filter((city) => {
                          const cityRT = responseTimes.find(
                            rt => rt.countryCode === city.countryCode && rt.cityName === city.cityName
                          );
                          const countryRT = responseTimes.find(
                            rt => rt.countryCode === city.countryCode && !rt.cityName
                          );
                          const effectiveTime = cityRT?.responseTimeHours || countryRT?.responseTimeHours || defaultResponseTime;
                          return effectiveTime === option.value;
                        });
                        
                        const percentage = priorityCities.length > 0
                          ? Math.round((citiesWithThisTime.length / priorityCities.length) * 100)
                          : 0;
                        
                        if (citiesWithThisTime.length === 0) return null;

                        return (
                          <div key={option.value} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <Label className="font-medium">{option.label}</Label>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {citiesWithThisTime.length} {citiesWithThisTime.length === 1 ? 'city' : 'cities'} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {citiesWithThisTime.slice(0, 10).map(city => {
                                const countryName = COUNTRIES.find(c => c.code === city.countryCode)?.name || city.countryCode;
                                return city.stateProvince ? `${city.cityName}, ${city.stateProvince}, ${countryName}` : `${city.cityName}, ${countryName}`;
                              }).join(' , ')}
                              {citiesWithThisTime.length > 10 && ` , +${citiesWithThisTime.length - 10} more`}
                            </p>
                          </div>
                        );
                      })}
                      
                      {/* Cities using country/default */}
                      {(() => {
                        const citiesUsingDefault = priorityCities.filter((city) => {
                          const cityRT = responseTimes.find(
                            rt => rt.countryCode === city.countryCode && rt.cityName === city.cityName
                          );
                          return !cityRT?.responseTimeHours;
                        });
                        
                        if (citiesUsingDefault.length === 0) return null;
                        
                        const percentage = Math.round((citiesUsingDefault.length / priorityCities.length) * 100);
                        
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <Label className="font-medium">Using Country/Default Time</Label>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {citiesUsingDefault.length} {citiesUsingDefault.length === 1 ? 'city' : 'cities'} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-gray-400 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

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
