import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, CheckCircle2, Navigation, XCircle, Radio, User, Mail, Phone as PhoneIcon, Briefcase, Pause, Play } from "lucide-react";
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

  const { data: job, isLoading, error, refetch } = trpc.jobs.getByEngineerToken.useQuery(
    { token: token || "" },
    { 
      enabled: !!token,
      retry: false // Don't retry on error
    }
  );

  const { data: pauseStatus, refetch: refetchPauseStatus } = trpc.jobs.getPauseStatus.useQuery(
    { token: token || "" },
    { enabled: !!token && job?.status === 'on_site' }
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

  const acceptJobMutation = trpc.jobs.acceptJob.useMutation({
    onSuccess: () => {
      toast.success("Job accepted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to accept job: ${error.message}`);
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

  const pauseWorkMutation = trpc.jobs.pauseWork.useMutation({
    onSuccess: () => {
      toast.success("Work paused");
      refetchPauseStatus();
    },
    onError: (error) => {
      toast.error(`Failed to pause: ${error.message}`);
    },
  });

  const resumeWorkMutation = trpc.jobs.resumeWork.useMutation({
    onSuccess: () => {
      toast.success("Work resumed");
      refetchPauseStatus();
    },
    onError: (error) => {
      toast.error(`Failed to resume: ${error.message}`);
    },
  });

  // Note: GPS capture is now handled inline in handleStatusUpdate, pause, and resume handlers

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

    // Update status immediately for instant response
    updateStatusMutation.mutate({ token, status });

    // Capture GPS in background (non-blocking)
    const captureGPSInBackground = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Save GPS location in background
          addLocationMutation.mutate({
            token,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            accuracy: position.coords.accuracy.toString(),
            trackingType: "milestone",
          });
        },
        (error) => {
          console.error("Background GPS capture failed:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 1000,
          maximumAge: 0,
        }
      );
    };

    // Handle different status transitions
    if (status === "accepted" || status === "declined") {
      captureGPSInBackground();
    } else if (status === "en_route") {
      captureGPSInBackground();
      // Start continuous tracking when en route
      setTimeout(() => startTracking("en_route"), 500);
    } else if (status === "on_site") {
      // Stop en_route tracking first
      stopTracking();
      captureGPSInBackground();
      // Start on_site tracking
      setTimeout(() => startTracking("on_site"), 500);
    } else if (status === "completed") {
      stopTracking();
      captureGPSInBackground();
    }
  };

  // Pre-fill engineer details when manually assigned
  useEffect(() => {
    if (job && job.status === 'sent_to_engineer') {
      setEngineerName(job.engineerName || "");
      setEngineerEmail(job.engineerEmail || "");
      setEngineerPhone(job.engineerPhone || "");
    }
  }, [job]);

  // Auto-start GPS tracking when page loads if job is en_route or on_site
  useEffect(() => {
    if (!job || !token || isTracking) return;

    if (job.status === 'en_route') {
      console.log('Auto-starting GPS tracking: en_route');
      startTracking('en_route');
    } else if (job.status === 'on_site') {
      console.log('Auto-starting GPS tracking: on_site');
      startTracking('on_site');
    }
  }, [job?.status, token]);

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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Invalid Link</h2>
          <p className="text-muted-foreground">The engineer job link is missing or invalid.</p>
        </div>
      </div>
    );
  }

  if (!job && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Job Not Available</h2>
          <p className="text-muted-foreground">
            This job link is not yet active. The supplier needs to accept the job first before you can claim it.
          </p>
        </div>
      </div>
    );
  }

  // Type guard: ensure job is defined
  if (!job) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Show claim/accept form if job hasn't been accepted by engineer yet
  if (job.status === 'supplier_accepted' || job.status === 'sent_to_engineer') {
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
            <Badge className="bg-amber-100 text-amber-800">
              {job.status === 'sent_to_engineer' ? 'Awaiting Acceptance' : 'Awaiting Claim'}
            </Badge>
          </div>

          {/* Claim/Accept Form - Moved to top */}
          <Card>
            <CardHeader>
              <CardTitle>{job.status === 'sent_to_engineer' ? 'Accept This Job' : 'Claim This Job'}</CardTitle>
              <CardDescription>
                {job.status === 'sent_to_engineer' 
                  ? 'Review and confirm your details to accept this job assignment. You can update your information before accepting.'
                  : 'Enter your details to accept this job assignment. You\'ll receive confirmation via email.'}
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
                  const mutation = job.status === 'sent_to_engineer' ? acceptJobMutation : claimJobMutation;
                  mutation.mutate({
                    token: token || "",
                    engineerName,
                    engineerEmail,
                    engineerPhone,
                  });
                }}
                className="w-full"
                size="lg"
                disabled={claimJobMutation.isPending || acceptJobMutation.isPending}
              >
                {(claimJobMutation.isPending || acceptJobMutation.isPending) ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {job.status === 'sent_to_engineer' ? 'Accepting...' : 'Claiming...'}</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> {job.status === 'sent_to_engineer' ? 'Accept Job' : 'Claim Job'}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Complete Job Details - No pricing for engineers */}
          <JobDetailCards job={job} viewerType="customer" showPricing={false} />
        </div>
      </div>
    );
  }

  // After claim, show job management interface
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
            Engineer Job Management
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
          <Badge className="bg-green-100 text-green-800">
            {job.status === 'engineer_accepted' && 'Accepted'}
            {job.status === 'en_route' && 'En Route'}
            {job.status === 'on_site' && 'On Site'}
            {job.status === 'completed' && 'Completed'}
          </Badge>
        </div>

        {/* Status Update Buttons */}
        {job.status !== 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle>Update Job Status</CardTitle>
              <CardDescription>Update your current status to keep the customer informed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {job.status === 'engineer_accepted' && (
                  <Button
                    onClick={() => {
                      captureCurrentLocation('en_route');
                      updateStatusMutation.mutate({ token: token || "", status: 'en_route' });
                      startTracking('en_route');
                    }}
                    disabled={updateStatusMutation.isPending}
                    size="lg"
                  >
                    {updateStatusMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                    ) : (
                      <><Navigation className="mr-2 h-4 w-4" /> I'm En Route</>
                    )}
                  </Button>
                )}

                {job.status === 'en_route' && (
                  <Button
                    onClick={() => {
                      captureCurrentLocation('on_site');
                      updateStatusMutation.mutate({ token: token || "", status: 'on_site' });
                      startTracking('on_site');
                    }}
                    disabled={updateStatusMutation.isPending}
                    size="lg"
                  >
                    {updateStatusMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                    ) : (
                      <><Radio className="mr-2 h-4 w-4" /> I've Arrived On Site</>
                    )}
                  </Button>
                )}

                {job.status === 'on_site' && (
                  <>
                    <div className="flex flex-col gap-3">
                      {pauseStatus?.isPaused && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <Pause className="h-4 w-4" />
                            <span className="font-medium">Work is paused</span>
                            <span className="text-sm ml-auto">Paused at {pauseStatus.pausedAt ? new Date(pauseStatus.pausedAt).toLocaleTimeString() : ''}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                      {pauseStatus?.isPaused ? (
                        <Button
                          onClick={() => {
                            if (!token) return;
                            
                            // Trigger resume immediately for instant response
                            resumeWorkMutation.mutate({ token });
                            
                            // Capture GPS in background
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  // Update with GPS coordinates in background
                                  addLocationMutation.mutate({
                                    token,
                                    latitude: position.coords.latitude.toString(),
                                    longitude: position.coords.longitude.toString(),
                                    accuracy: position.coords.accuracy.toString(),
                                    trackingType: "milestone",
                                  });
                                },
                                (error) => console.error("Background GPS failed:", error),
                                { enableHighAccuracy: true, timeout: 1000, maximumAge: 0 }
                              );
                            }
                          }}
                          variant="outline"
                          size="lg"
                          className="flex-1"
                        >
                          {resumeWorkMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resuming...</>
                          ) : (
                            <><Play className="mr-2 h-4 w-4" /> Resume Work</>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            if (!token) return;
                            
                            // Trigger pause immediately for instant response
                            pauseWorkMutation.mutate({ token });
                            
                            // Capture GPS in background
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  // Update with GPS coordinates in background
                                  addLocationMutation.mutate({
                                    token,
                                    latitude: position.coords.latitude.toString(),
                                    longitude: position.coords.longitude.toString(),
                                    accuracy: position.coords.accuracy.toString(),
                                    trackingType: "milestone",
                                  });
                                },
                                (error) => console.error("Background GPS failed:", error),
                                { enableHighAccuracy: true, timeout: 1000, maximumAge: 0 }
                              );
                            }
                          }}
                          variant="outline"
                          size="lg"
                          className="flex-1"
                        >
                          {pauseWorkMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Pausing...</>
                          ) : (
                            <><Pause className="mr-2 h-4 w-4" /> Pause Work</>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowReportForm(true)}
                        size="lg"
                        className="flex-1"
                        disabled={pauseStatus?.isPaused}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Job
                      </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {isTracking && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  GPS tracking active
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Site Visit Report Form */}
        {showReportForm && (
          <SiteVisitReportForm
            jobToken={token || ""}
            onSuccess={() => {
              toast.success("Job completed successfully!");
              refetch();
              setShowReportForm(false);
            }}
          />
        )}

        {/* Complete Job Details */}
        <JobDetailCards job={job} viewerType="customer" showPricing={false} />
      </div>
    </div>
  );
}

