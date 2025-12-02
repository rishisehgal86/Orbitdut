import { useAuth } from "@/_core/hooks/useAuth";
import CustomerLayout from "@/components/CustomerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, CheckCircle, Clock, DollarSign, FileText, MapPin, User } from "lucide-react";
import { Link, useParams } from "wouter";
import { JobTimeline } from "@/components/JobTimeline";
import { EngineerLocationMap } from "@/components/EngineerLocationMap";

// Database status values
type JobStatus = 
  | "pending_supplier_acceptance" 
  | "supplier_accepted"
  | "sent_to_engineer"
  | "engineer_accepted"
  | "assigned_to_supplier" 
  | "accepted" 
  | "declined" 
  | "en_route" 
  | "on_site" 
  | "completed" 
  | "cancelled";

const statusColors: Record<JobStatus, string> = {
  pending_supplier_acceptance: "bg-yellow-500",
  supplier_accepted: "bg-green-500",
  sent_to_engineer: "bg-blue-500",
  engineer_accepted: "bg-green-500",
  assigned_to_supplier: "bg-blue-500",
  accepted: "bg-green-500",
  declined: "bg-red-500",
  en_route: "bg-purple-500",
  on_site: "bg-orange-500",
  completed: "bg-green-600",
  cancelled: "bg-gray-500",
};

// User-friendly labels
const statusLabels: Record<JobStatus, string> = {
  pending_supplier_acceptance: "Awaiting Supplier",
  supplier_accepted: "Supplier Accepted",
  sent_to_engineer: "Sent to Engineer",
  engineer_accepted: "Engineer Accepted",
  assigned_to_supplier: "Supplier Assigned",
  accepted: "Accepted",
  declined: "Declined",
  en_route: "Engineer En Route",
  on_site: "Engineer On Site",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

        {/* Job Timeline */}
        <JobTimelineWrapper jobId={job.id} currentStatus={job.status} />

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
                    {job.scheduledDateTime ? new Date(job.scheduledDateTime).toLocaleString() : "Not scheduled"}
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
                  <p className="text-sm text-muted-foreground">{job.estimatedDuration ?? 0} hours</p>
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
                    <p className="text-sm font-medium">{job.siteAddress}</p>
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
                    {job.currency ?? "USD"} {(((job.calculatedPrice ?? 0) / 100) / (job.estimatedDuration ?? 1)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{job.estimatedDuration ?? 0} hours</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Total Price</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {job.currency} {(job.calculatedPrice ?? 0 / 100).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Site Contact */}
          {(job.siteContactName || job.siteContactNumber) && (
            <Card>
              <CardHeader>
                <CardTitle>Site Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.siteContactName && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Contact Name</p>
                      <p className="text-sm text-muted-foreground">{job.siteContactName}</p>
                    </div>
                  </div>
                )}
                {job.siteContactNumber && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Contact Number</p>
                      <p className="text-sm text-muted-foreground">{job.siteContactNumber}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Project & Ticket Information */}
          {(job.projectName || job.changeNumber || job.incidentNumber) && (
            <Card>
              <CardHeader>
                <CardTitle>Project & Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.projectName && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Project Name</p>
                      <p className="text-sm text-muted-foreground">{job.projectName}</p>
                    </div>
                  </div>
                )}
                {job.changeNumber && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Change Number</p>
                      <p className="text-sm text-muted-foreground">{job.changeNumber}</p>
                    </div>
                  </div>
                )}
                {job.incidentNumber && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Incident Number</p>
                      <p className="text-sm text-muted-foreground">{job.incidentNumber}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Site Access & Requirements */}
        {(job.accessInstructions || job.specialRequirements || job.equipmentNeeded) && (
          <Card>
            <CardHeader>
              <CardTitle>Site Access & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.accessInstructions && (
                <div>
                  <p className="font-medium mb-1">Access Instructions</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.accessInstructions}</p>
                </div>
              )}
              {job.specialRequirements && (
                <div>
                  <p className="font-medium mb-1">Special Requirements</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.specialRequirements}</p>
                </div>
              )}
              {job.equipmentNeeded && (
                <div>
                  <p className="font-medium mb-1">Equipment Needed</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.equipmentNeeded}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Communication */}
        {(job.videoConferenceLink || job.notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.videoConferenceLink && (
                <div>
                  <p className="font-medium mb-1">Video Conference Link</p>
                  <a
                    href={job.videoConferenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {job.videoConferenceLink}
                  </a>
                </div>
              )}
              {job.notes && (
                <div>
                  <p className="font-medium mb-1">Additional Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

        {/* Engineer Location Tracking */}
        {(job.status === "en_route" || job.status === "on_site") && (
          <EngineerLocationMap jobId={job.id} />
        )}

        {/* Job Timeline */}
        <JobTimelineWrapper jobId={job.id} currentStatus={job.status} />

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
