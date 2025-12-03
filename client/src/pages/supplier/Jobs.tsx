import SupplierLayout from "@/components/SupplierLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Calendar, CheckCircle, Clock, DollarSign, Eye, Loader2, MapPin } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function SupplierJobs() {
  const { data: availableJobs, isLoading: loadingAvailable, refetch: refetchAvailable } =
    trpc.jobs.getAvailableForSupplier.useQuery();
  const { data: myJobs, isLoading: loadingMy, refetch: refetchMy } =
    trpc.jobs.getSupplierJobs.useQuery();
  const acceptJob = trpc.jobs.acceptJobAsSupplier.useMutation();

  const handleAcceptJob = async (jobId: number) => {
    try {
      await acceptJob.mutateAsync({ jobId });
      toast.success("Job accepted successfully!");
      refetchAvailable();
      refetchMy();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept job");
    }
  };

  const formatCurrency = (cents: number, currency: string) => {
    const symbol = currency === "USD" ? "$" : currency;
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending_supplier_acceptance: "outline",
      assigned_to_supplier: "default",
      en_route: "secondary",
      on_site: "secondary",
      completed: "default",
      cancelled: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            View available jobs and manage your accepted jobs
          </p>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">
              Available Jobs
              {availableJobs && availableJobs.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {availableJobs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-jobs">
              My Jobs
              {myJobs && myJobs.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {myJobs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {loadingAvailable ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableJobs && availableJobs.length > 0 ? (
              availableJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{job.serviceType}</CardTitle>
                        <CardDescription>Job #{job.id}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(job.calculatedPrice ?? 0, job.currency ?? "USD")}
                        </div>
                        {job.isOutOfHours === 1 && (
                          <Badge variant="secondary" className="mt-1">
                            Out of Hours
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.description && (
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    )}

                    <Separator />

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">{job.siteAddress}</p>
                          <p className="text-muted-foreground">
                            {job.city}, {job.postalCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">{job.scheduledDateTime ? formatDate(job.scheduledDateTime) : "Not scheduled"}</p>
                          <p className="text-muted-foreground">
                            {job.scheduledDateTime ? formatTime(job.scheduledDateTime) : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Duration</p>
                          <p className="text-muted-foreground">
                            {(() => {
                              const totalMinutes = job.estimatedDuration ?? 0;
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${hours}h ${minutes}m`;
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Payment</p>
                          <p className="text-muted-foreground">
                            Paid after completion
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Customer: {job.customerName}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/supplier/jobs/${job.id}`}>
                          <Button variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleAcceptJob(job.id)}
                          disabled={acceptJob.isPending}
                        >
                          {acceptJob.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept Job
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No available jobs at the moment
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check back later for new opportunities
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-jobs" className="space-y-4">
            {loadingMy ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myJobs && myJobs.length > 0 ? (
              myJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{job.serviceType}</CardTitle>
                        <CardDescription>Job #{job.id}</CardDescription>
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(job.status)}
                        <div className="text-lg font-bold">
                          {formatCurrency(job.calculatedPrice ?? 0, job.currency ?? "USD")}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.description && (
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    )}

                    <Separator />

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          {job.siteName && <p className="font-semibold">{job.siteName}</p>}
                          <p className="font-medium">{job.siteAddress}</p>
                          <p className="text-muted-foreground">
                            {job.city}, {job.postalCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">{job.scheduledDateTime ? formatDate(job.scheduledDateTime) : "Not scheduled"}</p>
                          <p className="text-muted-foreground">
                            {job.scheduledDateTime ? formatTime(job.scheduledDateTime) : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Duration</p>
                          <p className="text-muted-foreground">
                            {(() => {
                              const totalMinutes = job.estimatedDuration ?? 0;
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${hours}h ${minutes}m`;
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Payment</p>
                          <p className="text-muted-foreground">Paid after completion</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">{job.customerName}</p>
                        <p className="text-sm text-muted-foreground">{job.customerPhone}</p>
                      </div>
                      <Link href={`/supplier/jobs/${job.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">No accepted jobs yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accept jobs from the Available Jobs tab
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SupplierLayout>
  );
}
