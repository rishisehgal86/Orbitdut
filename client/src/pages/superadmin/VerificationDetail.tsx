import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ExternalLink,
  Loader2,
  Calendar,
  User
} from "lucide-react";
import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";

export default function VerificationDetail() {
  const params = useParams<{ supplierId: string }>();
  const [, setLocation] = useLocation();
  const supplierId = parseInt(params.supplierId || "0");
  
  const { data: details, isLoading, refetch } = trpc.admin.getVerificationDetails.useQuery(
    { supplierId },
    { enabled: !!supplierId }
  );

  const [actionType, setActionType] = useState<"approve" | "reject" | "resubmit" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const approveMutation = trpc.verification.approveVerification.useMutation();
  const rejectMutation = trpc.verification.rejectVerification.useMutation();
  const resubmitMutation = trpc.verification.requestResubmission.useMutation();

  const handleAction = async () => {
    if (!supplierId) return;

    try {
      if (actionType === "approve") {
        await approveMutation.mutateAsync({ supplierId });
        toast.success("Supplier approved successfully");
        setLocation("/superadmin/verifications");
      } else if (actionType === "reject") {
        if (!feedback.trim()) {
          toast.error("Please provide a rejection reason");
          return;
        }
        await rejectMutation.mutateAsync({ supplierId, reason: feedback });
        toast.success("Supplier rejected");
        setLocation("/superadmin/verifications");
      } else if (actionType === "resubmit") {
        if (!feedback.trim()) {
          toast.error("Please provide feedback");
          return;
        }
        await resubmitMutation.mutateAsync({
          supplierId,
          feedback,
          adminNotes: adminNotes || undefined,
        });
        toast.success("Resubmission requested");
        setLocation("/superadmin/verifications");
      }

      setActionType(null);
      setFeedback("");
      setAdminNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Action failed");
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status || status === "not_started") {
      return <Badge variant="secondary" className="gap-1">Not Started</Badge>;
    }
    switch (status) {
      case "in_progress":
        return <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">In Progress</Badge>;
      case "pending_review":
        return <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">Pending Review</Badge>;
      case "under_review":
        return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600">Under Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="gap-1 border-green-500 text-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1">Rejected</Badge>;
      case "resubmission_required":
        return <Badge variant="outline" className="gap-1 border-purple-500 text-purple-600">Resubmission Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  if (!details) {
    return (
      <SuperadminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <p className="text-lg font-medium">Supplier not found</p>
          <Link href="/superadmin/verifications">
            <Button variant="outline">Back to Verifications</Button>
          </Link>
        </div>
      </SuperadminLayout>
    );
  }

  const { supplier, verification, profile, documents } = details;
  const canApprove = verification?.status === "pending_review" || verification?.status === "under_review";

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/superadmin/verifications">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{supplier.companyName || "Unnamed Company"}</h1>
              <p className="text-muted-foreground">Verification Review</p>
            </div>
          </div>
          {getStatusBadge(verification?.status)}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Company Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                    <p className="text-base">{supplier.companyName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Country</p>
                    <p className="text-base">{supplier.country || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Email</p>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <p className="text-base">{supplier.contactEmail || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <p className="text-base">{supplier.contactPhone || "—"}</p>
                    </div>
                  </div>
                </div>

                {profile && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-medium">Company Profile</h3>
                      {profile.description && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p className="text-sm">{profile.description}</p>
                        </div>
                      )}
                      <div className="grid gap-4 md:grid-cols-2">
                        {profile.yearsInBusiness && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Years in Business</p>
                            <p className="text-base">{profile.yearsInBusiness}</p>
                          </div>
                        )}
                        {profile.numberOfTechnicians && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Number of Technicians</p>
                            <p className="text-base">{profile.numberOfTechnicians}</p>
                          </div>
                        )}
                        {profile.certifications && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Certifications</p>
                            <p className="text-sm">{profile.certifications}</p>
                          </div>
                        )}
                        {profile.insuranceProvider && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Insurance Provider</p>
                            <p className="text-sm">{profile.insuranceProvider}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Verification Documents
                </CardTitle>
                <CardDescription>
                  {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                            {doc.expiryDate && (
                              <p className="text-xs text-muted-foreground">
                                Expires: {format(new Date(doc.expiryDate), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-1">
                              <ExternalLink className="w-3 h-3" />
                              View
                            </Button>
                          </a>
                          <a href={doc.fileUrl} download>
                            <Button size="sm" variant="ghost" className="gap-1">
                              <Download className="w-3 h-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Verification Status & Actions */}
          <div className="space-y-6">
            {/* Verification Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="text-sm font-medium">Account Created</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(supplier.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  
                  {verification?.submittedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                      <div>
                        <p className="text-sm font-medium">Submitted for Review</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(verification.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}

                  {verification?.reviewedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      <div>
                        <p className="text-sm font-medium">Reviewed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(verification.reviewedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}

                  {verification?.approvedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="text-sm font-medium">Approved</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(verification.approvedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {verification?.rejectionReason && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
                      <p className="text-sm text-muted-foreground">{verification.rejectionReason}</p>
                    </div>
                  </>
                )}

                {verification?.adminNotes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-1">Admin Notes</p>
                      <p className="text-sm text-muted-foreground">{verification.adminNotes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {canApprove && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                  <CardDescription>Approve, reject, or request changes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => setActionType("approve")}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Verification
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => setActionType("resubmit")}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Request Resubmission
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full gap-2"
                    onClick={() => setActionType("reject")}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Action Dialogs */}
      <Dialog open={actionType === "approve"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Verification</DialogTitle>
            <DialogDescription>
              This will grant {supplier.companyName} full access to the platform and allow them to accept jobs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button onClick={handleAction} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionType === "reject"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. The supplier will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleAction} 
              disabled={rejectMutation.isPending || !feedback.trim()}
            >
              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionType === "resubmit"} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Resubmission</DialogTitle>
            <DialogDescription>
              Provide feedback on what needs to be corrected. The supplier will be able to update their application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Feedback for Supplier</label>
              <Textarea
                placeholder="What needs to be corrected or updated..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes (Internal)</label>
              <Textarea
                placeholder="Internal notes (optional)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button 
              onClick={handleAction} 
              disabled={resubmitMutation.isPending || !feedback.trim()}
            >
              {resubmitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Resubmission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  );
}
