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
import { AlertCircle, Calendar, Clock, Info, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { detectOOH, type OOHDetectionResult } from "@/../../shared/oohDetection";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SERVICE_TYPES = [
  "Level 1 End User Compute Engineer",
  "L1 Network Engineer",
  "Smart Hands",
];

export default function RequestService() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    // Contact Information
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    
    // Service Details
    serviceType: "",
    serviceLevel: "" as "same_day" | "next_day" | "scheduled" | "",
    description: "",
    estimatedDuration: "120",
    downTime: false,
    outOfHours: false,
    
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
  const [slaWarning, setSlaWarning] = useState<string | null>(null);
  const [oohDetection, setOohDetection] = useState<OOHDetectionResult | null>(null);
  const [pricingEstimate, setPricingEstimate] = useState<{
    available: boolean;
    message: string;
    estimatedPriceCents: number | null;
    minPriceCents: number | null;
    maxPriceCents: number | null;
    supplierCount: number;
    breakdown?: {
      durationHours: number;
      isOOH: boolean;
      oohSurchargePercent: number;
    };
    remoteSiteFee?: {
      customerFeeCents: number;
      supplierFeeCents: number;
      platformFeeCents: number;
      nearestMajorCity: string | null;
      distanceKm: number | null;
      billableDistanceKm: number;
    } | null;
  } | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pricingError, setPricingError] = useState(false);

  // Fetch pricing estimate when relevant form data changes
  useEffect(() => {
    const fetchPricing = async () => {
      // Check if we have all required fields
      if (
        !formData.serviceType ||
        !formData.serviceLevel ||
        !formData.estimatedDuration ||
        !formData.city ||
        !formData.country ||
        !formData.scheduledDate ||
        !formData.scheduledTime ||
        !formData.timezone
      ) {
        setPricingEstimate(null);
        return;
      }

      setLoadingPricing(true);
      setPricingError(false);
      
      try {
        // Construct ISO datetime string
        const scheduledDateTime = `${formData.scheduledDate}T${formData.scheduledTime}`;
        
        const result = await utils.client.jobs.getEstimatedPrice.query({
          serviceType: formData.serviceType,
          serviceLevel: formData.serviceLevel as "same_day" | "next_day" | "scheduled",
          durationMinutes: parseInt(formData.estimatedDuration),
          city: formData.city,
          country: formData.country,
          scheduledDateTime,
          timezone: formData.timezone,
          // Pass coordinates for remote site fee calculation
          siteLatitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          siteLongitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        });
        
        setPricingEstimate(result);
        setPricingError(false);
      } catch (error) {
        console.error("Failed to fetch pricing estimate:", error);
        setPricingEstimate(null);
        setPricingError(true);
      } finally {
        setLoadingPricing(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchPricing, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formData.serviceType,
    formData.serviceLevel,
    formData.estimatedDuration,
    formData.city,
    formData.country,
    formData.scheduledDate,
    formData.scheduledTime,
    formData.timezone,
    utils,
  ]);

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

  // OOH Detection Effect
  useEffect(() => {
    if (formData.scheduledDate && formData.scheduledTime && formData.serviceLevel) {
      const durationMinutes = parseInt(formData.estimatedDuration);
      
      const result = detectOOH(
        formData.scheduledDate,
        formData.scheduledTime,
        durationMinutes,
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
      case 'serviceLevel':
        if (!value) {
          newErrors.serviceLevel = 'Please select a service level';
        } else {
          delete newErrors.serviceLevel;
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

  // Validate SLA against selected date/time
  useEffect(() => {
    if (!formData.serviceLevel || !formData.scheduledDate) {
      setSlaWarning(null);
      return;
    }

    const now = new Date();
    const selectedDate = new Date(formData.scheduledDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Calculate next business day
    const nextBusinessDay = new Date(now);
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    while (nextBusinessDay.getDay() === 0 || nextBusinessDay.getDay() === 6) {
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    }
    const nextBizDay = new Date(nextBusinessDay.getFullYear(), nextBusinessDay.getMonth(), nextBusinessDay.getDate());
    
    // Calculate 48 hours from now
    const minScheduledDate = new Date(now);
    minScheduledDate.setHours(minScheduledDate.getHours() + 48);
    const minScheduledDay = new Date(minScheduledDate.getFullYear(), minScheduledDate.getMonth(), minScheduledDate.getDate());

    let warning = null;
    
    if (formData.serviceLevel === 'same_day' && selectedDay.getTime() !== today.getTime()) {
      warning = '⚠️ Same Business Day service requires today\'s date. The selected date does not match this service level.';
    } else if (formData.serviceLevel === 'next_day' && selectedDay.getTime() !== nextBizDay.getTime()) {
      const nextBizDateStr = nextBusinessDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      warning = `⚠️ Next Business Day service requires ${nextBizDateStr}. The selected date does not match this service level.`;
    } else if (formData.serviceLevel === 'scheduled' && selectedDay.getTime() < minScheduledDay.getTime()) {
      warning = '⚠️ Scheduled service requires at least 48 hours notice. The selected date is too soon for this service level.';
    }
    
    setSlaWarning(warning);
  }, [formData.serviceLevel, formData.scheduledDate]);

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

        // Clear address validation error since we now have coordinates
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.address;
          return newErrors;
        });

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
      // Use tRPC utils client for imperative queries
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

    if (!formData.latitude || !formData.longitude) {
      toast.error("Please select an address from the suggestions");
      return;
    }

    if (!formData.timezone) {
      toast.error("Timezone information is missing. Please reselect the address.");
      return;
    }

    // Store form data and pricing estimate in session storage
    sessionStorage.setItem("jobRequest", JSON.stringify(formData));
    
    // Store pricing estimate if available
    if (pricingEstimate) {
      sessionStorage.setItem("jobPricing", JSON.stringify(pricingEstimate));
    }
    
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
              <CardDescription>What service do you need and for how long?</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="serviceLevel">
                  Service Level (SLA) <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.serviceLevel}
                  onValueChange={(value: "same_day" | "next_day" | "scheduled") => {
                    // Auto-adjust schedule based on SLA
                    const now = new Date();
                    let newDate = '';
                    let newTime = '';

                    if (value === 'same_day') {
                      // Same day - set to today
                      newDate = now.toISOString().split('T')[0];
                      // Set time to next hour if within business hours, otherwise 9 AM
                      const currentHour = now.getHours();
                      if (currentHour < 9) {
                        newTime = '09:00';
                      } else if (currentHour < 17) {
                        newTime = `${String(currentHour + 1).padStart(2, '0')}:00`;
                      } else {
                        newTime = '09:00';
                      }
                    } else if (value === 'next_day') {
                      // Next business day
                      const tomorrow = new Date(now);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      // Skip weekend
                      while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
                        tomorrow.setDate(tomorrow.getDate() + 1);
                      }
                      newDate = tomorrow.toISOString().split('T')[0];
                      newTime = '09:00';
                    } else if (value === 'scheduled') {
                      // Scheduled - 48+ hours from now
                      const minDate = new Date(now);
                      minDate.setHours(minDate.getHours() + 48);
                      newDate = minDate.toISOString().split('T')[0];
                      newTime = '09:00';
                    }

                    setFormData({ 
                      ...formData, 
                      serviceLevel: value,
                      scheduledDate: newDate,
                      scheduledTime: newTime
                    });
                    validateField('serviceLevel', value);
                  }}
                  required
                >
                  <SelectTrigger 
                    id="serviceLevel"
                    className={errors.serviceLevel && touched.serviceLevel ? 'border-destructive' : ''}
                    onBlur={() => handleBlur('serviceLevel')}
                  >
                    <SelectValue placeholder="Select service level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_day">
                      <div className="flex flex-col">
                        <span className="font-semibold">Same Business Day</span>
                        <span className="text-xs text-muted-foreground">Response within 4 hours (9 AM - 5 PM local time)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="next_day">
                      <div className="flex flex-col">
                        <span className="font-semibold">Next Business Day</span>
                        <span className="text-xs text-muted-foreground">Response within 24 hours</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="scheduled">
                      <div className="flex flex-col">
                        <span className="font-semibold">Scheduled</span>
                        <span className="text-xs text-muted-foreground">Schedule for 48+ hours in advance</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.serviceLevel && touched.serviceLevel && (
                  <p className="text-sm text-destructive">{errors.serviceLevel}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Business hours are 9 AM - 5 PM in the site location's timezone</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">
                  Estimated Duration <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.estimatedDuration}
                  onValueChange={(value) =>
                    setFormData({ ...formData, estimatedDuration: value })
                  }
                  required
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
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Minimum 2 hours, maximum 8 hours per booking</p>
              </div>

              <div className="flex items-center space-x-2 mt-4">
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

          {/* Site Location */}
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


          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>When do you need the engineer? (Select in site local time)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {formData.timezone ? `Time in ${formData.timezone}` : 'Select site location first to see timezone'}
                  </p>
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

              {/* SLA Warning */}
              {slaWarning && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
                  <div className="flex items-start gap-2">
                    <div className="text-sm text-amber-900 dark:text-amber-100">
                      {slaWarning}
                    </div>
                  </div>
                </div>
              )}

              {/* OOH Warning */}
              {oohDetection?.isOOH && (
                <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <AlertDescription className="text-amber-900 dark:text-amber-100">
                    <div className="font-semibold mb-1">
                      Out-of-Hours Service Detected (+25% Premium)
                    </div>
                    <div className="text-sm">
                      {oohDetection.reasons.join('. ')}. A 25% surcharge applies for out-of-hours work.
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Coverage & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Coverage & Pricing</CardTitle>
              <CardDescription>Verify service availability and get cost estimate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coverage Check */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Service Coverage</h4>
                  {loadingPricing ? (
                    <span className="text-sm text-blue-600 dark:text-blue-400">Checking availability...</span>
                  ) : pricingEstimate ? (
                    pricingEstimate.available ? (
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {pricingEstimate.supplierCount} qualified supplier{pricingEstimate.supplierCount > 1 ? 's' : ''} found
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        No coverage available
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">Complete service details and location first</span>
                  )}
                </div>
                
                {pricingEstimate && pricingEstimate.available ? (
                  <div className="text-sm space-y-2">
                    <p className="text-green-700 dark:text-green-300">
                      ✓ We found {pricingEstimate.supplierCount} qualified supplier{pricingEstimate.supplierCount > 1 ? 's' : ''} who can service this location for {formData.serviceType}.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suppliers have been matched based on geographic coverage, service type availability, and service level requirements.
                    </p>
                  </div>
                ) : pricingEstimate && !pricingEstimate.available ? (
                  <div className="text-sm space-y-2">
                    <p className="text-amber-700 dark:text-amber-300">
                      {pricingEstimate.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try selecting a different service level or adjusting your schedule.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    We'll verify that qualified engineers are available in your area for the selected service type.
                  </p>
                )}
              </div>

              {/* Pricing Estimate */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Pricing Estimate</h4>
                  {loadingPricing ? (
                    <span className="text-sm text-blue-600 dark:text-blue-400">Calculating...</span>
                  ) : pricingEstimate ? (
                    pricingEstimate.available ? (
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {pricingEstimate.supplierCount} supplier{pricingEstimate.supplierCount > 1 ? 's' : ''} available
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 dark:text-red-400">Not available</span>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">Complete service details first</span>
                  )}
                </div>

                {pricingError ? (
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                          Pricing estimate unavailable
                        </p>
                        <p className="text-amber-700 dark:text-amber-300">
                          Don't worry! Detailed pricing will be shown on the next page after we match you with available suppliers.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : pricingEstimate && pricingEstimate.available ? (
                  <>
                    {/* Price Range */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Estimated Price Range</p>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ${(pricingEstimate.minPriceCents! / 100).toFixed(2)} - ${(pricingEstimate.maxPriceCents! / 100).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Average: ${(pricingEstimate.estimatedPriceCents! / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown */}
                    {pricingEstimate.breakdown && (
                      <div className="text-sm space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Total Duration:</span>
                            <span className="font-medium">{pricingEstimate.breakdown.durationHours} hours</span>
                          </div>
                          
                          {pricingEstimate.breakdown.isOOH ? (
                            <>
                              <div className="pl-4 space-y-1.5 border-l-2 border-amber-200 dark:border-amber-800">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Base Hourly Rate:</span>
                                  <span className="font-medium">${((pricingEstimate.estimatedPriceCents! / 100) / pricingEstimate.breakdown.durationHours / (1 + pricingEstimate.breakdown.oohSurchargePercent / 100)).toFixed(2)}/hour</span>
                                </div>
                                <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
                                  <span>OOH Hourly Rate (+{pricingEstimate.breakdown.oohSurchargePercent}%):</span>
                                  <span className="font-medium">${((pricingEstimate.estimatedPriceCents! / 100) / pricingEstimate.breakdown.durationHours).toFixed(2)}/hour</span>
                                </div>
                                <div className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                                  <span>All {pricingEstimate.breakdown.durationHours} hours charged at OOH rate</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Hourly Rate:</span>
                              <span className="font-medium">${((pricingEstimate.estimatedPriceCents! / 100) / pricingEstimate.breakdown.durationHours).toFixed(2)}/hour</span>
                            </div>
                          )}
                          
                          {/* Remote Site Fee */}
                          {pricingEstimate.remoteSiteFee && (
                            <div className="flex justify-between text-muted-foreground pt-2 border-t">
                              <div className="flex flex-col">
                                <span>Remote Site Fee:</span>
                                <span className="text-xs text-muted-foreground">
                                  {pricingEstimate.remoteSiteFee.distanceKm?.toFixed(1)}km from {pricingEstimate.remoteSiteFee.nearestMajorCity}
                                </span>
                                 <span className="text-xs text-muted-foreground">
                                   ({pricingEstimate.remoteSiteFee.billableDistanceKm.toFixed(1)}km beyond nearest city coverage zone)
                                 </span>
                              </div>
                              <span className="font-medium">${(pricingEstimate.remoteSiteFee.customerFeeCents / 100).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Final pricing will be confirmed after supplier matching. The estimate is based on available suppliers in your area.
                      </p>
                    </div>
                  </>
                ) : pricingEstimate && !pricingEstimate.available ? (
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                          {pricingEstimate.message}
                        </p>
                        {/* Show appropriate guidance based on the issue */}
                        {pricingEstimate.message.includes('too remote') ? (
                          <p className="text-amber-700 dark:text-amber-300">
                            Please select a different location within 300km of a major city to proceed.
                          </p>
                        ) : (
                          <p className="text-amber-700 dark:text-amber-300">
                            Try selecting a different service level or adjusting your schedule.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Enter service details, location, and schedule to see pricing estimate</p>
                  </div>
                )}
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
