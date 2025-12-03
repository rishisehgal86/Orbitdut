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
    // Contact Information
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    
    // Service Details
    serviceType: "",
    description: "",
    estimatedDuration: "120",
    bookingType: "hourly" as "full_day" | "hourly" | "multi_day",
    downTime: false,
    
    // Site Location
    siteName: "",
    address: "",
    city: "",
    siteState: "",
    country: "US",
    postalCode: "",
    latitude: "",
    longitude: "",
    timezone: "",
    
    // Site Contact
    siteContactName: "",
    siteContactNumber: "",
    
    // Site Access & Requirements
    accessInstructions: "",
    specialRequirements: "",
    equipmentNeeded: "",
    
    // Scheduling
    scheduledDate: "",
    scheduledTime: "",
    
    // Project/Ticket Information
    projectName: "",
    changeNumber: "",
    incidentNumber: "",
    
    // Communication
    videoConferenceLink: "",
    notes: "",
  });

  const [mapReady, setMapReady] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [localTimeDisplay, setLocalTimeDisplay] = useState("");
  const [utcTimeDisplay, setUtcTimeDisplay] = useState("");
  const [fetchingTimezone, setFetchingTimezone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update form when user logs in or changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
      }));
    }
  }, [user]);

  // Validate field
  const validateField = (name: string, value: any) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'customerName':
        if (!value || value.trim().length < 2) {
          newErrors.customerName = 'Name must be at least 2 characters';
        } else {
          delete newErrors.customerName;
        }
        break;
      case 'customerEmail':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !emailRegex.test(value)) {
          newErrors.customerEmail = 'Please enter a valid email address';
        } else {
          delete newErrors.customerEmail;
        }
        break;
      case 'customerPhone':
        if (value && value.length > 0 && value.length < 10) {
          newErrors.customerPhone = 'Phone number must be at least 10 digits';
        } else {
          delete newErrors.customerPhone;
        }
        break;
      case 'serviceType':
        if (!value) {
          newErrors.serviceType = 'Please select a service type';
        } else {
          delete newErrors.serviceType;
        }
        break;
      case 'address':
        if (!value) {
          newErrors.address = 'Please enter a service location';
        } else if (!formData.latitude || !formData.longitude) {
          newErrors.address = 'Please select an address from the dropdown';
        } else {
          delete newErrors.address;
        }
        break;
      case 'scheduledDate':
        if (!value) {
          newErrors.scheduledDate = 'Please select a date';
        } else {
          delete newErrors.scheduledDate;
        }
        break;
      case 'scheduledTime':
        if (!value) {
          newErrors.scheduledTime = 'Please select a time';
        } else {
          delete newErrors.scheduledTime;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // Handle field blur for validation
  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true });
    validateField(name, formData[name as keyof typeof formData]);
  };

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
        let siteState = "";
        let country = "";
        let postalCode = "";

        place.address_components?.forEach((component) => {
          const types = component.types;
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            siteState = component.long_name;
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
          siteState,
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

  // Get tRPC utils for imperative queries
  const utils = trpc.useUtils();

  // Fetch timezone from Google Maps Timezone API
  const fetchTimezoneForLocation = async (lat: number, lng: number) => {
    setFetchingTimezone(true);
    try {
      const result = await utils.client.jobs.getTimezone.query({
        latitude: lat,
        longitude: lng,
      });

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

    // Debug: Log what we're storing (BEFORE validation)
    console.log('🔍 Request form - formData.siteName:', formData.siteName);
    console.log('🔍 Request form - Full formData:', formData);

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

        <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={(e) => {
                      setFormData({ ...formData, customerName: e.target.value });
                      if (touched.customerName) {
                        validateField('customerName', e.target.value);
                      }
                    }}
                    onBlur={() => handleBlur('customerName')}
                    className={errors.customerName && touched.customerName ? 'border-destructive' : ''}
                    required
                  />
                  {errors.customerName && touched.customerName && (
                    <p className="text-sm text-destructive">{errors.customerName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, customerEmail: e.target.value });
                      if (touched.customerEmail) {
                        validateField('customerEmail', e.target.value);
                      }
                    }}
                    onBlur={() => handleBlur('customerEmail')}
                    className={errors.customerEmail && touched.customerEmail ? 'border-destructive' : ''}
                    required
                  />
                  {errors.customerEmail && touched.customerEmail && (
                    <p className="text-sm text-destructive">{errors.customerEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => {
                      setFormData({ ...formData, customerPhone: e.target.value });
                      if (touched.customerPhone) {
                        validateField('customerPhone', e.target.value);
                      }
                    }}
                    onBlur={() => handleBlur('customerPhone')}
                    className={errors.customerPhone && touched.customerPhone ? 'border-destructive' : ''}
                    required
                  />
                  {errors.customerPhone && touched.customerPhone && (
                    <p className="text-sm text-destructive">{errors.customerPhone}</p>
                  )}
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
                  onValueChange={(value) => {
                    setFormData({ ...formData, serviceType: value });
                    validateField('serviceType', value);
                  }}
                  required
                >
                  <SelectTrigger 
                    id="serviceType"
                    className={errors.serviceType && touched.serviceType ? 'border-destructive' : ''}
                    onBlur={() => handleBlur('serviceType')}
                  >
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
                {errors.serviceType && touched.serviceType && (
                  <p className="text-sm text-destructive">{errors.serviceType}</p>
                )}
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

              <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="downTime"
                    checked={formData.downTime}
                    onChange={(e) =>
                      setFormData({ ...formData, downTime: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="downTime" className="cursor-pointer">
                    🚨 Urgent - Causing Downtime
                  </Label>
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
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={formData.siteName}
                  onChange={(e) =>
                    setFormData({ ...formData, siteName: e.target.value })
                  }
                  placeholder="e.g., Main Data Center, Building A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address-input">
                  Site Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address-input"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (touched.address) {
                        validateField('address', e.target.value);
                      }
                    }}
                    onBlur={() => handleBlur('address')}
                    className={`pl-9 ${errors.address && touched.address ? 'border-destructive' : ''}`}
                    placeholder="Start typing the site address..."
                    required
                  />
                </div>
                {errors.address && touched.address && (
                  <p className="text-sm text-destructive">{errors.address}</p>
                )}
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
                  {formData.siteState && <p><strong>State:</strong> {formData.siteState}</p>}
                  <p><strong>Postal Code:</strong> {formData.postalCode}</p>
                  <p><strong>Timezone:</strong> {formData.timezone}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteContactName">On-Site Contact Name</Label>
                  <Input
                    id="siteContactName"
                    value={formData.siteContactName}
                    onChange={(e) =>
                      setFormData({ ...formData, siteContactName: e.target.value })
                    }
                    placeholder="Person to contact at the site"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteContactNumber">On-Site Contact Number</Label>
                  <Input
                    id="siteContactNumber"
                    type="tel"
                    value={formData.siteContactNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, siteContactNumber: e.target.value })
                    }
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Access & Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Site Access & Requirements</CardTitle>
              <CardDescription>Help the engineer prepare for the visit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessInstructions">Access Instructions</Label>
                <Textarea
                  id="accessInstructions"
                  value={formData.accessInstructions}
                  onChange={(e) =>
                    setFormData({ ...formData, accessInstructions: e.target.value })
                  }
                  placeholder="Gate codes, building entry procedures, parking instructions, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) =>
                    setFormData({ ...formData, specialRequirements: e.target.value })
                  }
                  placeholder="Safety requirements, dress code, certifications needed, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentNeeded">Equipment/Tools Needed</Label>
                <Textarea
                  id="equipmentNeeded"
                  value={formData.equipmentNeeded}
                  onChange={(e) =>
                    setFormData({ ...formData, equipmentNeeded: e.target.value })
                  }
                  placeholder="Specific tools, equipment, or materials the engineer should bring"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Project/Ticket Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project & Ticket Information</CardTitle>
              <CardDescription>Optional - Link this job to your project or ticket system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) =>
                      setFormData({ ...formData, projectName: e.target.value })
                    }
                    placeholder="e.g., Q4 Migration"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="changeNumber">Change Number</Label>
                  <Input
                    id="changeNumber"
                    value={formData.changeNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, changeNumber: e.target.value })
                    }
                    placeholder="e.g., CHG0012345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incidentNumber">Incident Number</Label>
                  <Input
                    id="incidentNumber"
                    value={formData.incidentNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, incidentNumber: e.target.value })
                    }
                    placeholder="e.g., INC0012345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoConferenceLink">Video Conference Link</Label>
                <Input
                  id="videoConferenceLink"
                  type="url"
                  value={formData.videoConferenceLink}
                  onChange={(e) =>
                    setFormData({ ...formData, videoConferenceLink: e.target.value })
                  }
                  placeholder="Zoom, Teams, or other video call link for remote coordination"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any other information the engineer should know"
                  rows={3}
                />
              </div>
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
                      onChange={(e) => {
                        setFormData({ ...formData, scheduledDate: e.target.value });
                        if (touched.scheduledDate) {
                          validateField('scheduledDate', e.target.value);
                        }
                      }}
                      onBlur={() => handleBlur('scheduledDate')}
                      className={`pl-9 ${errors.scheduledDate && touched.scheduledDate ? 'border-destructive' : ''}`}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  {errors.scheduledDate && touched.scheduledDate && (
                    <p className="text-sm text-destructive">{errors.scheduledDate}</p>
                  )}
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
                      onChange={(e) => {
                        setFormData({ ...formData, scheduledTime: e.target.value });
                        if (touched.scheduledTime) {
                          validateField('scheduledTime', e.target.value);
                        }
                      }}
                      onBlur={() => handleBlur('scheduledTime')}
                      className={`pl-9 ${errors.scheduledTime && touched.scheduledTime ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {errors.scheduledTime && touched.scheduledTime && (
                    <p className="text-sm text-destructive">{errors.scheduledTime}</p>
                  )}
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
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="300">5 hours</SelectItem>
                      <SelectItem value="360">6 hours</SelectItem>
                      <SelectItem value="420">7 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem value="540">9 hours</SelectItem>
                      <SelectItem value="600">10 hours</SelectItem>
                      <SelectItem value="660">11 hours</SelectItem>
                      <SelectItem value="720">12 hours</SelectItem>
                      <SelectItem value="780">13 hours</SelectItem>
                      <SelectItem value="840">14 hours</SelectItem>
                      <SelectItem value="900">15 hours</SelectItem>
                      <SelectItem value="960">16 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Minimum 2 hours, maximum 16 hours</p>
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
