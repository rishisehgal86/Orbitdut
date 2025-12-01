import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Clock, CheckCircle2, Navigation, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function EngineerJobPage() {
  const [, params] = useRoute<{ token: string }>("/engineer/job/:token");
  const token = params?.token;

  const { data: job, isLoading, refetch } = trpc.jobs.getByEngineerToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const updateStatusMutation = trpc.jobs.updateStatusByToken.useMutation({
    onSuccess: () => {
      toast.success("Job status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const handleStatusUpdate = (status: "accepted" | "declined" | "en_route" | "on_site" | "completed") => {
    if (!token) return;
    updateStatusMutation.mutate({ token, status });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center">Job not found or link is invalid.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Job #{job.id}: {job.serviceType}</CardTitle>
            <CardDescription>{job.siteName} - {job.address}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Scheduled Time</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span>{new Date(job.scheduledStart).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Customer</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span>{job.customerName}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Job Status: <span className="font-normal text-primary">{job.status.replace(/_/g, ' ')}</span></h3>
              
              {job.status === "sent_to_engineer" && (
                <div className="flex gap-4">
                  <Button onClick={() => handleStatusUpdate("accepted")} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Accept Job
                  </Button>
                  <Button onClick={() => handleStatusUpdate("declined")} variant="destructive" className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" /> Decline Job
                  </Button>
                </div>
              )}

              {job.status === "accepted" && (
                <Button onClick={() => handleStatusUpdate("en_route")} className="w-full">
                  <Navigation className="mr-2 h-4 w-4" /> Start Travel (En Route)
                </Button>
              )}

              {job.status === "en_route" && (
                <Button onClick={() => handleStatusUpdate("on_site")} className="w-full">
                  <MapPin className="mr-2 h-4 w-4" /> Arrived at Site
                </Button>
              )}

              {job.status === "on_site" && (
                <Button onClick={() => handleStatusUpdate("completed")} className="w-full">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Job
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
