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
                    {existingCountries.slice(0, 20).map(({ countryCode }) => {
                      const country = COUNTRIES.find(c => c.code === countryCode);
                      return (
                        <Badge key={countryCode} variant="secondary">
                          {country?.name || countryCode}
                        </Badge>
                      );
                    })}
                    {existingCountries.length > 20 && (
                      <Badge variant="outline">+{existingCountries.length - 20} more</Badge>
                    )}
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

          {/* Tab 2: Priority Cities - Placeholder */}
          <TabsContent value="cities">
            <Card>
              <CardHeader>
                <CardTitle>Priority Cities</CardTitle>
                <CardDescription>
                  Add cities where you can respond faster (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
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

          {/* Tab 4: Preview - Placeholder */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Coverage Preview</CardTitle>
                <CardDescription>
                  Review your complete coverage setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">Countries Covered:</Label>
                    <p className="text-muted-foreground">
                      {existingCountries?.length || 0} countries
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Priority Cities:</Label>
                    <p className="text-muted-foreground">
                      {priorityCities?.length || 0} cities
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Response Time Zones:</Label>
                    <p className="text-muted-foreground">
                      {responseTimes?.length || 0} zones configured
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SupplierLayout>
  );
}
