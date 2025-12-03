import SupplierLayout from "@/components/SupplierLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Copy, Loader2, Phone, User } from "lucide-react";
import { useState } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";
import { AssignEngineerDialog } from "@/components/AssignEngineerDialog";
import { JobTimeline } from "@/components/JobTimeline";
import { JobStatusProgress } from "@/components/JobStatusProgress";
import { EngineerLocationMap } from "@/components/EngineerLocationMap";
import { JobDetailCards } from "@/components/JobDetailCards";

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

// Database status values
type JobStatus = 
  | "pending_supplier_acceptance" 
  | "supplier_accepted"
  | "sent_to_engineer"
  | "engineer_accepted"
  | "en_route" 
  | "on_site" 
  | "completed" 
  | "cancelled";

const statusColors: Record<JobStatus, string> = {
  pending_supplier_acceptance: "bg-amber-100 text-amber-800",
  supplier_accepted: "bg-green-100 text-green-800",
  sent_to_engineer: "bg-blue-100 text-blue-800",
  engineer_accepted: "bg-green-100 text-green-800",
  en_route: "bg-blue-100 text-blue-800",
  on_site: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<JobStatus, string> = {
  pending_supplier_acceptance: "Awaiting Supplier",
  supplier_accepted: "Supplier Accepted",
  sent_to_engineer: "Sent to Engineer",
  engineer_accepted: "Engineer Accepted",
  en_route: "En Route",
  on_site: "On Site",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function SupplierJobDetail() {
  const [, params] = useRoute("/supplier/jobs/:id");
  const jobId = params?.id ? parseInt(params.id) : 0;
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data: job, isLoading, refetch } = trpc.jobs.getById.useQuery(
    { id: jobId },
    { enabled: jobId > 0 }
  );

  const formatCurrency = (cents: number, currency: string) => {
    const symbol = currency === "USD" ? "$" : currency;
    return `${symbol}${(cents / 100).toFixed(2)}`;
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
            <Badge className={statusColors[job.status as JobStatus]}>
              {statusLabels[job.status as JobStatus]}
            </Badge>
            {job.isOutOfHours === 1 && (
              <Badge variant="secondary" className="block mt-1">
                Out of Hours
              </Badge>
            )}
          </div>
        </div>

        {/* Engineer Assignment Buttons (Supplier-specific) */}
        {!job.engineerName && job.status === "supplier_accepted" && (
          <Card>
            <CardHeader>
              <CardTitle>Assign Engineer</CardTitle>
              <CardDescription>Choose how to assign an engineer to this job</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={() => setAssignDialogOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Assign Engineer Manually
              </Button>
              <Button
                onClick={() => {
                  const link = job.shortCode 
                    ? `${window.location.origin}/e/${job.shortCode}`
                    : `${window.location.origin}/engineer/job/${job.engineerToken}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Engineer link copied to clipboard!");
                }}
                variant="outline"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Engineer Link (Self-Claim)
              </Button>
              {job.shortCode && (
                <p className="text-sm text-muted-foreground text-center">
                  Short link: <code className="bg-muted px-2 py-1 rounded">/e/{job.shortCode}</code>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Engineer Link Display (for all statuses after supplier_accepted) */}
        {job.status !== "pending_supplier_acceptance" && job.status !== "supplier_accepted" && job.shortCode && (
          <Card>
            <CardHeader>
              <CardTitle>Engineer Link</CardTitle>
              <CardDescription>Share this link with engineers</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  const link = `${window.location.origin}/e/${job.shortCode}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Engineer link copied to clipboard!");
                }}
                variant="outline"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Engineer Link
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Short link: <code className="bg-muted px-2 py-1 rounded">/e/{job.shortCode}</code>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Assign Engineer Dialog */}
        <AssignEngineerDialog
          jobId={jobId}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onSuccess={() => refetch()}
        />

        {/* Job Status Progress */}
        <JobStatusProgress currentStatus={job.status} />

        {/* Customer Information (Supplier-specific) */}
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

        {/* Shared Job Details */}
        <JobDetailCards job={job} viewerType="supplier" />

        {/* Engineer Information */}
        {job.engineerName && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Engineer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{job.engineerName}</p>
                  <p className="text-sm text-muted-foreground">{job.engineerEmail}</p>
                </div>
              </div>

              {job.engineerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <a
                      href={`tel:${job.engineerPhone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {job.engineerPhone}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Engineer Location Tracking */}
        {(job.status === "en_route" || job.status === "on_site") && (
          <EngineerLocationMap 
            jobId={job.id}
            engineerToken={job.engineerToken}
            jobStatus={job.status}
            siteLatitude={job.siteLatitude}
            siteLongitude={job.siteLongitude}
          />
        )}

        {/* Job Timeline - Audit Trail */}
        <JobTimelineWrapper jobId={job.id} currentStatus={job.status} />
      </div>
    </SupplierLayout>
  );
}
