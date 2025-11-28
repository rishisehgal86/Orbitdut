import { useAuth } from "@/_core/hooks/useAuth";
import CustomerLayout from "@/components/CustomerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, CheckCircle, Clock, DollarSign, FileText, MapPin, User } from "lucide-react";
import { Link, useParams } from "wouter";

type JobStatus = "pending" | "assigned" | "en_route" | "on_site" | "completed" | "cancelled";

const statusColors: Record<JobStatus, string> = {
  pending: "bg-yellow-500",
  assigned: "bg-blue-500",
  en_route: "bg-purple-500",
  on_site: "bg-orange-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-500",
};

const statusLabels: Record<JobStatus, string> = {
  pending: "Pending Assignment",
  assigned: "Assigned to Engineer",
  en_route: "Engineer En Route",
  on_site: "Engineer On Site",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusSteps: JobStatus[] = ["pending", "assigned", "en_route", "on_site", "completed"];

export default function CustomerJobDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });

  const { data: job, isLoading } = trpc.jobs.getById.useQuery(
    { id: parseInt(id || "0") },
    {
      enabled: !!user && !!id,
      refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    }
  );

  if (authLoading || isLoading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!job) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground mb-4">Job not found</p>
          <Link href="/customer/jobs">
            <Button>Back to Jobs</Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const currentStatusIndex = statusSteps.indexOf(job.status as JobStatus);

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/customer/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{job.serviceType}</h1>
            <p className="text-muted-foreground">Job #{job.id}</p>
          </div>
          <Badge className={statusColors[job.status as JobStatus]}>
            {statusLabels[job.status as JobStatus]}
          </Badge>
        </div>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Job Progress</CardTitle>
            <CardDescription>Track the status of your service request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Status Steps */}
              <div className="relative flex justify-between">
                {statusSteps.map((status, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <div key={status} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-background border-muted-foreground/30"
                        } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <p
                        className={`mt-2 text-xs text-center max-w-[80px] ${
                          isCompleted ? "font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {statusLabels[status].replace("Engineer ", "")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Service Type</p>
                  <p className="text-sm text-muted-foreground">{job.serviceType}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Scheduled Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job.scheduledStart).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Local time at service location
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Estimated Duration</p>
                  <p className="text-sm text-muted-foreground">{job.estimatedDuration} hours</p>
                </div>
              </div>
              {job.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Description</p>
                    <p className="text-sm text-muted-foreground">{job.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Location & Pricing */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{job.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.city}, {job.country}
                    </p>
                    {job.postalCode && (
                      <p className="text-sm text-muted-foreground">{job.postalCode}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="text-sm font-medium">
                    {job.currency} {((job.calculatedPrice / 100) / job.estimatedDuration).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{job.estimatedDuration} hours</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Total Price</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {job.currency} {(job.calculatedPrice / 100).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Engineer Information */}
        {job.assignedSupplierId && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Engineer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Engineer ID: {job.assignedSupplierId}</p>
                  <p className="text-sm text-muted-foreground">
                    Your engineer has been assigned and will contact you shortly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/customer/jobs">
            <Button variant="outline">Back to Jobs</Button>
          </Link>
          {job.status === "completed" && (
            <Button>Leave a Review</Button>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}
