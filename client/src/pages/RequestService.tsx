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
import { Building2, Calendar, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const SERVICE_TYPES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance Repair",
  "Locksmith",
  "Handyman",
  "Cleaning",
  "Pest Control",
  "Other",
];

export default function RequestService() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceType: "",
    description: "",
    address: "",
    city: "",
    country: "US",
    postalCode: "",
    latitude: "",
    longitude: "",
    scheduledDate: "",
    scheduledTime: "",
    estimatedDuration: "60",
  });

  const [mapReady, setMapReady] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const handleMapReady = (map: google.maps.Map) => {
    setMapReady(true);
    
    // Initialize Places Autocomplete
    const input = document.getElementById("address-input") as HTMLInputElement;
    if (input && window.google?.maps?.places) {
      const ac = new google.maps.places.Autocomplete(input, {
        fields: ["address_components", "geometry", "formatted_address"],
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

        setFormData((prev) => ({
          ...prev,
          address: place.formatted_address || "",
          city,
          country,
          postalCode,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

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

    // Store form data in session storage
    sessionStorage.setItem("jobRequest", JSON.stringify(formData));
    
    // Navigate to pricing page
    setLocation("/request-service/pricing");
  };

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
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Describe the issue or service needed..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Location</CardTitle>
                  <CardDescription>Where do you need the service?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="text-sm text-muted-foreground">
                      <p>City: {formData.city}</p>
                      <p>Postal Code: {formData.postalCode}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scheduling */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>When do you need the service?</CardDescription>
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
                </CardContent>
              </Card>

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
