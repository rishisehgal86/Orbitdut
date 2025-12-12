import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapView } from "@/components/Map";
import { Building2, Calendar, Loader2, MapPin, AlertCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { detectOOH, formatOOHReasons, getOOHPremiumLabel, type OOHDetectionResult } from "../../../shared/oohDetection";

const SERVICE_TYPES = [
  { value: "L1_EUC", label: "L1 EUC Support" },
  { value: "L1_NETWORK", label: "L1 Network Support" },
  { value: "SMART_HANDS", label: "Smart Hands" },
];

const SERVICE_LEVELS = [
  { value: "same_business_day", label: "Same Business Day", description: "Service within 4 hours (9 AM - 5 PM)" },
  { value: "next_business_day", label: "Next Business Day", description: "Service by next business day" },
  { value: "scheduled", label: "Scheduled (48+ hours)", description: "Schedule 48+ hours in advance" },
];

const DURATION_OPTIONS = [
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
  { value: "300", label: "5 hours" },
  { value: "360", label: "6 hours" },
  { value: "420", label: "7 hours" },
  { value: "480", label: "8 hours" },
];

// Helper function to get next business day (skips weekends)
function getNextBusinessDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  
  // If it's Saturday (6), add 2 days to get to Monday
  if (next.getDay() === 6) {
    next.setDate(next.getDate() + 2);
  }
  // If it's Sunday (0), add 1 day to get to Monday
  else if (next.getDay() === 0) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

// Helper function to format date for input[type="date"]
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RequestService() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceType: "",
    serviceLevel: "scheduled", // Default to scheduled
    description: "",
    siteName: "",
    address: "",
    city: "",
    country: "US",
    postalCode: "",
    latitude: "",
    longitude: "",
    timezone: "",
    scheduledDate: "",
    scheduledTime: "",
    estimatedDuration: "120", // Default 2 hours
  });

  const [mapReady, setMapReady] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isDetectingTimezone, setIsDetectingTimezone] = useState(false);
  const [oohDetection, setOohDetection] = useState<OOHDetectionResult | null>(null);

  // Auto-adjust date when service level changes
  useEffect(() => {
    const today = new Date();
    
    if (formData.serviceLevel === "same_business_day") {
      // Lock to today
      setFormData(prev => ({
        ...prev,
        scheduledDate: formatDateForInput(today),
        scheduledTime: "09:00", // Default to 9 AM
      }));
    } else if (formData.serviceLevel === "next_business_day") {
      // Lock to next business day
      const nextBizDay = getNextBusinessDay(today);
      setFormData(prev => ({
        ...prev,
        scheduledDate: formatDateForInput(nextBizDay),
        scheduledTime: "09:00", // Default to 9 AM
      }));
    } else if (formData.serviceLevel === "scheduled") {
      // Set minimum to 48 hours from now (allows weekends!)
      const minDate = new Date(today);
      minDate.setHours(minDate.getHours() + 48);
      
      setFormData(prev => ({
        ...prev,
        scheduledDate: formatDateForInput(minDate),
        scheduledTime: "09:00", // Default to 9 AM
      }));
    }
  }, [formData.serviceLevel]);

  // Detect OOH conditions whenever date, time, duration, or service level changes
  useEffect(() => {
    if (formData.scheduledDate && formData.scheduledTime && formData.serviceLevel) {
      const result = detectOOH(
        formData.scheduledDate,
        formData.scheduledTime,
        parseInt(formData.estimatedDuration),
        formData.serviceLevel as 'same_business_day' | 'next_business_day' | 'scheduled'
      );
      setOohDetection(result);
      
      // Store OOH info in sessionStorage for pricing page
      if (result.isOOH) {
        sessionStorage.setItem('oohDetection', JSON.stringify(result));
      } else {
        sessionStorage.removeItem('oohDetection');
      }
    }
  }, [formData.scheduledDate, formData.scheduledTime, formData.estimatedDuration, formData.serviceLevel]);

  const handleMapReady = (map: google.maps.Map) => {
    setMapReady(true);
    
    // Initialize Places Autocomplete
    const input = document.getElementById("address-input") as HTMLInputElement;
    if (input && window.google?.maps?.places) {
      const ac = new google.maps.places.Autocomplete(input, {
        fields: ["address_components", "geometry", "formatted_address"],
      });

      ac.addListener("place_changed", async () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Extract address components
        let city = "";
        let country = "";
        let postalCode = "";

        place.address_components?.forEach((component) => {
          const types = component.types;
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("country")) {
            country = component.short_name;
          }
          if (types.includes("postal_code")) {
            postalCode = component.long_name;
          }
        });

        setFormData((prev) => ({
          ...prev,
          address: place.formatted_address || "",
          city,
          country,
          postalCode,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        // Detect timezone
        setIsDetectingTimezone(true);
        try {
          const timezoneData = await utils.client.jobs.getTimezone.query({
            latitude: lat,
            longitude: lng,
          });
          
          setFormData((prev) => ({
            ...prev,
            timezone: timezoneData.timeZoneId,
          }));
        } catch (error) {
          console.error("Failed to detect timezone:", error);
          toast.error("Could not detect timezone. Please try again.");
        } finally {
          setIsDetectingTimezone(false);
        }

        // Center map on selected location
        map.setCenter(place.geometry.location);
        map.setZoom(15);

        // Add marker
        new google.maps.Marker({
          map,
          position: place.geometry.location,
        });
      });

      setAutocomplete(ac);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      toast.error("Please select an address from the suggestions");
      return;
    }

    // Validate service level and date match
    const selectedDate = new Date(formData.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (formData.serviceLevel === "same_business_day") {
      if (selectedDate.getTime() !== today.getTime()) {
        toast.error("Same Business Day service must be scheduled for today");
        return;
      }
    } else if (formData.serviceLevel === "next_business_day") {
      const nextBizDay = getNextBusinessDay(today);
      nextBizDay.setHours(0, 0, 0, 0);
      if (selectedDate.getTime() !== nextBizDay.getTime()) {
        toast.error("Next Business Day service must be scheduled for the next business day");
        return;
      }
    } else if (formData.serviceLevel === "scheduled") {
      const minDate = new Date();
      minDate.setHours(minDate.getHours() + 48);
      minDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < minDate) {
        toast.error("Scheduled service requires at least 48 hours advance notice");
        return;
      }
    }

    // Store form data in session storage
    sessionStorage.setItem("jobRequest", JSON.stringify(formData));
    
    // Navigate to pricing page
    setLocation("/request-service/pricing");
  };

  // Check if date field should be read-only
  const isDateLocked = formData.serviceLevel === "same_business_day" || formData.serviceLevel === "next_business_day";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Orbidut</span>
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Request a Service</h1>
              <p className="text-muted-foreground">
                Fill out the form below and we'll connect you with qualified service providers
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>How should we reach you?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, customerEmail: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                  <CardDescription>What service do you need?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="serviceType">
                        Service Type <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.serviceType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, serviceType: value })
                        }
                        required
                      >
                        <SelectTrigger id="serviceType">
                          <SelectValue placeholder="Select a service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedDuration">
                        Duration <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.estimatedDuration}
                        onValueChange={(value) =>
                          setFormData({ ...formData, estimatedDuration: value })
                        }
                      >
                        <SelectTrigger id="estimatedDuration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Minimum 2 hours, maximum 8 hours
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Task Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Describe the task or issue..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Site Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Site Location</CardTitle>
                  <CardDescription>Where do you need the service?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name (Optional)</Label>
                    <Input
                      id="siteName"
                      value={formData.siteName}
                      onChange={(e) =>
                        setFormData({ ...formData, siteName: e.target.value })
                      }
                      placeholder="e.g., Main Office, Data Center A"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address-input">
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address-input"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="pl-9"
                        placeholder="Start typing your address..."
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select from the dropdown suggestions to auto-fill location details
                    </p>
                  </div>

                  {/* Map */}
                  <div className="h-64 rounded-lg overflow-hidden border">
                    <MapView onMapReady={handleMapReady} />
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">City: {formData.city}</p>
                      <p className="text-muted-foreground">Postal Code: {formData.postalCode}</p>
                      {formData.timezone && (
                        <p className="text-muted-foreground">Timezone: {formData.timezone}</p>
                      )}
                      {isDetectingTimezone && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Detecting timezone...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>When do you need the service?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceLevel">
                      Service Level <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.serviceLevel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, serviceLevel: value })
                      }
                      required
                    >
                      <SelectTrigger id="serviceLevel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div>
                              <div className="font-medium">{level.label}</div>
                              <div className="text-xs text-muted-foreground">{level.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate">
                        Date <span className="text-destructive">*</span>
                      </Label>
                      {isDateLocked ? (
                        <>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="scheduledDate"
                              type="text"
                              value={new Date(formData.scheduledDate).toLocaleDateString()}
                              className="pl-9 bg-muted cursor-not-allowed"
                              readOnly
                            />
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Date is automatically set for {formData.serviceLevel === "same_business_day" ? "today" : "next business day"}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="scheduledDate"
                              type="date"
                              value={formData.scheduledDate}
                              onChange={(e) =>
                                setFormData({ ...formData, scheduledDate: e.target.value })
                              }
                              className="pl-9"
                              min={(() => {
                                const minDate = new Date();
                                minDate.setHours(minDate.getHours() + 48);
                                return formatDateForInput(minDate);
                              })()}
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Must be at least 48 hours from now (weekends allowed)
                          </p>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">
                        Time <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) =>
                          setFormData({ ...formData, scheduledTime: e.target.value })
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Business hours: 9 AM - 5 PM (local time)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Out-of-Hours Alert */}
              {oohDetection?.isOOH && (
                <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <AlertDescription className="text-amber-900 dark:text-amber-100">
                    <div className="font-semibold mb-1">
                      Out-of-Hours Service Detected
                    </div>
                    <div className="text-sm">
                      {formatOOHReasons(oohDetection.reasons)}. This booking will incur a{' '}
                      <span className="font-semibold">
                        {getOOHPremiumLabel(oohDetection.premiumPercent!)}
                      </span>
                      .
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Coverage & Pricing (Placeholder) */}
              {formData.latitude && formData.serviceType && formData.serviceLevel && (
                <Card>
                  <CardHeader>
                    <CardTitle>Coverage & Pricing</CardTitle>
                    <CardDescription>Checking supplier availability and pricing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Coverage check and pricing calculation will be implemented in the next phase.
                        For now, you can proceed to the pricing page to complete your request.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Link href="/">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit">
                  Continue to Pricing
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
