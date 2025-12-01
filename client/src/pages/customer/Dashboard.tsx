import CustomerLayout from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle, Clock, Loader2, Plus } from "lucide-react";
import { Link } from "wouter";

export default function CustomerDashboard() {
  const { data: jobs, isLoading } = trpc.jobs.getCustomerJobs.useQuery();

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending_supplier_acceptance: "Finding Supplier",
      assigned_to_supplier: "Assigned",
      en_route: "En Route",
      on_site: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const formatCurrency = (cents: number, currency: string) => {
    const symbol = currency === "USD" ? "$" : currency;
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const recentJobs = jobs?.slice(0, 5) || [];
  const activeJobs = jobs?.filter(
    (j) => !["completed", "cancelled"].includes(j.status)
  ) || [];

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your service requests.
            </p>
          </div>
          <Link href="/customer/request-service">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Request Service
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                All time service requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs?.filter((j) => j.status === "completed").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Service Requests</CardTitle>
                <CardDescription>
                  Your latest service requests and their status
                </CardDescription>
              </div>
              <Link href="/customer/jobs">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <Link key={job.id} href={`/job-confirmation/${job.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div className="space-y-1">
                        <p className="font-medium">{job.serviceType}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.siteAddress} • {job.scheduledDateTime ? formatDate(job.scheduledDateTime) : "Not scheduled"}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-semibold">
                          {formatCurrency(job.calculatedPrice ?? 0, job.currency ?? "USD")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getStatusBadge(job.status)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No service requests yet
                </p>
                <Link href="/customer/request-service">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Request Your First Service
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Link href="/customer/request-service">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Request New Service
                </Button>
              </Link>
              <Link href="/customer/jobs">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  View All Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
}
