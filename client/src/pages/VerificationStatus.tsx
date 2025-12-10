import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, AlertCircle, FileText } from "lucide-react";
import { Link } from "wouter";
import { VerificationWizard } from "@/components/VerificationWizard";

export default function VerificationStatus() {
  const { data: status, isLoading } = trpc.verification.getStatus.useQuery();

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">Loading verification status...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>Unable to load verification status</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const verificationStatus = status.verification?.status || "not_started";

  // Show wizard for not_started, in_progress, or resubmission_required
  // Only show status page once submitted (pending_review, under_review, approved, rejected)
  if (verificationStatus === "not_started" || verificationStatus === "in_progress" || verificationStatus === "resubmission_required") {
    return <VerificationWizard />;
  }

  // Show status page for submitted/under review/approved/rejected
  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
          <CardDescription>Your supplier verification application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-4">
              {verificationStatus === "pending_review" && (
                <>
                  <Clock className="w-12 h-12 text-yellow-600" />
                  <div>
                    <h3 className="text-xl font-semibold">Pending Review</h3>
                    <p className="text-gray-600">
                      Your application has been submitted and is awaiting review by our team.
                    </p>
                  </div>
                </>
              )}
              {verificationStatus === "under_review" && (
                <>
                  <AlertCircle className="w-12 h-12 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-semibold">Under Review</h3>
                    <p className="text-gray-600">
                      Our team is currently reviewing your application.
                    </p>
                  </div>
                </>
              )}
              {verificationStatus === "approved" && (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-green-600">Verified</h3>
                    <p className="text-gray-600">
                      Congratulations! Your supplier account has been verified.
                    </p>
                  </div>
                </>
              )}
              {verificationStatus === "rejected" && (
                <>
                  <XCircle className="w-12 h-12 text-red-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-red-600">Rejected</h3>
                    <p className="text-gray-600">
                      Your application was not approved. Please review the feedback below.
                    </p>
                  </div>
                </>
              )}
              {verificationStatus === "resubmission_required" && (
                <>
                  <AlertCircle className="w-12 h-12 text-orange-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-orange-600">Resubmission Required</h3>
                    <p className="text-gray-600">
                      Additional information or documents are needed. Please update your application.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Submission Date */}
            {status.verification?.submittedAt && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Submitted:</span>{" "}
                  {new Date(status.verification.submittedAt).toLocaleDateString()}
                </p>
                {status.verification.reviewedAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Reviewed:</span>{" "}
                    {new Date(status.verification.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Rejection Reason */}
            {verificationStatus === "rejected" && status.verification?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                <p className="text-sm text-red-800">{status.verification.rejectionReason}</p>
              </div>
            )}

            {/* Documents Summary */}
            <div>
              <h4 className="font-semibold mb-3">Uploaded Documents</h4>
              <div className="space-y-2">
                {status.documents && status.documents.length > 0 ? (
                  status.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium">{doc.documentName}</p>
                          <p className="text-xs text-gray-500">
                            {doc.documentType.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === "approved" && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {doc.status === "rejected" && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        {doc.status === "pending_review" && (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {verificationStatus === "rejected" || verificationStatus === "resubmission_required" ? (
                <Button asChild>
                  <Link href="/supplier/verification/resubmit">Update Application</Link>
                </Button>
              ) : verificationStatus === "approved" ? (
                <Button asChild>
                  <Link href="/supplier/jobs">View Available Jobs</Link>
                </Button>
              ) : null}
              <Button variant="outline" asChild>
                <Link href="/supplier/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
