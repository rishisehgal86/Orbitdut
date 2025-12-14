import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CustomerLayout from "@/components/CustomerLayout";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Calendar, Clock, DollarSign, Info, Loader2, MapPin, Phone, User, FileText, Video, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function RequestServicePricing() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<any>(null);
  const [pricingEstimate, setPricingEstimate] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createJob = trpc.jobs.create.useMutation();

  useEffect(() => {
    // Retrieve form data and pricing from session storage
    const storedForm = sessionStorage.getItem("jobRequest");
    const storedPricing = sessionStorage.getItem("jobPricing");
    
    if (!storedForm) {
      toast.error("No job request data found");
      setLocation("/customer/request-service");
      return;
    }
    
    const parsedForm = JSON.parse(storedForm);
    setFormData(parsedForm);
    
    if (storedPricing) {
      setPricingEstimate(JSON.parse(storedPricing));
    }
  }, [setLocation]);

  const handleProceedToPayment = async () => {
    if (!formData) return;

    // For now, create the job directly (payment integration will come next)
    setIsSubmitting(true);
    try {
      // Generate unique job token
      const jobToken = `JOB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Use pricing estimate if available, otherwise calculate basic price
      let calculatedPriceCents = 0;
      let isOutOfHours = formData.isOutOfHours || false;
      let oohPremiumPercent = formData.oohPremiumPercent || 0;
      let remoteSiteFeeCents = 0;

      if (pricingEstimate?.estimatedPriceCents) {
        calculatedPriceCents = pricingEstimate.estimatedPriceCents;
        if (pricingEstimate.breakdown?.isOOH) {
          isOutOfHours = true;
          oohPremiumPercent = pricingEstimate.breakdown.oohSurchargePercent;
        }
        if (pricingEstimate.remoteSiteFee?.customerFeeCents) {
          remoteSiteFeeCents = pricingEstimate.remoteSiteFee.customerFeeCents;
        }
      } else {
        // Fallback calculation (should rarely happen)
        const baseRate = 100; // $100/hour
        const durationHours = parseInt(formData.estimatedDuration) / 60;
        calculatedPriceCents = Math.round(baseRate * durationHours * 100);
      }

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
        calculatedPrice: calculatedPriceCents,
        currency: "USD",
        isOutOfHours,
      });

      // Clear session storage
      sessionStorage.removeItem("jobRequest");
      sessionStorage.removeItem("jobPricing");

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

  // Calculate display values
  const durationHours = parseInt(formData.estimatedDuration) / 60;
  const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
  
  // Service level display
  const serviceLevelLabels = {
    same_day: "Same Business Day",
    next_day: "Next Business Day",
    scheduled: "Scheduled"
  };

  return (
    <CustomerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review & Confirm</h1>
          <p className="text-muted-foreground">
            Please review all details carefully before proceeding to payment
          </p>
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p>{formData.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{formData.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p>{formData.customerPhone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p>{formData.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Level</p>
                <div className="flex items-center gap-2">
                  <p>{serviceLevelLabels[formData.serviceLevel as keyof typeof serviceLevelLabels] || formData.serviceLevel}</p>
                  {formData.serviceLevel === "same_day" && (
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  )}
                  {formData.serviceLevel === "next_day" && (
                    <Badge variant="default" className="text-xs">Priority</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p>{durationHours} hours ({formData.estimatedDuration} minutes)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking Type</p>
                <p className="capitalize">{formData.bookingType || "hourly"}</p>
              </div>
            </div>
            {formData.downTime && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Urgent - Causing Downtime</strong>
                </AlertDescription>
              </Alert>
            )}
            {formData.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{formData.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Location & Schedule */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Site Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.siteName && (
                <div>
                  <p className="text-sm text-muted-foreground">Site Name</p>
                  <p>{formData.siteName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm">{formData.address}</p>
                <p className="text-sm">
                  {formData.city}{formData.siteState && `, ${formData.siteState}`}
                </p>
                <p className="text-sm">{formData.country} {formData.postalCode}</p>
              </div>
              {formData.timezone && (
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p className="text-sm">{formData.timezone}</p>
                </div>
              )}
              <Separator />
              {(formData.siteContactName || formData.siteContactNumber) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">On-Site Contact</p>
                  {formData.siteContactName && <p className="text-sm">{formData.siteContactName}</p>}
                  {formData.siteContactNumber && (
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formData.siteContactNumber}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date</p>
                <p>
                  {scheduledDateTime.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Time</p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {scheduledDateTime.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {formData.isOutOfHours && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>Out-of-Hours Service</strong>
                    {formData.oohReason && (
                      <p className="text-xs mt-1">{formData.oohReason}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Site Access & Requirements */}
        {(formData.accessInstructions || formData.specialRequirements || formData.equipmentNeeded) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Site Access & Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.accessInstructions && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Access Instructions</p>
                  <p className="text-sm whitespace-pre-wrap">{formData.accessInstructions}</p>
                </div>
              )}
              {formData.specialRequirements && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Special Requirements</p>
                  <p className="text-sm whitespace-pre-wrap">{formData.specialRequirements}</p>
                </div>
              )}
              {formData.equipmentNeeded && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Equipment Needed</p>
                  <p className="text-sm whitespace-pre-wrap">{formData.equipmentNeeded}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Project/Ticket Information */}
        {(formData.projectName || formData.changeNumber || formData.incidentNumber) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project & Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-3">
                {formData.projectName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Project Name</p>
                    <p>{formData.projectName}</p>
                  </div>
                )}
                {formData.changeNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Change Number</p>
                    <p>{formData.changeNumber}</p>
                  </div>
                )}
                {formData.incidentNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Incident Number</p>
                    <p>{formData.incidentNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Communication & Notes */}
        {(formData.videoConferenceLink || formData.notes) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Communication & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.videoConferenceLink && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Video Conference Link</p>
                  <a 
                    href={formData.videoConferenceLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {formData.videoConferenceLink}
                  </a>
                </div>
              )}
              {formData.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Additional Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{formData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing Breakdown */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing Breakdown
            </CardTitle>
            <CardDescription>
              {pricingEstimate?.available 
                ? `Based on ${pricingEstimate.supplierCount} available supplier${pricingEstimate.supplierCount !== 1 ? 's' : ''}`
                : "Estimated pricing"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pricingEstimate?.available ? (
              <>
                {/* Base Service Cost */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{durationHours} hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base hourly rate range</span>
                    <span>
                      ${(pricingEstimate.breakdown.minBaseCents / 100 / durationHours).toFixed(2)} - ${(pricingEstimate.breakdown.maxBaseCents / 100 / durationHours).toFixed(2)}/hour
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base service cost</span>
                    <span>
                      ${(pricingEstimate.breakdown.minBaseCents / 100).toFixed(2)} - ${(pricingEstimate.breakdown.maxBaseCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* OOH Surcharge */}
                {pricingEstimate.breakdown?.isOOH && pricingEstimate.breakdown.avgOOHSurchargeCents > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">Out-of-Hours Surcharge ({pricingEstimate.breakdown.oohSurchargePercent}%)</span>
                          {pricingEstimate.breakdown.oohHours !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {pricingEstimate.breakdown.oohHours} of {pricingEstimate.breakdown.durationHours} hours
                            </span>
                          )}
                        </div>
                        <span className="text-amber-600">
                          +${(pricingEstimate.breakdown.minOOHSurchargeCents / 100).toFixed(2)} - ${(pricingEstimate.breakdown.maxOOHSurchargeCents / 100).toFixed(2)}
                        </span>
                      </div>
                      {formData.oohReason && (
                        <p className="text-xs text-muted-foreground">{formData.oohReason}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Remote Site Fee */}
                {pricingEstimate.remoteSiteFee && pricingEstimate.remoteSiteFee.customerFeeCents > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remote Site Fee</span>
                        <span>+${(pricingEstimate.remoteSiteFee.customerFeeCents / 100).toFixed(2)}</span>
                      </div>
                      {pricingEstimate.remoteSiteFee.distanceKm && (
                        <p className="text-xs text-muted-foreground">
                          {pricingEstimate.remoteSiteFee.distanceKm.toFixed(1)} km from metropolitan coverage area
                        </p>
                      )}
                    </div>
                  </>
                )}



                {/* Total */}
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Estimated Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ${(pricingEstimate.estimatedPriceCents / 100).toFixed(2)}
                    </div>
                    {pricingEstimate.minPriceCents !== pricingEstimate.maxPriceCents && (
                      <p className="text-xs text-muted-foreground">
                        Range: ${(pricingEstimate.minPriceCents / 100).toFixed(2)} - ${(pricingEstimate.maxPriceCents / 100).toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Payment after service completion</p>
                  </div>
                </div>
                
                {/* Pricing Transparency Note */}
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">💡 Transparent Pricing</p>
                  <p>All fees shown above. No hidden charges. Final price confirmed after supplier assignment.</p>
                </div>
              </>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {pricingEstimate?.message || "Pricing information unavailable. Our team will contact you with a quote."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between pb-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/customer/request-service")}
            disabled={isSubmitting}
          >
            Back to Edit
          </Button>
          <Button
            onClick={handleProceedToPayment}
            disabled={isSubmitting}
            size="lg"
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
              </>
            )}
          </Button>
        </div>
      </div>
    </CustomerLayout>
  );
}
