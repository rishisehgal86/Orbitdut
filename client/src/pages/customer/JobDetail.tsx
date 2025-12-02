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
import { JobDetailCards } from "@/components/JobDetailCards";

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

        {/* Shared Job Details */}
        <JobDetailCards job={job} viewerType="customer" />

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
