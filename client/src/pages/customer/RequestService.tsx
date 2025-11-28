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
import { MapView } from "@/components/Map";
import CustomerLayout from "@/components/CustomerLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, Info, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const SERVICE_TYPES = [
  "Level 1 End User Compute Engineer",
  "L1 Network Engineer",
  "Smart Hands",
];

export default function RequestService() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    serviceType: "",
    description: "",
    address: "",
    city: "",
    country: "US",
    postalCode: "",
    latitude: "",
    longitude: "",
    timezone: "",
    scheduledDate: "",
    scheduledTime: "",
    estimatedDuration: "60",
  });

  const [mapReady, setMapReady] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [localTimeDisplay, setLocalTimeDisplay] = useState("");
  const [utcTimeDisplay, setUtcTimeDisplay] = useState("");
  const [fetchingTimezone, setFetchingTimezone] = useState(false);

  // Update time displays when date, time, or timezone changes
  useEffect(() => {
    if (formData.scheduledDate && formData.scheduledTime && formData.timezone) {
      try {
        // Parse local time
        const localDateTime = `${formData.scheduledDate}T${formData.scheduledTime}`;
        const localDate = new Date(localDateTime);
        
        // Format local time with timezone
        const localFormatted = new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: formData.timezone,
        }).format(localDate);
        
        // Format UTC time
        const utcFormatted = new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'UTC',
        }).format(localDate);
        
        setLocalTimeDisplay(localFormatted);
        setUtcTimeDisplay(utcFormatted + " UTC");
      } catch (error) {
        console.error("Error formatting time:", error);
      }
    }
  }, [formData.scheduledDate, formData.scheduledTime, formData.timezone]);

  const handleMapReady = (map: google.maps.Map) => {
    setMapReady(true);
    
    // Initialize Places Autocomplete
    const input = document.getElementById("address-input") as HTMLInputElement;
    if (input && window.google?.maps?.places) {
      const ac = new google.maps.places.Autocomplete(input, {
        fields: ["address_components", "geometry", "formatted_address", "utc_offset_minutes"],
      });

      ac.addListener("place_changed", () => {
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

        // Update form data first
        setFormData((prev) => ({
          ...prev,
          address: place.formatted_address || "",
          city,
          country,
          postalCode,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        // Fetch timezone from Google Maps API
        fetchTimezoneForLocation(lat, lng);

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

  // Fetch timezone from Google Maps Timezone API
  const fetchTimezoneForLocation = async (lat: number, lng: number) => {
    setFetchingTimezone(true);
    try {
      // Use fetch to call the tRPC endpoint directly
      const response = await fetch(
        `/api/trpc/jobs.getTimezone?input=${encodeURIComponent(
          JSON.stringify({ latitude: lat, longitude: lng })
        )}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch timezone");
      }
      
      const data = await response.json();
      const result = data.result.data;

      setFormData((prev) => ({
        ...prev,
        timezone: result.timeZoneId,
      }));

      toast.success(`Timezone detected: ${result.timeZoneName}`);
    } catch (error) {
      console.error("Error fetching timezone:", error);
      toast.error("Failed to detect timezone. Defaulting to UTC.");
      setFormData((prev) => ({
        ...prev,
        timezone: "UTC",
      }));
    } finally {
      setFetchingTimezone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      toast.error("Please select an address from the suggestions");
      return;
    }

    if (!formData.timezone) {
      toast.error("Timezone information is missing. Please reselect the address.");
      return;
    }

    // Store form data in session storage
    sessionStorage.setItem("jobRequest", JSON.stringify(formData));
    
    // Navigate to pricing page
    setLocation("/customer/request-service/pricing");
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Engineer Service</h1>
          <p className="text-muted-foreground">
            Fill out the form below and we'll connect you with qualified engineers
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
              <CardDescription>What type of engineer do you need?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType">
                  Engineer Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, serviceType: value })
                  }
                  required
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Select engineer type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Task Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the task or issue that needs to be addressed..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Site Location</CardTitle>
              <CardDescription>Where do you need the engineer?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address-input">
                  Site Address <span className="text-destructive">*</span>
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
                    placeholder="Start typing the site address..."
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Select from the dropdown suggestions to auto-fill location details and timezone
                </p>
              </div>

              {/* Map */}
              <div className="h-64 rounded-lg overflow-hidden border">
                <MapView onMapReady={handleMapReady} />
              </div>

              {formData.latitude && formData.longitude && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p><strong>City:</strong> {formData.city}</p>
                  <p><strong>Postal Code:</strong> {formData.postalCode}</p>
                  <p><strong>Timezone:</strong> {formData.timezone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>When do you need the engineer? (Select in site local time)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">
                    Date <span className="text-destructive">*</span>
                  </Label>
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
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">
                    Time (Local) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledTime: e.target.value })
                      }
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Estimated Duration</Label>
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
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Time Display */}
              {localTimeDisplay && utcTimeDisplay && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">Scheduled Time</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Local ({formData.timezone}):</strong> {localTimeDisplay}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>UTC:</strong> {utcTimeDisplay}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" size="lg">
              Continue to Pricing
            </Button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
