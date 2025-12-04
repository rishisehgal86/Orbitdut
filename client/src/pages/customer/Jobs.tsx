import { useAuth } from "@/_core/hooks/useAuth";
import CustomerLayout from "@/components/CustomerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, DollarSign, MapPin, Search, User } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

// Database status values
type JobStatus = 
  | "pending_supplier_acceptance" 
  | "assigned_to_supplier" 
  | "accepted" 
  | "declined" 
  | "en_route" 
  | "on_site" 
  | "completed" 
  | "cancelled";

const statusColors: Record<JobStatus, string> = {
  pending_supplier_acceptance: "bg-yellow-500",
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
  assigned_to_supplier: "Supplier Assigned",
  accepted: "Accepted",
  declined: "Declined",
  en_route: "Engineer En Route",
  on_site: "Engineer On Site",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function CustomerJobs() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: jobs, isLoading } = trpc.jobs.getCustomerJobs.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  if (authLoading || isLoading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your jobs...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  // Filter jobs based on status and search query
  const filteredJobs = jobs?.filter((job: any) => {
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      job.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.siteAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage all your service requests
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by service type or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_supplier_acceptance">Awaiting Supplier</SelectItem>
              <SelectItem value="assigned_to_supplier">Supplier Assigned</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="en_route">En Route</SelectItem>
              <SelectItem value="on_site">On Site</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Jobs</CardDescription>
              <CardTitle className="text-3xl">{jobs?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Awaiting Supplier</CardDescription>
              <CardTitle className="text-3xl">
                {jobs?.filter((j: any) => j.status === "pending_supplier_acceptance").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl">
                {jobs?.filter((j: any) => ["assigned_to_supplier", "accepted", "en_route", "on_site"].includes(j.status)).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">
                {jobs?.filter((j: any) => j.status === "completed").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "No jobs match your filters"
                  : "You haven't requested any services yet"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Link href="/customer/request-service">
                  <Button>Request a Service</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{job.serviceType}</CardTitle>
                      <CardDescription>Job #{job.id}</CardDescription>
                    </div>
                    <Badge className={statusColors[job.status as JobStatus]}>
                      {statusLabels[job.status as JobStatus]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">{job.siteAddress}</p>
                        <p className="text-muted-foreground">
                          {job.city}, {job.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">
                          {new Date(job.scheduledDateTime).toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground">
                          {new Date(job.scheduledDateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Duration</p>
                        <p className="text-muted-foreground">{job.estimatedDuration} hours</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Total Price</p>
                        <p className="text-muted-foreground">
                          {job.currency} {(job.calculatedPrice / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {job.assignedSupplierId && (
                    <div className="flex items-start gap-2 pt-2 border-t">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Assigned Engineer</p>
                        <p className="text-muted-foreground">Supplier ID: {job.assignedSupplierId}</p>
                      </div>
                    </div>
                  )}

                  {job.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/customer/jobs/${job.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
