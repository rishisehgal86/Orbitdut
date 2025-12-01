import SupplierLayout from "@/components/SupplierLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";
import { AssignEngineerDialog } from "@/components/AssignEngineerDialog";
import { JobTimeline } from "@/components/JobTimeline";
import { EngineerLocationMap } from "@/components/EngineerLocationMap";

const STATUS_FLOW = [
  { key: "assigned_to_supplier", label: "Assigned", icon: CheckCircle },
  { key: "en_route", label: "En Route", icon: Navigation },
  { key: "on_site", label: "On Site", icon: MapPin },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

// Wrapper component for JobTimeline with data fetching
function JobTimelineWrapper({ jobId, currentStatus }: { jobId: number; currentStatus: string }) {
  const { data: timeline, isLoading } = trpc.jobs.getJobTimeline.useQuery(
    { jobId },
    { refetchInterval: 10000 } // Refresh every 10 seconds
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline) return null;

  return <JobTimeline events={timeline.events} currentStatus={timeline.currentStatus} />;
}

export default function SupplierJobDetail() {
  const [, params] = useRoute("/supplier/jobs/:id");
  const jobId = params?.id ? parseInt(params.id) : 0;
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data: job, isLoading, refetch } = trpc.jobs.getById.useQuery(
    { id: jobId },
    { enabled: jobId > 0 }
  );
  const updateStatus = trpc.jobs.updateStatus.useMutation();

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        jobId,
        status: newStatus as any,
      });
      toast.success("Status updated successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

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

  const getCurrentStatusIndex = () => {
    if (!job) return -1;
    return STATUS_FLOW.findIndex((s) => s.key === job.status);
  };

  const getNextStatus = () => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  if (isLoading) {
    return (
      <SupplierLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SupplierLayout>
    );
  }

  if (!job) {
    return (
      <SupplierLayout>
        <Card>
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>The requested job could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </SupplierLayout>
    );
  }

  const nextStatus = getNextStatus();
  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <SupplierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{job.serviceType}</h1>
            <p className="text-muted-foreground">Job #{job.id}</p>
          </div>
          <div className="text-right space-y-2">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(job.calculatedPrice ?? 0, job.currency ?? "USD")}
            </div>
            {job.isOutOfHours === 1 && (
              <Badge variant="secondary" className="mt-1">
                Out of Hours
              </Badge>
            )}
            {!job.engineerName && job.status === "assigned_to_supplier" && (
              <Button onClick={() => setAssignDialogOpen(true)} size="sm">
                <User className="mr-2 h-4 w-4" />
                Assign Engineer
              </Button>
            )}
          </div>
        </div>

        {/* Assign Engineer Dialog */}
        <AssignEngineerDialog
          jobId={jobId}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onSuccess={() => refetch()}
        />

        {/* Status Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status</CardTitle>
            <CardDescription>Track the progress of this job</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(currentStatusIndex / (STATUS_FLOW.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Status Steps */}
              <div className="relative flex justify-between">
                {STATUS_FLOW.map((status, index) => {
                  const Icon = status.icon;
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <div key={status.key} className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted bg-background text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`mt-2 text-sm font-medium ${
                          isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {nextStatus && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => handleStatusUpdate(nextStatus.key)}
                  disabled={updateStatus.isPending}
                  size="lg"
                >
                  {updateStatus.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      Mark as {nextStatus.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{job.customerName}</p>
                  <p className="text-sm text-muted-foreground">{job.customerEmail}</p>
                </div>
              </div>

              {job.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <a
                      href={`tel:${job.customerPhone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {job.customerPhone}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Service Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{job.siteAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.city}, {job.postalCode}
                  </p>
                </div>
              </div>

              {job.siteLatitude && job.siteLongitude && (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${job.siteLatitude},${job.siteLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="mr-2 h-4 w-4" />
                    Get Directions
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{job.scheduledDateTime ? formatDate(job.scheduledDateTime) : "Not scheduled"}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.scheduledDateTime ? formatTime(job.scheduledDateTime) : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {job.estimatedDuration ?? 0} minutes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(job.calculatedPrice ?? 0, job.currency ?? "USD")}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>Payment will be processed after job completion.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {job.description && (
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{job.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Engineer Location Tracking */}
        {(job.status === "en_route" || job.status === "on_site") && (
          <EngineerLocationMap jobId={job.id} />
        )}

        {/* Job Timeline */}
        <JobTimelineWrapper jobId={job.id} currentStatus={job.status} />
      </div>
    </SupplierLayout>
  );
}
