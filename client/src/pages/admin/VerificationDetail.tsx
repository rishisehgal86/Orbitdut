import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, FileText, ExternalLink } from "lucide-react";
import { useRoute } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function VerificationDetail() {
  const [, params] = useRoute("/admin/verifications/:supplierId");
  const supplierId = parseInt(params?.supplierId || "0");
  const { toast } = useToast();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data, isLoading, refetch } = trpc.admin.getVerificationDetails.useQuery({ supplierId });
  const approveMutation = trpc.admin.approveVerification.useMutation();
  const rejectMutation = trpc.admin.rejectVerification.useMutation();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ supplierId });
      toast({
        title: "Verification approved",
        description: "The supplier has been verified and notified.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Approval failed",
        description: "Failed to approve verification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      await rejectMutation.mutateAsync({ supplierId, reason: rejectionReason });
      toast({
        title: "Verification rejected",
        description: "The supplier has been notified of the rejection.",
      });
      setShowRejectDialog(false);
      refetch();
    } catch (error) {
      toast({
        title: "Rejection failed",
        description: "Failed to reject verification. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Loading verification details...</div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Verification not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data.supplier.companyName}</h1>
            <p className="text-gray-600 mt-1">Verification Review</p>
          </div>
          <div className="flex gap-3">
            {data.verification?.status !== "approved" && (
              <>
                <Button variant="outline" onClick={() => setShowRejectDialog(true)}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Supplier Info */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Contact Email</p>
                <p className="font-medium">{data.supplier.contactEmail}</p>
              </div>
              <div>
                <p className="text-gray-600">Contact Phone</p>
                <p className="font-medium">{data.supplier.contactPhone || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-600">Country</p>
                <p className="font-medium">{data.supplier.country}</p>
              </div>
              <div>
                <p className="text-gray-600">City</p>
                <p className="font-medium">{data.supplier.city || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Profile */}
        {data.profile && (
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-medium">{data.profile.registrationNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Year Founded</p>
                  <p className="font-medium">{data.profile.yearFounded || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ownership Structure</p>
                  <p className="font-medium capitalize">{data.profile.ownershipStructure}</p>
                </div>
                {data.profile.companyOverview && (
                  <div>
                    <p className="text-sm text-gray-600">Company Overview</p>
                    <p className="text-sm mt-1">{data.profile.companyOverview}</p>
                  </div>
                )}
                {data.profile.missionStatement && (
                  <div>
                    <p className="text-sm text-gray-600">Mission Statement</p>
                    <p className="text-sm mt-1">{data.profile.missionStatement}</p>
                  </div>
                )}
                {data.profile.websiteUrl && (
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a
                      href={data.profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {data.profile.websiteUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Documents</CardTitle>
            <CardDescription>{data.documents.length} documents uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            {data.documents.length > 0 ? (
              <div className="space-y-3">
                {data.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{doc.documentName}</p>
                        <p className="text-xs text-gray-500">
                          {doc.documentType.replace(/_/g, " ")} • Uploaded{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                        {doc.expiryDate && (
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Rejection Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Reject Verification</CardTitle>
                <CardDescription>
                  Please provide a reason for rejecting this verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the verification is being rejected..."
                  rows={4}
                />
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                    className="flex-1"
                  >
                    {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
