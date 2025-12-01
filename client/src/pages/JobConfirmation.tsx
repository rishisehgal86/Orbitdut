import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react";
import { Link, useRoute } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  pending_supplier_acceptance: "Finding a supplier...",
  assigned_to_supplier: "Supplier assigned",
  en_route: "Supplier is on the way",
  on_site: "Supplier is on site",
  completed: "Service completed",
  cancelled: "Cancelled",
};

export default function JobConfirmation() {
  const [, params] = useRoute("/job-confirmation/:id");
  const jobId = params?.id ? parseInt(params.id) : 0;

  const { data: job, isLoading } = trpc.jobs.getById.useQuery(
    { id: jobId },
    { enabled: jobId > 0, refetchInterval: 5000 } // Poll every 5 seconds
  );

  const formatCurrency = (cents: number, currency: string) => {
    const symbol = currency === "USD" ? "$" : currency;
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
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
              <CardTitle>Job Not Found</CardTitle>
              <CardDescription>
                The requested job could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
            {/* Success Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Request Submitted!</h1>
                <p className="text-muted-foreground">Job #{job.id}</p>
              </div>
            </div>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>We'll update you as your job progresses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {job.status === "completed" ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{STATUS_LABELS[job.status]}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.status === "pending_supplier_acceptance" &&
                        "We're matching you with the best available supplier"}
                      {job.status === "assigned_to_supplier" &&
                        "Your supplier will contact you shortly"}
                      {job.status === "en_route" &&
                        "Your supplier is heading to your location"}
                      {job.status === "on_site" &&
                        "Your supplier is working on your service request"}
                      {job.status === "completed" &&
                        "Thank you for using Orbidut!"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{job.serviceType}</p>
                    {job.description && (
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Service Location</p>
                    <p className="text-sm text-muted-foreground">{job.siteAddress}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.city}, {job.postalCode}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Scheduled Time</p>
                    <p className="text-sm text-muted-foreground">
                      {job.scheduledDateTime ? formatDate(job.scheduledDateTime) : "Not scheduled"} at {job.scheduledDateTime ? formatTime(job.scheduledDateTime) : ""}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Estimated Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {job.estimatedDuration} minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>
                  Your payment method has been authorized
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(job.calculatedPrice ?? 0, job.currency ?? "USD")}
                  </span>
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Payment Authorization</p>
                  <p>
                    Your payment method has been authorized for this amount. You will only
                    be charged after the service is completed.
                  </p>
                </div>

                {job.status === "completed" && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 text-sm text-green-900 dark:text-green-200">
                    <p className="font-medium mb-1">Payment Processed</p>
                    <p>
                      Your payment has been processed. A receipt has been sent to your
                      email address.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have any questions or concerns about your service request, please
                  contact us.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    Contact Support
                  </Button>
                  <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
