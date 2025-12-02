import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, CheckCircle2, Navigation, XCircle, Radio, User, Mail, Phone as PhoneIcon, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { SiteVisitReportForm } from "@/components/SiteVisitReportForm";
import { JobDetailCards } from "@/components/JobDetailCards";

export default function EngineerJobPage() {
  const [, params] = useRoute<{ token: string }>("/engineer/job/:token");
  const token = params?.token;
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [engineerName, setEngineerName] = useState("");
  const [engineerEmail, setEngineerEmail] = useState("");
  const [engineerPhone, setEngineerPhone] = useState("");

  const { data: job, isLoading, refetch } = trpc.jobs.getByEngineerToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const claimJobMutation = trpc.jobs.claimJob.useMutation({
    onSuccess: () => {
      toast.success("Job claimed successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to claim job: ${error.message}`);
    },
  });

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

  // Show claim form if job exists but no engineer details yet
  if (!job.engineerName && !job.engineerEmail && job.status === 'supplier_accepted') {
    return (
      <div className="min-h-screen bg-background">
        {/* Orbidut Header */}
        <header className="border-b bg-card">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Orbidut</span>
            </Link>
            <div className="text-sm text-muted-foreground">
              Engineer Job Assignment
            </div>
          </div>
        </header>

        <div className="container py-8 space-y-6">
          {/* Job Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{job.serviceType}</h1>
              <p className="text-muted-foreground">Job #{job.id}</p>
            </div>
            <Badge className="bg-amber-100 text-amber-800">Awaiting Claim</Badge>
          </div>

          {/* Complete Job Details */}
          <JobDetailCards job={job} viewerType="customer" />

          {/* Claim Form */}
          <Card>
            <CardHeader>
              <CardTitle>Claim This Job</CardTitle>
              <CardDescription>
                Enter your details to accept this job assignment. You'll receive confirmation via email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={engineerName}
                      onChange={(e) => setEngineerName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Your Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={engineerEmail}
                      onChange={(e) => setEngineerEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Your Phone (Optional)</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={engineerPhone}
                    onChange={(e) => setEngineerPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              
              <Button
                onClick={() => {
                  if (!engineerName || !engineerEmail) {
                    toast.error("Please fill in all required fields");
                    return;
                  }
                  claimJobMutation.mutate({
                    token: token || "",
                    engineerName,
                    engineerEmail,
                    engineerPhone,
                  });
                }}
                className="w-full"
                size="lg"
                disabled={claimJobMutation.isPending}
              >
                {claimJobMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming Job...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Claim Job</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
                  <span>{job.scheduledDateTime ? new Date(job.scheduledDateTime).toLocaleString() : "Not scheduled"}</span>
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
              
              {(job.status === "sent_to_engineer" || job.status === "assigned_to_supplier") && (
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

              {job.status === "on_site" && !showReportForm && (
                <Button onClick={() => setShowReportForm(true)} className="w-full">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Job & Submit Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {showReportForm && job.status === "on_site" && (
          <div className="mt-6">
            <SiteVisitReportForm
              jobToken={token || ""}
              onSuccess={() => {
                setShowReportForm(false);
                handleStatusUpdate("completed");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
