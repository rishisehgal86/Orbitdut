import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Building2, Calendar, CheckCircle, Clock, DollarSign, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function RequestServicePricing() {
  const [, setLocation] = useLocation();
  const [jobData, setJobData] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  
  const calculatePrice = trpc.jobs.calculatePrice.useMutation();
  const createJob = trpc.jobs.create.useMutation();

  useEffect(() => {
    // Get job data from session storage
    const data = sessionStorage.getItem("jobRequest");
    if (!data) {
      setLocation("/request-service");
      return;
    }

    const parsed = JSON.parse(data);
    setJobData(parsed);

    // Calculate pricing
    const scheduledStart = new Date(`${parsed.scheduledDate}T${parsed.scheduledTime}`);
    
    calculatePrice.mutate(
      {
        country: parsed.country,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        scheduledStart: scheduledStart.toISOString(),
        estimatedDuration: parseInt(parsed.estimatedDuration),
      },
      {
        onSuccess: (data) => {
          setPricing(data);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to calculate price");
        },
      }
    );
  }, []);

  const handleConfirm = async () => {
    if (!jobData || !pricing) return;

    const scheduledStart = new Date(`${jobData.scheduledDate}T${jobData.scheduledTime}`);

    try {
      const result = await createJob.mutateAsync({
        customerName: jobData.customerName,
        customerEmail: jobData.customerEmail,
        customerPhone: jobData.customerPhone,
        serviceType: jobData.serviceType,
        description: jobData.description || "",
        address: jobData.address,
        city: jobData.city,
        country: jobData.country,
        postalCode: jobData.postalCode,
        latitude: jobData.latitude,
        longitude: jobData.longitude,
        scheduledStart: scheduledStart.toISOString(),
        estimatedDuration: parseInt(jobData.estimatedDuration),
        calculatedPrice: pricing.totalPrice,
        currency: pricing.currency,
        isOutOfHours: pricing.isOutOfHours,
      });

      sessionStorage.removeItem("jobRequest");
      toast.success("Job request submitted successfully!");
      setLocation(`/job-confirmation/${result.jobId}`);
    } catch (error) {
      toast.error("Failed to submit job request");
      console.error(error);
    }
  };

  if (!jobData || calculatePrice.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (calculatePrice.isError || !pricing) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">Orbidut</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center bg-muted/30">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No Suppliers Available</CardTitle>
              <CardDescription>
                We couldn't find any suppliers for your location at this time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/request-service">
                <Button>Try Another Location</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return `${pricing.currency === "USD" ? "$" : pricing.currency} ${(cents / 100).toFixed(2)}`;
  };

  const scheduledDate = new Date(`${jobData.scheduledDate}T${jobData.scheduledTime}`);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Orbidut</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Review & Confirm</h1>
                <p className="text-muted-foreground">
                  Review your service request and pricing details
                </p>
              </div>
            </div>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{jobData.serviceType}</p>
                    {jobData.description && (
                      <p className="text-sm text-muted-foreground">{jobData.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Service Location</p>
                    <p className="text-sm text-muted-foreground">{jobData.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {jobData.city}, {jobData.postalCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Scheduled Time</p>
                    <p className="text-sm text-muted-foreground">
                      {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Estimated Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {pricing.durationHours} hour{pricing.durationHours !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Based on the lowest available supplier rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">{formatCurrency(pricing.hourlyRate)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Base Price ({pricing.durationHours}h)
                  </span>
                  <span className="font-medium">{formatCurrency(pricing.basePrice)}</span>
                </div>

                {pricing.isOutOfHours && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Out-of-Hours Surcharge (50%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(pricing.outOfHoursSurcharge)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(pricing.totalPrice)}
                  </span>
                </div>

                {pricing.isOutOfHours && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-200">
                    This service is scheduled outside normal business hours (Mon-Fri 8AM-6PM)
                    and includes a 50% surcharge.
                  </div>
                )}

                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Payment Authorization</p>
                  <p>
                    Your payment method will be authorized for this amount. You will only be
                    charged after the service is completed.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between gap-4">
              <Link href="/request-service">
                <Button variant="outline">Back to Edit</Button>
              </Link>
              <Button onClick={handleConfirm} disabled={createJob.isPending}>
                {createJob.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Authorize & Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
