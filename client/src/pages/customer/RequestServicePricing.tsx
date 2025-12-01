import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CustomerLayout from "@/components/CustomerLayout";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, DollarSign, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function RequestServicePricing() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createJob = trpc.jobs.create.useMutation();

  useEffect(() => {
    // Retrieve form data from session storage
    const stored = sessionStorage.getItem("jobRequest");
    if (!stored) {
      toast.error("No job request data found");
      setLocation("/customer/request-service");
      return;
    }
    setFormData(JSON.parse(stored));
  }, [setLocation]);

  const handleSubmit = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    try {
      // Generate unique job token
      const jobToken = `JOB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Calculate price (this should match your pricing logic)
      const baseRate = 100; // $100/hour base rate
      const durationHours = parseInt(formData.estimatedDuration) / 60;
      const isOutOfHours = false; // You can add logic to detect this
      const outOfHoursMultiplier = isOutOfHours ? 1.5 : 1;
      const calculatedPrice = Math.round(baseRate * durationHours * outOfHoursMultiplier * 100); // In cents

      const result = await createJob.mutateAsync({
        // Basic job info
        jobToken,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,

        // Service details
        serviceType: formData.serviceType,
        description: formData.description || undefined,
        estimatedDuration: parseInt(formData.estimatedDuration),
        bookingType: formData.bookingType || "hourly",
        downTime: formData.downTime || false,

        // Site location
        siteName: formData.siteName || undefined,
        siteAddress: formData.address,
        city: formData.city,
        siteState: formData.siteState || undefined,
        country: formData.country,
        postalCode: formData.postalCode || undefined,
        siteLatitude: formData.latitude,
        siteLongitude: formData.longitude,
        timezone: formData.timezone || undefined,

        // Site contact
        siteContactName: formData.siteContactName || undefined,
        siteContactNumber: formData.siteContactNumber || undefined,

        // Site access & requirements
        accessInstructions: formData.accessInstructions || undefined,
        specialRequirements: formData.specialRequirements || undefined,
        equipmentNeeded: formData.equipmentNeeded || undefined,

        // Scheduling
        scheduledDateTime: `${formData.scheduledDate}T${formData.scheduledTime}`,

        // Project/Ticket info
        projectName: formData.projectName || undefined,
        changeNumber: formData.changeNumber || undefined,
        incidentNumber: formData.incidentNumber || undefined,

        // Communication
        videoConferenceLink: formData.videoConferenceLink || undefined,
        notes: formData.notes || undefined,

        // Pricing
        calculatedPrice,
        currency: "USD",
        isOutOfHours,
      });

      // Clear session storage
      sessionStorage.removeItem("jobRequest");

      toast.success("Job request submitted successfully!");
      setLocation(`/customer/jobs`);
    } catch (error: any) {
      console.error("Error creating job:", error);
      toast.error(error.message || "Failed to submit job request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CustomerLayout>
    );
  }

  const durationHours = parseInt(formData.estimatedDuration) / 60;
  const baseRate = 100;
  const isOutOfHours = false;
  const outOfHoursMultiplier = isOutOfHours ? 1.5 : 1;
  const totalPrice = baseRate * durationHours * outOfHoursMultiplier;

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review & Confirm</h1>
          <p className="text-muted-foreground">
            Review your service request details and pricing
          </p>
        </div>

        {/* Service Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Service Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-medium">{formData.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{durationHours} hours</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking Type</p>
                <p className="font-medium capitalize">{formData.bookingType || "hourly"}</p>
              </div>
              {formData.downTime && (
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <p className="font-medium text-destructive">🚨 Urgent - Causing Downtime</p>
                </div>
              )}
            </div>
            {formData.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{formData.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Location & Schedule */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.siteName && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{formData.siteName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{formData.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.city}, {formData.siteState && `${formData.siteState}, `}{formData.country}
                  </p>
                </div>
              </div>
              {(formData.siteContactName || formData.siteContactNumber) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">On-Site Contact</p>
                    {formData.siteContactName && <p className="text-sm">{formData.siteContactName}</p>}
                    {formData.siteContactNumber && <p className="text-sm">{formData.siteContactNumber}</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">
                    {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {formData.timezone && (
                    <p className="text-xs text-muted-foreground">{formData.timezone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Details */}
        {(formData.accessInstructions || formData.specialRequirements || formData.equipmentNeeded || formData.projectName || formData.notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.accessInstructions && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Access Instructions</p>
                  <p className="text-sm mt-1">{formData.accessInstructions}</p>
                </div>
              )}
              {formData.specialRequirements && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Special Requirements</p>
                  <p className="text-sm mt-1">{formData.specialRequirements}</p>
                </div>
              )}
              {formData.equipmentNeeded && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Equipment Needed</p>
                  <p className="text-sm mt-1">{formData.equipmentNeeded}</p>
                </div>
              )}
              {(formData.projectName || formData.changeNumber || formData.incidentNumber) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project/Ticket Info</p>
                  <div className="text-sm mt-1 space-y-1">
                    {formData.projectName && <p>Project: {formData.projectName}</p>}
                    {formData.changeNumber && <p>Change: {formData.changeNumber}</p>}
                    {formData.incidentNumber && <p>Incident: {formData.incidentNumber}</p>}
                  </div>
                </div>
              )}
              {formData.videoConferenceLink && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Video Conference</p>
                  <a href={formData.videoConferenceLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block">
                    {formData.videoConferenceLink}
                  </a>
                </div>
              )}
              {formData.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Additional Notes</p>
                  <p className="text-sm mt-1">{formData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Estimated cost for this service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Rate</span>
              <span>${baseRate}/hour</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span>{durationHours} hours</span>
            </div>
            {isOutOfHours && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Out of Hours Multiplier</span>
                <span>×{outOfHoursMultiplier}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Payment after completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setLocation("/customer/request-service")}
            disabled={isSubmitting}
          >
            Back to Edit
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Confirm & Submit Request
              </>
            )}
          </Button>
        </div>
      </div>
    </CustomerLayout>
  );
}
