import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, CheckCircle2, Navigation, XCircle, Radio } from "lucide-react";
import { toast } from "sonner";

export default function EngineerJobPage() {
  const [, params] = useRoute<{ token: string }>("/engineer/job/:token");
  const token = params?.token;
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

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

  const addLocationMutation = trpc.jobs.addLocationByToken.useMutation({
    onError: (error) => {
      console.error("Failed to save location:", error);
    },
  });

  // Capture current location once (for milestones)
  const captureCurrentLocation = (milestone: string) => {
    if (!navigator.geolocation || !token) {
      console.warn("Geolocation not supported or no token");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        addLocationMutation.mutate({
          token,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          accuracy: position.coords.accuracy.toString(),
          trackingType: "milestone",
        });
        console.log(`Location captured for: ${milestone}`);
      },
      (error) => {
        console.error("Failed to capture location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Start continuous GPS tracking
  const startTracking = (trackingType: "en_route" | "on_site") => {
    if (!navigator.geolocation || !token) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        addLocationMutation.mutate({
          token,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          accuracy: position.coords.accuracy.toString(),
          trackingType,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success("GPS tracking started");
  };

  // Stop GPS tracking
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      toast.info("GPS tracking stopped");
    }
  };

  const handleStatusUpdate = (status: "accepted" | "declined" | "en_route" | "on_site" | "completed") => {
    if (!token) return;

    // Capture location at milestone
    if (status === "accepted") {
      captureCurrentLocation("Job accepted");
    } else if (status === "en_route") {
      captureCurrentLocation("En route to site");
      // Start continuous tracking when en route
      setTimeout(() => startTracking("en_route"), 1000);
    } else if (status === "on_site") {
      captureCurrentLocation("Arrived on site");
      // Stop en_route tracking, start on_site tracking
      stopTracking();
      setTimeout(() => startTracking("on_site"), 1000);
    } else if (status === "completed") {
      captureCurrentLocation("Job completed");
      stopTracking();
    }

    updateStatusMutation.mutate({ token, status });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Job #{job.id}: {job.serviceType}</CardTitle>
                <CardDescription>{job.siteName} - {job.siteAddress}</CardDescription>
              </div>
              {isTracking && (
                <Badge variant="default" className="flex items-center gap-2">
                  <Radio className="h-3 w-3 animate-pulse" />
                  Tracking
                </Badge>
              )}
            </div>
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
              <h3 className="font-semibold">Job Status: <span className="font-normal text-primary">{job.status.replace(/_/g, ' ').toUpperCase()}</span></h3>
              
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
}
