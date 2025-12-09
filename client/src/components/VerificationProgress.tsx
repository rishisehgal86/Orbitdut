import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, AlertCircle, Clock, XCircle, FileText, Shield, Building2 } from "lucide-react";
import { Link } from "wouter";

export function VerificationProgress() {
  const { data: status, isLoading } = trpc.verification.getStatus.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const verificationStatus = status.verification?.status || "not_started";
  const documents = status.documents || [];
  const profile = status.profile;

  // Calculate completion percentage
  const calculateProgress = () => {
    let completed = 0;
    let total = 4; // Profile, Insurance, Legal, Optional

    // Profile completion
    if (profile && profile.companyName && profile.primaryContactEmail) {
      completed++;
    }

    // Insurance documents (at least one)
    const insuranceDocs = documents.filter(d => 
      d.documentType.includes("insurance")
    );
    if (insuranceDocs.length > 0) {
      completed++;
    }

    // Legal documents (all three required)
    const legalDocs = documents.filter(d => 
      ["dpa_signed", "nda_signed", "non_compete_signed"].includes(d.documentType)
    );
    if (legalDocs.length === 3) {
      completed++;
    }

    // Optional documents
    const optionalDocs = documents.filter(d => 
      ["security_compliance", "engineer_vetting_policy", "other"].includes(d.documentType)
    );
    if (optionalDocs.length > 0) {
      completed++;
    }

    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  // Get status badge
  const getStatusBadge = () => {
    switch (verificationStatus) {
      case "not_started":
        return <Badge variant="outline">Not Started</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "pending_review":
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
      case "under_review":
        return <Badge className="bg-blue-500">Under Review</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "resubmission_required":
        return <Badge className="bg-orange-500">Resubmission Required</Badge>;
      default:
        return <Badge variant="outline">{verificationStatus}</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "not_started":
      case "in_progress":
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
      case "pending_review":
      case "under_review":
        return <Clock className="w-6 h-6 text-blue-500" />;
      case "approved":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "resubmission_required":
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  // Get missing items
  const getMissingItems = () => {
    const missing: string[] = [];

    // Check profile
    if (!profile || !profile.companyName || !profile.primaryContactEmail) {
      missing.push("Company profile information");
    }

    // Check insurance
    const insuranceDocs = documents.filter(d => 
      d.documentType.includes("insurance")
    );
    if (insuranceDocs.length === 0) {
      missing.push("Insurance certificates");
    }

    // Check legal
    const legalDocs = documents.filter(d => 
      ["dpa_signed", "nda_signed", "non_compete_signed"].includes(d.documentType)
    );
    if (legalDocs.length < 3) {
      const signedTypes = legalDocs.map(d => d.documentType);
      if (!signedTypes.includes("dpa_signed")) missing.push("Data Processing Agreement");
      if (!signedTypes.includes("nda_signed")) missing.push("Non-Disclosure Agreement");
      if (!signedTypes.includes("non_compete_signed")) missing.push("Non-Compete Agreement");
    }

    return missing;
  };

  const missingItems = getMissingItems();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription className="mt-1">
                {getStatusBadge()}
              </CardDescription>
            </div>
          </div>
          {(verificationStatus === "not_started" || verificationStatus === "in_progress" || verificationStatus === "resubmission_required") && (
            <Button asChild size="sm">
              <Link href="/supplier/verification">
                {verificationStatus === "not_started" ? "Start Verification" : "Continue"}
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {verificationStatus !== "approved" && verificationStatus !== "rejected" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Status Message */}
        <div className="text-sm">
          {verificationStatus === "not_started" && (
            <p className="text-muted-foreground">
              Complete your verification to start accepting jobs. This process typically takes 10-15 minutes.
            </p>
          )}
          {verificationStatus === "in_progress" && (
            <p className="text-muted-foreground">
              You've started the verification process. Complete all required sections to submit for review.
            </p>
          )}
          {verificationStatus === "pending_review" && (
            <p className="text-muted-foreground">
              Your application has been submitted and is awaiting review by our team. We'll notify you via email once it's reviewed.
            </p>
          )}
          {verificationStatus === "under_review" && (
            <p className="text-muted-foreground">
              Our team is currently reviewing your application. This typically takes 1-2 business days.
            </p>
          )}
          {verificationStatus === "approved" && (
            <p className="text-green-600 font-medium">
              ✓ Your account is verified! You can now accept jobs from customers.
            </p>
          )}
          {verificationStatus === "rejected" && status.verification?.rejectionReason && (
            <div className="space-y-2">
              <p className="text-red-600 font-medium">
                Your application was not approved. Please review the feedback below.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-900">
                {status.verification.rejectionReason}
              </div>
            </div>
          )}
          {verificationStatus === "resubmission_required" && status.verification?.rejectionReason && (
            <div className="space-y-2">
              <p className="text-orange-600 font-medium">
                Additional information is needed. Please update your application.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-900">
                {status.verification.rejectionReason}
              </div>
            </div>
          )}
        </div>

        {/* Missing Items */}
        {missingItems.length > 0 && (verificationStatus === "not_started" || verificationStatus === "in_progress") && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Required Items:</p>
            <ul className="space-y-1">
              {missingItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Completed Sections */}
        {progress > 0 && progress < 100 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Completed:</p>
            <div className="flex flex-wrap gap-2">
              {profile && profile.companyName && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="w-3 h-3" />
                  Company Profile
                </Badge>
              )}
              {documents.filter(d => d.documentType.includes("insurance")).length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Insurance
                </Badge>
              )}
              {documents.filter(d => ["dpa_signed", "nda_signed", "non_compete_signed"].includes(d.documentType)).length === 3 && (
                <Badge variant="outline" className="gap-1">
                  <FileText className="w-3 h-3" />
                  Legal Agreements
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Submission Date */}
        {status.verification?.submittedAt && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Submitted: {new Date(status.verification.submittedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
