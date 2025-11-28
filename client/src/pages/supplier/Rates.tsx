import { useState } from "react";
import { trpc } from "@/lib/trpc";
import SupplierLayout from "@/components/SupplierLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Download, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_TYPES, RATE_RESPONSE_TIMES, formatCurrency, dollarsToCents, centsToDollars } from "@shared/rates";
import { COUNTRIES } from "@shared/countries";

export default function Rates() {
  const { data: profile } = trpc.supplier.getProfile.useQuery();
  const supplierId = profile?.supplier?.id;

  // Fetch existing rates
  const { data: rates, isLoading } = trpc.supplier.getRates.useQuery(
    { supplierId: supplierId ?? 0 },
    { enabled: !!supplierId }
  );

  // Fetch completion stats
  const { data: stats } = trpc.supplier.getRateCompletionStats.useQuery(
    { supplierId: supplierId ?? 0 },
    { enabled: !!supplierId }
  );

  // Fetch coverage to know which locations to apply rates to
  const { data: countries } = trpc.supplier.getCountries.useQuery(
    { supplierId: supplierId ?? 0 },
    { enabled: !!supplierId }
  );

  const { data: cities } = trpc.supplier.getPriorityCities.useQuery(
    { supplierId: supplierId ?? 0 },
    { enabled: !!supplierId }
  );

  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rate Management</h1>
          <p className="text-muted-foreground mt-2">
            Set your hourly rates for each service type, location, and response time
          </p>
        </div>

      {/* Completion Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Rate Setup Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Rates configured</span>
              <span className="font-medium">
                {stats?.configured || 0} / {stats?.totalPossible || 0} ({stats?.percentage || 0}%)
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${stats?.percentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Set rates for your covered locations to start receiving job offers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="quick-setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick-setup">Quick Setup</TabsTrigger>
          <TabsTrigger value="by-location">By Location</TabsTrigger>
          <TabsTrigger value="by-service">By Service</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import/Export</TabsTrigger>
        </TabsList>

        {/* Quick Setup Tab */}
        <TabsContent value="quick-setup" className="space-y-6">
          <QuickSetupTab supplierId={supplierId} countries={countries} cities={cities} />
        </TabsContent>

        {/* By Location Tab */}
        <TabsContent value="by-location" className="space-y-6">
          <ByLocationTab supplierId={supplierId} />
        </TabsContent>

        {/* By Service Tab */}
        <TabsContent value="by-service" className="space-y-6">
          <ByServiceTab supplierId={supplierId} />
        </TabsContent>

        {/* Bulk Import/Export Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <BulkOperationsTab supplierId={supplierId} />
        </TabsContent>
      </Tabs>
      </div>
    </SupplierLayout>
  );
}

/**
 * Quick Setup Tab - Base rates with bulk apply
 */
function QuickSetupTab({
  supplierId,
  countries,
  cities,
}: {
  supplierId: number | undefined;
  countries: any[] | undefined;
  cities: any[] | undefined;
}) {
  const [baseRates, setBaseRates] = useState<Record<string, Record<number, string>>>({});
  const bulkUpsertMutation = trpc.supplier.bulkUpsertRates.useMutation();
  const utils = trpc.useUtils();

  const handleRateChange = (serviceType: string, responseTimeHours: number, value: string) => {
    setBaseRates(prev => ({
      ...prev,
      [serviceType]: {
        ...(prev[serviceType] || {}),
        [responseTimeHours]: value,
      },
    }));
  };

  const handleApplyToAll = async () => {
    if (!supplierId || (!countries?.length && !cities?.length)) {
      toast.error("Please set up your coverage first");
      return;
    }

    // Build rates array for all locations
    const ratesToInsert: any[] = [];

    // For each location (country or city)
    const locations = [
      ...(countries || []).map(c => ({ countryCode: c.countryCode, cityId: null })),
      ...(cities || []).map(c => ({ countryCode: null, cityId: c.id })),
    ];

    // For each service type and response time
    for (const location of locations) {
      for (const service of SERVICE_TYPES) {
        for (const responseTime of RATE_RESPONSE_TIMES) {
          const rateValue = baseRates[service.value]?.[responseTime.hours];
          if (rateValue && parseFloat(rateValue) > 0) {
            ratesToInsert.push({
              supplierId,
              countryCode: location.countryCode,
              cityId: location.cityId,
              serviceType: service.value,
              responseTimeHours: responseTime.hours,
              rateUsdCents: dollarsToCents(parseFloat(rateValue)),
            });
          }
        }
      }
    }

    if (ratesToInsert.length === 0) {
      toast.error("Please enter at least one rate");
      return;
    }

    try {
      await bulkUpsertMutation.mutateAsync({ rates: ratesToInsert });
      await utils.supplier.getRates.invalidate();
      await utils.supplier.getRateCompletionStats.invalidate();
      toast.success(`Applied ${ratesToInsert.length} rates to ${locations.length} locations`);
      // Keep the form values so users can see what they applied
    } catch (error) {
      toast.error("Failed to apply rates");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Set Base Rates</CardTitle>
          <CardDescription>
            Define your standard hourly rates for each service type and response time.
            You can apply these to all locations at once, then customize specific locations as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {SERVICE_TYPES.map((service) => (
            <div key={service.value} className="space-y-4">
              <h3 className="font-semibold text-lg">{service.label}</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {RATE_RESPONSE_TIMES.map((responseTime) => (
                  <div key={responseTime.hours} className="space-y-2">
                    <Label htmlFor={`${service.value}-${responseTime.hours}`}>
                      {responseTime.label}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`${service.value}-${responseTime.hours}`}
                        type="number"
                        placeholder="0.00"
                        className="pl-9"
                        value={baseRates[service.value]?.[responseTime.hours] || ""}
                        onChange={(e) =>
                          handleRateChange(service.value, responseTime.hours, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-4 pt-4">
            <Button onClick={handleApplyToAll} className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Apply to All Locations
            </Button>
            <Button variant="outline" onClick={() => setBaseRates({})}>
              Clear All
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Quick Setup Tips
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Faster response times should have higher rates (e.g., 4h &gt; 24h)</li>
              <li>Leave fields empty if you don't offer that response time</li>
              <li>You can customize rates for specific locations after applying base rates</li>
              <li>All rates are in USD per hour</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * By Location Tab - Compact table view with inline editing
 */
function ByLocationTab({ supplierId }: { supplierId: number | undefined }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string>(SERVICE_TYPES[0].value);
  const [locationType, setLocationType] = useState<'country' | 'city'>('country');
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const { data: countries } = trpc.supplier.getCountries.useQuery(
    { supplierId: supplierId ?? 0 },
    { enabled: !!supplierId }
  );

  const { data: cities } = trpc.supplier.getPriorityCities.useQuery(
    { supplierId: supplierId ?? 0 },
    { enabled: !!supplierId }
  );

  const { data: rates, refetch: refetchRates } = trpc.supplier.getRates.useQuery(
    { supplierId: supplierId ?? 0 },
    { 
      enabled: !!supplierId,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  const upsertRateMutation = trpc.supplier.upsertRate.useMutation();
  const utils = trpc.useUtils();

  // Combine countries and cities into locations
  const locations = [
    ...(countries || []).map(c => ({
      id: `country-${c.countryCode}`,
      name: COUNTRIES.find(country => country.code === c.countryCode)?.name || c.countryCode,
      type: 'country' as const,
      countryCode: c.countryCode,
      cityId: null,
    })),
    ...(cities || []).map(c => ({
      id: `city-${c.id}`,
      name: `${c.cityName}, ${c.stateProvince || ''} ${c.countryCode}`.trim(),
      type: 'city' as const,
      countryCode: null,
      cityId: c.id,
    })),
  ];

  // Filter locations by search query
  const filteredLocations = locations
    .filter(loc => loc.type === locationType)
    .filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const countryCount = locations.filter(l => l.type === 'country').length;
  const cityCount = locations.filter(l => l.type === 'city').length;

  const handleRateChange = (
    location: typeof locations[0],
    serviceType: string,
    responseTimeHours: number,
    value: string
  ) => {
    // Store pending change
    const key = `${location.id}-${serviceType}-${responseTimeHours}`;
    const newChanges = new Map(pendingChanges);
    if (value === "") {
      newChanges.set(key, ""); // Empty string means delete
    } else {
      newChanges.set(key, value);
    }
    setPendingChanges(newChanges);
  };

  const handleSaveAll = async () => {
    if (!supplierId || pendingChanges.size === 0) return;

    console.log('🔵 Starting save, pending changes:', pendingChanges.size);
    console.log('🔵 Pending changes Map:', Array.from(pendingChanges.entries()));
    setIsSaving(true);
    try {
      // Process all pending changes
      for (const [key, value] of Array.from(pendingChanges.entries())) {
        const [locationId, serviceType, responseTimeHours] = key.split('-');
        const location = locations.find(l => l.id === locationId);
        if (!location) continue;

        const rateUsdCents = value && value !== "" ? dollarsToCents(parseFloat(value)) : null;

        await upsertRateMutation.mutateAsync({
          supplierId,
          countryCode: location.countryCode,
          cityId: location.cityId,
          serviceType: serviceType as any,
          responseTimeHours: parseInt(responseTimeHours),
          rateUsdCents,
        });
      }

      console.log('🟢 All mutations complete');
      
      // Store change count before clearing
      const changeCount = pendingChanges.size;
      
      // Clear pending changes BEFORE refetch so getRate() uses fresh DB data
      console.log('🔵 Clearing pending changes:', changeCount);
      setPendingChanges(new Map());
      
      // Small delay to ensure database writes complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('🔵 Refetching rates...');
      // Refetch data to show updated values
      const refetchResult = await refetchRates();
      console.log('🟢 Refetch complete, data:', refetchResult.data?.length, 'rates');
      
      await utils.supplier.getRateCompletionStats.invalidate();
      
      toast.success(`Saved ${changeCount} rate changes`);
    } catch (error) {
      toast.error("Failed to save rates");
    } finally {
      setIsSaving(false);
    }
  };

  // Get rate for a specific location/service/response time
  const getRate = (location: typeof locations[0], serviceType: string, responseTimeHours: number) => {
    // Check if there's a pending change first
    const key = `${location.id}-${serviceType}-${responseTimeHours}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key) || "";
    }

    // Otherwise get from database
    const rate = rates?.find(
      r =>
        r.serviceType === serviceType &&
        r.responseTimeHours === responseTimeHours &&
        (location.type === 'country'
          ? r.countryCode === location.countryCode
          : r.cityId === location.cityId)
    );
    return rate?.rateUsdCents ? centsToDollars(rate.rateUsdCents).toFixed(2) : "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rates by Location</CardTitle>
          <CardDescription>
            Set rates for each location. Select a service type and edit rates inline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Type Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={locationType === 'country' ? 'default' : 'outline'}
              onClick={() => setLocationType('country')}
              className="flex-1"
            >
              Countries ({countryCount})
            </Button>
            <Button
              variant={locationType === 'city' ? 'default' : 'outline'}
              onClick={() => setLocationType('city')}
              className="flex-1"
            >
              Priority Cities ({cityCount})
            </Button>
          </div>

          {/* Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-64">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pendingChanges.size > 0 && (
              <Button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="whitespace-nowrap"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save {pendingChanges.size} Changes
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Compact Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Location</th>
                    <th className="text-left p-3 font-medium text-sm">Type</th>
                    {RATE_RESPONSE_TIMES.map((rt) => (
                      <th key={rt.hours} className="text-center p-3 font-medium text-sm">
                        {rt.shortLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.slice(0, 50).map((location) => (
                    <tr key={location.id} className="border-t hover:bg-accent/50">
                      <td className="p-3 text-sm font-medium">{location.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {location.type === 'country' ? 'Country' : 'City'}
                      </td>
                      {RATE_RESPONSE_TIMES.map((responseTime) => (
                        <td key={responseTime.hours} className="p-2">
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="-"
                              className="pl-7 h-8 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={getRate(location, selectedService, responseTime.hours)}
                              onChange={(e) =>
                                handleRateChange(
                                  location,
                                  selectedService,
                                  responseTime.hours,
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {
                                // Allow backspace/delete to clear the field
                                if (e.key === 'Backspace' || e.key === 'Delete') {
                                  if (e.currentTarget.value === '') {
                                    handleRateChange(
                                      location,
                                      selectedService,
                                      responseTime.hours,
                                      ''
                                    );
                                  }
                                }
                              }}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredLocations.length > 50 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing first 50 of {filteredLocations.length} locations. Use search to find specific locations.
            </p>
          )}

          {filteredLocations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No locations found. Please set up your coverage first.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * By Service Tab - Service-first view with grid tables
 */
function ByServiceTab({ supplierId }: { supplierId: number | undefined }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="L1_EUC" className="space-y-6">
        <TabsList>
          {SERVICE_TYPES.map((service) => (
            <TabsTrigger key={service.value} value={service.value}>
              {service.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SERVICE_TYPES.map((service) => (
          <TabsContent key={service.value} value={service.value}>
            <Card>
              <CardHeader>
                <CardTitle>{service.label} Rates</CardTitle>
                <CardDescription>
                  Set hourly rates for each location and response time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Service-based rate grid coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/**
 * Bulk Operations Tab - Excel import/export
 */
function BulkOperationsTab({ supplierId }: { supplierId: number | undefined }) {
  const handleDownloadTemplate = () => {
    // TODO: Implement Excel template download
    toast.info("Excel template download coming soon");
  };

  const handleUpload = () => {
    // TODO: Implement Excel upload
    toast.info("Excel upload coming soon");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Import/Export</CardTitle>
          <CardDescription>
            Download your rates as an Excel file, edit offline, and upload to apply changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleDownloadTemplate} variant="outline" className="h-24">
              <div className="flex flex-col items-center gap-2">
                <Download className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Download Template</div>
                  <div className="text-xs text-muted-foreground">
                    Excel file with your locations
                  </div>
                </div>
              </div>
            </Button>

            <Button onClick={handleUpload} variant="outline" className="h-24">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Upload Rates</div>
                  <div className="text-xs text-muted-foreground">
                    Import completed Excel file
                  </div>
                </div>
              </div>
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Excel Template Format</h4>
            <p className="text-sm text-muted-foreground">
              The template will include columns for Location, Location Type, Service Type, and each response time (4h, 24h, 48h, 72h, 96h).
              Leave cells empty if you don't offer that combination.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
