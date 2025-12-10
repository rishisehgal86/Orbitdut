import SupplierLayout from "@/components/SupplierLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Briefcase, CheckCircle, Clock, DollarSign, Loader2, Eye, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VerificationProgress } from "@/components/VerificationProgress";

export default function SupplierDashboard() {
  const { data: profile } = trpc.suppliers.getProfile.useQuery();
  const { data: verificationStatus } = trpc.verification.getStatus.useQuery();
  const { data: availableJobs, isLoading: loadingAvailable } = trpc.jobs.getAvailableForSupplier.useQuery();
  const { data: myJobs, isLoading: loadingMy } = trpc.jobs.getSupplierJobs.useQuery();
  const { data: supplierRates } = trpc.supplier.getRates.useQuery({ supplierId: profile?.id || 0 }, { enabled: !!profile?.id });
  const { data: coverageCountries } = trpc.supplier.getCountries.useQuery({ supplierId: profile?.id || 0 }, { enabled: !!profile?.id });

  const isVerified = profile?.isVerified === 1;
  const verificationState = verificationStatus?.verification?.status || "not_started";

  // Check completion status for each setup step
  const hasCompletedProfile = verificationState === 'approved';
  const hasSetRates = (supplierRates && supplierRates.length > 0) || false;
  const hasSetCoverage = (coverageCountries && coverageCountries.length > 0) || false;
  const allStepsCompleted = hasCompletedProfile && hasSetRates && hasSetCoverage;

  const isLoading = loadingAvailable || loadingMy;

  // Calculate statistics from jobs
  const stats = {
    availableJobs: availableJobs?.length || 0,
    myJobs: myJobs?.length || 0,
    totalActiveJobs: (availableJobs?.length || 0) + (myJobs?.length || 0), // Sum of available + my jobs
    completedJobs: myJobs?.filter(j => j.status === 'completed').length || 0,
    totalEarnings: (myJobs
      ?.filter(j => j.status === 'completed')
      .reduce((sum, j) => sum + (j.calculatedPrice || 0), 0) || 0) / 100, // Convert cents to dollars
  };

  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your supplier portal. Manage your jobs, rates, and coverage areas.
          </p>
        </div>

        {/* Verification Approval Confirmation */}
        {isVerified && (
          <Alert className="border-green-500 bg-green-50 text-green-900">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 font-semibold">Verification Approved</AlertTitle>
            <AlertDescription className="text-green-800">
              Congratulations! Your supplier account has been verified and approved. You can now accept and manage jobs.
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Progress Indicator */}
        {!isVerified && (
          <VerificationProgress />
        )}

        {/* Verification Banner - Keep for backward compatibility but hidden when progress card is shown */}
        {false && !isVerified && verificationState === "not_started" && (
          <Alert variant="destructive" className="border-red-500 bg-red-50 text-red-900">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-900 font-semibold">Verification Required</AlertTitle>
            <AlertDescription className="text-red-800">
              Your supplier account is not yet verified. You must complete the verification process before you can accept jobs.
              <div className="mt-3">
                <Link href="/supplier/verification">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                    Complete Verification
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {!isVerified && (verificationState === "pending_review" || verificationState === "under_review") && (
          <Alert className="border-blue-500 bg-blue-50 text-blue-900">
            <Clock className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold">Verification Pending Review</AlertTitle>
            <AlertDescription className="text-blue-800">
              Your verification application has been submitted and is currently under review. We'll notify you once it's approved.
              <div className="mt-3">
                <Link href="/supplier/verification">
                  <Button size="sm" variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-100">
                    View Status
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {!isVerified && verificationState === "resubmission_required" && (
          <Alert variant="destructive" className="border-orange-500 bg-orange-50 text-orange-900">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">Action Required</AlertTitle>
            <AlertDescription className="text-orange-800">
              Additional information is needed for your verification. Please review the feedback and update your application.
              <div className="mt-3">
                <Link href="/supplier/verification">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    Update Application
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview - Logical workflow order */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. Available Jobs (new opportunities) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.availableJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.availableJobs === 0 ? 'No new jobs available' : 'Ready to accept'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 2. My Jobs (assigned to me) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.myJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.myJobs === 0 ? 'No assigned jobs' : 'Assigned to you'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 3. Total Active Jobs (Available + My Jobs) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalActiveJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalActiveJobs === 0 ? 'No active jobs' : 'Available + Assigned'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 4. Completed Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.completedJobs}</div>
                  <p className="text-xs text-muted-foreground">All-time completed</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Earnings Card - Full width below */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {stats.completedJobs} completed {stats.completedJobs === 1 ? 'job' : 'jobs'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Setup Checklist - Only show if not all steps completed */}
        {!allStepsCompleted && (
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Complete these steps to start receiving job offers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company Profile */}
              <div className="flex items-start gap-4 rounded-lg border p-4">
                {hasCompletedProfile ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {hasCompletedProfile ? '✓ Company profile verified' : 'Complete your company profile'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasCompletedProfile 
                      ? 'Your business information has been verified' 
                      : 'Add your business information to verify your account'}
                  </p>
                </div>
                {!hasCompletedProfile && (
                  <Link href="/supplier/verification">
                    <Button variant="outline" size="sm">
                      Setup
                    </Button>
                  </Link>
                )}
              </div>

              {/* Service Rates */}
              <div className="flex items-start gap-4 rounded-lg border p-4">
                {hasSetRates ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {hasSetRates ? '✓ Service rates configured' : 'Set your service rates'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasSetRates 
                      ? `${supplierRates?.length || 0} rate${(supplierRates?.length || 0) !== 1 ? 's' : ''} configured` 
                      : 'Define your hourly rates for different countries'}
                  </p>
                </div>
                {!hasSetRates && (
                  <Link href="/supplier/rates">
                    <Button variant="outline" size="sm">
                      Setup
                    </Button>
                  </Link>
                )}
              </div>

              {/* Coverage Area */}
              <div className="flex items-start gap-4 rounded-lg border p-4">
                {hasSetCoverage ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {hasSetCoverage ? '✓ Coverage area defined' : 'Define your coverage area'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasSetCoverage 
                      ? `${coverageCountries?.length || 0} countr${(coverageCountries?.length || 0) !== 1 ? 'ies' : 'y'} covered` 
                      : 'Specify the geographic regions where you provide services'}
                  </p>
                </div>
                {!hasSetCoverage && (
                  <Link href="/supplier/coverage">
                    <Button variant="outline" size="sm">
                      Setup
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest job updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your job updates will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}
