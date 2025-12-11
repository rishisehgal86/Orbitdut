import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { COUNTRY_REGIONS } from "@shared/rates";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface BulkRateAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: number;
  countries: Array<{ countryCode: string; countryName: string }>;
  cities: Array<{ id: number; cityName: string; countryCode: string }>;
  onSuccess: () => void;
}

export function BulkRateAdjustmentDialog({
  open,
  onOpenChange,
  supplierId,
  countries,
  cities,
  onSuccess,
}: BulkRateAdjustmentDialogProps) {
  const [adjustmentPercent, setAdjustmentPercent] = useState<string>("");
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>(["L1_EUC", "L1_NETWORK", "SMART_HANDS"]);
  const [selectedServiceLevels, setSelectedServiceLevels] = useState<string[]>(["same_business_day", "next_business_day", "scheduled"]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["Africa", "Americas", "Asia", "Europe", "Oceania"]);
  const [showPreview, setShowPreview] = useState(false);

  // Convert selected regions to country codes for the API
  const selectedCountries = useMemo(() => {
    if (selectedRegions.length === 0) return [];
    return countries
      .filter(c => selectedRegions.includes(COUNTRY_REGIONS[c.countryCode]))
      .map(c => c.countryCode);
  }, [selectedRegions, countries]);

  const adjustmentValue = parseFloat(adjustmentPercent) || 0;

  // Preview query
  const { data: preview, isLoading: previewLoading } = trpc.supplier.previewBulkAdjustment.useQuery(
    {
      supplierId,
      adjustmentPercent: adjustmentValue,
      serviceTypes: selectedServiceTypes.length > 0 ? selectedServiceTypes : undefined,
      serviceLevels: selectedServiceLevels.length > 0 ? (selectedServiceLevels as any) : undefined,
      countryCodes: selectedCountries.length > 0 ? selectedCountries : undefined,
    },
    {
      enabled: showPreview && adjustmentValue !== 0,
    }
  );

  // Apply mutation
  const applyMutation = trpc.supplier.applyBulkAdjustment.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully updated ${data.updatedCount} rates`);
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      toast.error(`Failed to update rates: ${error.message}`);
    },
  });

  const handleClose = () => {
    setAdjustmentPercent("");
    setSelectedServiceTypes(["L1_EUC", "L1_NETWORK", "SMART_HANDS"]);
    setSelectedServiceLevels(["same_business_day", "next_business_day", "scheduled"]);
    setSelectedRegions(["Africa", "Americas", "Asia", "Europe", "Oceania"]);
    setShowPreview(false);
    onOpenChange(false);
  };

  const handlePreview = () => {
    if (adjustmentValue === 0) {
      toast.error("Please enter an adjustment percentage");
      return;
    }
    setShowPreview(true);
  };

  const handleApply = () => {
    applyMutation.mutate({
      supplierId,
      adjustmentPercent: adjustmentValue,
      serviceTypes: selectedServiceTypes.length > 0 ? selectedServiceTypes : undefined,
      serviceLevels: selectedServiceLevels.length > 0 ? (selectedServiceLevels as any) : undefined,
      countryCodes: selectedCountries.length > 0 ? selectedCountries : undefined,
    });
  };

  const toggleServiceType = (serviceType: string) => {
    setSelectedServiceTypes((prev) =>
      prev.includes(serviceType)
        ? prev.filter((t) => t !== serviceType)
        : [...prev, serviceType]
    );
    setShowPreview(false);
  };

  const toggleServiceLevel = (serviceLevel: string) => {
    setSelectedServiceLevels((prev) =>
      prev.includes(serviceLevel)
        ? prev.filter((l) => l !== serviceLevel)
        : [...prev, serviceLevel]
    );
    setShowPreview(false);
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
    setShowPreview(false);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatServiceType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  const formatServiceLevel = (level: string) => {
    return level.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Rate Adjustment</DialogTitle>
          <DialogDescription>
            Adjust multiple rates at once by percentage. Use filters to target specific services or locations.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Adjustment Percentage */}
            <div className="space-y-2">
              <Label htmlFor="adjustment">
                Adjustment Percentage
                {adjustmentValue > 0 && (
                  <TrendingUp className="inline h-4 w-4 ml-2 text-green-600" />
                )}
                {adjustmentValue < 0 && (
                  <TrendingDown className="inline h-4 w-4 ml-2 text-red-600" />
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="adjustment"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 10 for +10%, -5 for -5%"
                  value={adjustmentPercent}
                  onChange={(e) => {
                    setAdjustmentPercent(e.target.value);
                    setShowPreview(false);
                  }}
                />
                <span className="text-2xl font-semibold text-muted-foreground self-center">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a positive number to increase rates or negative to decrease. Example: 10 = +10%, -5 = -5%
              </p>
            </div>

            {/* Filters */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm text-muted-foreground">Filters (all selected by default - uncheck to exclude)</h4>

              {/* Service Types */}
              <div className="space-y-2">
                <Label>Service Types</Label>
                <div className="flex flex-wrap gap-2">
                  {["L1_EUC", "L1_NETWORK", "SMART_HANDS"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${type}`}
                        checked={selectedServiceTypes.includes(type)}
                        onCheckedChange={() => toggleServiceType(type)}
                      />
                      <label
                        htmlFor={`service-${type}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {formatServiceType(type)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Levels */}
              <div className="space-y-2">
                <Label>Service Levels</Label>
                <div className="flex flex-wrap gap-2">
                  {["same_business_day", "next_business_day", "scheduled"].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`level-${level}`}
                        checked={selectedServiceLevels.includes(level)}
                        onCheckedChange={() => toggleServiceLevel(level)}
                      />
                      <label
                        htmlFor={`level-${level}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {formatServiceLevel(level)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regions */}
              <div className="space-y-2">
                <Label>Regions</Label>
                <div className="flex flex-wrap gap-2">
                  {["Africa", "Americas", "Asia", "Europe", "Oceania"].map((region) => (
                    <div key={region} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region}`}
                        checked={selectedRegions.includes(region)}
                        onCheckedChange={() => toggleRegion(region)}
                      />
                      <label
                        htmlFor={`region-${region}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {region}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Preview Changes</h4>
                  {preview && (
                    <Badge variant="outline" className="bg-blue-50">
                      {preview.length} rates will be updated
                    </Badge>
                  )}
                </div>

                {previewLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!previewLoading && preview && preview.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No rates match the selected filters. Try adjusting your filters or leave them empty to apply to all rates.
                    </AlertDescription>
                  </Alert>
                )}

                {!previewLoading && preview && preview.length > 0 && (
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-4 space-y-2">
                      {preview.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {formatServiceType(item.serviceType)} - {formatServiceLevel(item.serviceLevel)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.countryCode || `City ID: ${item.cityId}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                              {formatCurrency(item.currentRateUsdCents)}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className={`font-semibold ${adjustmentValue > 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(item.newRateUsdCents)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={applyMutation.isPending}>
            Cancel
          </Button>
          {!showPreview ? (
            <Button onClick={handlePreview} disabled={adjustmentValue === 0}>
              Preview Changes
            </Button>
          ) : (
            <Button
              onClick={handleApply}
              disabled={applyMutation.isPending || !preview || preview.length === 0}
            >
              {applyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
