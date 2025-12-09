import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, AlertCircle, Clock, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SuperadminVerifications() {
  const { data: pending, isLoading, refetch } = trpc.admin.getPendingVerifications.useQuery();
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "resubmit" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const approveMutation = trpc.verification.approveVerification.useMutation();
  const rejectMutation = trpc.verification.rejectVerification.useMutation();
  const resubmitMutation = trpc.verification.requestResubmission.useMutation();

  const { data: details } = trpc.admin.getVerificationDetails.useQuery(
    { supplierId: selectedSupplier! },
    { enabled: !!selectedSupplier }
  );

  const handleAction = async () => {
    if (!selectedSupplier) return;

    try {
      if (actionType === "approve") {
        await approveMutation.mutateAsync({ supplierId: selectedSupplier });
        toast.success("Supplier approved successfully");
      } else if (actionType === "reject") {
        if (!feedback.trim()) {
          toast.error("Please provide a rejection reason");
          return;
        }
        await rejectMutation.mutateAsync({ supplierId: selectedSupplier, reason: feedback });
        toast.success("Supplier rejected");
      } else if (actionType === "resubmit") {
        if (!feedback.trim()) {
          toast.error("Please provide feedback");
          return;
        }
        await resubmitMutation.mutateAsync({
          supplierId: selectedSupplier,
          feedback,
          adminNotes: adminNotes || undefined,
        });
        toast.success("Resubmission requested");
      }

      setSelectedSupplier(null);
      setActionType(null);
      setFeedback("");
      setAdminNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    }
  };

  if (isLoading) {
    return (
      <SuperadminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </SuperadminLayout>
    );
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Verifications</h1>
          <p className="text-muted-foreground">Review and approve supplier verification applications</p>
        </div>

        {/* Pending verifications */}
        <div className="grid gap-4">
          {pending?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-muted-foreground">No pending verifications to review</p>
              </CardContent>
            </Card>
          )}

          {pending?.map((verification) => (
            <Card key={verification.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{verification.companyName}</CardTitle>
                    <CardDescription>{verification.contactEmail}</CardDescription>
                  </div>
                  <Badge variant={verification.status === "pending_review" ? "secondary" : "default"}>
                    {verification.status === "pending_review" ? "Pending Review" : "Under Review"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Submitted: {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : "N/A"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSupplier(verification.supplierId)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedSupplier && !actionType} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{details?.supplier.companyName}</DialogTitle>
            <DialogDescription>{details?.supplier.contactEmail}</DialogDescription>
          </DialogHeader>

          {details && (
            <div className="space-y-4">
              {/* Company Profile */}
              <div>
                <h3 className="font-semibold mb-2">Company Profile</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Contact:</span> {details.profile?.primaryContactName || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span> {details.profile?.primaryContactPhone || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Address:</span> {details.profile?.businessAddress || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax ID:</span> {details.supplier.taxId || "N/A"}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-2">Documents ({details.documents.length})</h3>
                <div className="space-y-2">
                  {details.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="text-sm">
                        <p className="font-medium">{doc.documentType.replace(/_/g, " ").toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              {details.verification?.adminNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Admin Notes</h3>
                  <div className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {details.verification.adminNotes}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionType("resubmit");
              }}
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Request Resubmission
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setActionType("reject");
              }}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => {
                setActionType("approve");
              }}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Supplier"}
              {actionType === "reject" && "Reject Supplier"}
              {actionType === "resubmit" && "Request Resubmission"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && "This will approve the supplier and send them a confirmation email."}
              {actionType === "reject" && "This will reject the supplier and send them a notification email."}
              {actionType === "resubmit" && "This will request additional information from the supplier."}
            </DialogDescription>
          </DialogHeader>

          {(actionType === "reject" || actionType === "resubmit") && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {actionType === "reject" ? "Rejection Reason" : "Feedback"} *
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={actionType === "reject" ? "Explain why this application is rejected..." : "What needs to be updated or added?"}
                  rows={4}
                  className="mt-1"
                />
              </div>
              {actionType === "resubmit" && (
                <div>
                  <label className="text-sm font-medium">Additional Notes (Optional)</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes or additional guidance..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              variant={actionType === "approve" ? "default" : "destructive"}
              disabled={approveMutation.isPending || rejectMutation.isPending || resubmitMutation.isPending}
            >
              {(approveMutation.isPending || rejectMutation.isPending || resubmitMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  );
}
