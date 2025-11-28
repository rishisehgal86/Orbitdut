import { useState } from "react";
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
          <TabsContent value="by-location">
            <Card>
              <CardHeader>
                <CardTitle>Rates by Location</CardTitle>
                <CardDescription>
                  Set rates for each location. Select a service type and edit rates inline.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
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

// Quick Setup Tab Component
function QuickSetupTab({ supplierId, onSuccess }: { supplierId: number; onSuccess: () => void }) {
  // Using sonner toast
  const [selectedService, setSelectedService] = useState(RATE_SERVICE_TYPES[0].value);
  const [baseRates, setBaseRates] = useState<Record<number, string>>({});
  const [isApplying, setIsApplying] = useState(false);

  // Get covered locations
  const { data: countries } = trpc.supplier.getCountries.useQuery({ supplierId });
  const { data: cities } = trpc.supplier.getPriorityCities.useQuery({ supplierId });

  const bulkUpsertMutation = trpc.supplier.bulkUpsertRates.useMutation({
    onSuccess: () => {
      toast.success("Base rates applied to all locations");
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

  const handleApplyToAll = async () => {
    // Validate that at least one rate is set
    const hasRates = Object.values(baseRates).some((v) => v && v !== "");
    if (!hasRates) {
      toast.error("Please set at least one rate before applying");
      return;
    }

    setIsApplying(true);

    // Build rate entries for all locations
    const rateEntries = [];

    // Add rates for countries
    for (const country of countries || []) {
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

    // Add rates for cities
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

    await bulkUpsertMutation.mutateAsync({ rates: rateEntries });
  };

  const totalLocations = (countries?.length || 0) + (cities?.length || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Setup</CardTitle>
        <CardDescription>
          Set base rates for a service type and apply them to all your covered locations at once
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

        {/* Base Rates Grid */}
        <div className="space-y-4">
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

        {/* Apply Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            This will apply rates to {totalLocations} location{totalLocations !== 1 ? "s" : ""}
          </p>
          <Button onClick={handleApplyToAll} disabled={isApplying}>
            {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply to All Locations
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Start by setting rates for your most common service type and response
            times. You can always customize rates for specific locations later in the "By Location" tab.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
