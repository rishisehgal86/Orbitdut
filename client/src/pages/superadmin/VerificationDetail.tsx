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
  User,
  Globe,
  Linkedin,
  Users,
  DollarSign,
  Building,
  MapPinned
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

  const { supplier, verification, reviewer, profile, documents, coverageCountries, priorityCities } = details;
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
            {/* Basic Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Basic Information
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
                  {supplier.address && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-sm">{supplier.address}</p>
                    </div>
                  )}
                  {supplier.city && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">City</p>
                      <p className="text-base">{supplier.city}</p>
                    </div>
                  )}
                  {supplier.taxId && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                      <p className="text-base">{supplier.taxId}</p>
                    </div>
                  )}
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
              </CardContent>
            </Card>

            {/* Company Profile */}
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Company Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {profile.registrationNumber && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Registration Number</p>
                        <p className="text-base">{profile.registrationNumber}</p>
                      </div>
                    )}
                    {profile.yearFounded && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Year Founded</p>
                        <p className="text-base">{profile.yearFounded}</p>
                      </div>
                    )}
                    {profile.ownershipStructure && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ownership Structure</p>
                        <p className="text-base capitalize">{profile.ownershipStructure}</p>
                      </div>
                    )}
                    {profile.parentCompany && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Parent Company</p>
                        <p className="text-base">{profile.parentCompany}</p>
                      </div>
                    )}
                    {profile.numberOfEmployees && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Number of Employees</p>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <p className="text-base">{profile.numberOfEmployees.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {profile.annualRevenue && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Annual Revenue</p>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <p className="text-base">${profile.annualRevenue.toLocaleString()} USD</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {profile.headquarters && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Headquarters</p>
                        <p className="text-sm">{profile.headquarters}</p>
                      </div>
                    </>
                  )}

                  {profile.regionalOffices && Array.isArray(profile.regionalOffices) && profile.regionalOffices.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Regional Offices</p>
                        <div className="space-y-2">
                          {profile.regionalOffices.map((office: any, idx: number) => (
                            <div key={idx} className="text-sm p-2 bg-muted/50 rounded">
                              <p className="font-medium">{office.city}, {office.country}</p>
                              {office.address && <p className="text-muted-foreground text-xs">{office.address}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {(profile.websiteUrl || profile.linkedInUrl) && (
                    <>
                      <Separator />
                      <div className="flex gap-3">
                        {profile.websiteUrl && (
                          <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-1">
                              <Globe className="w-3 h-3" />
                              Website
                            </Button>
                          </a>
                        )}
                        {profile.linkedInUrl && (
                          <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-1">
                              <Linkedin className="w-3 h-3" />
                              LinkedIn
                            </Button>
                          </a>
                        )}
                      </div>
                    </>
                  )}

                  {profile.companyOverview && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Company Overview</p>
                        <p className="text-sm">{profile.companyOverview}</p>
                      </div>
                    </>
                  )}

                  {profile.missionStatement && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Mission Statement</p>
                        <p className="text-sm italic">{profile.missionStatement}</p>
                      </div>
                    </>
                  )}

                  {profile.coreValues && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Core Values</p>
                        <p className="text-sm">{profile.coreValues}</p>
                      </div>
                    </>
                  )}

                  {(profile.primaryContactName || profile.primaryContactEmail || profile.primaryContactPhone) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Primary Contact</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {profile.primaryContactName && (
                            <div>
                              <p className="text-xs text-muted-foreground">Name</p>
                              <p className="text-sm font-medium">{profile.primaryContactName}</p>
                              {profile.primaryContactTitle && (
                                <p className="text-xs text-muted-foreground">{profile.primaryContactTitle}</p>
                              )}
                            </div>
                          )}
                          {profile.primaryContactEmail && (
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm">{profile.primaryContactEmail}</p>
                            </div>
                          )}
                          {profile.primaryContactPhone && (
                            <div>
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm">{profile.primaryContactPhone}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Coverage Areas */}
            {(coverageCountries.length > 0 || priorityCities.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPinned className="w-5 h-5" />
                    Coverage Areas
                  </CardTitle>
                  <CardDescription>
                    {coverageCountries.length} {coverageCountries.length === 1 ? 'country' : 'countries'}, {priorityCities.length} priority {priorityCities.length === 1 ? 'city' : 'cities'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {coverageCountries.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Countries</p>
                      <div className="flex flex-wrap gap-2">
                        {coverageCountries.map((cc) => (
                          <Badge key={cc.id} variant={cc.isExcluded ? "destructive" : "secondary"}>
                            {cc.countryCode} {cc.isExcluded && "(Excluded)"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {priorityCities.length > 0 && (
                    <>
                      {coverageCountries.length > 0 && <Separator />}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Priority Cities</p>
                        <div className="space-y-2">
                          {priorityCities.map((city) => (
                            <div key={city.id} className="text-sm p-2 bg-muted/50 rounded flex items-start gap-2">
                              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="font-medium">{city.cityName}, {city.countryCode}</p>
                                {city.stateProvince && <p className="text-xs text-muted-foreground">{city.stateProvince}</p>}
                                {city.formattedAddress && <p className="text-xs text-muted-foreground">{city.formattedAddress}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

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
                      <div key={doc.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{doc.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                              <p className="text-xs text-muted-foreground truncate">{doc.documentName}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                <span>{formatBytes(doc.fileSize)}</span>
                                <span>{doc.mimeType}</span>
                                {doc.uploadedAt && (
                                  <span>Uploaded {format(new Date(doc.uploadedAt), "MMM d, yyyy")}</span>
                                )}
                                {doc.uploaderName && (
                                  <span>by {doc.uploaderName}</span>
                                )}
                              </div>
                              {doc.expiryDate && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Expires: {format(new Date(doc.expiryDate), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Active</p>
                    <div className="flex items-center gap-2 mt-1">
                      {supplier.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm mt-1">
                      {supplier.updatedAt ? format(new Date(supplier.updatedAt), "MMM d, yyyy 'at' h:mm a") : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timestamps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Supplier Account</p>
                    <div className="mt-1 space-y-1">
                      <p>Created: {format(new Date(supplier.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      {supplier.updatedAt && (
                        <p>Updated: {format(new Date(supplier.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      )}
                    </div>
                  </div>
                  
                  {verification && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-medium text-muted-foreground">Verification Record</p>
                        <div className="mt-1 space-y-1">
                          {verification.createdAt && (
                            <p>Created: {format(new Date(verification.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                          )}
                          {verification.updatedAt && (
                            <p>Updated: {format(new Date(verification.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {profile && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-medium text-muted-foreground">Company Profile</p>
                        <div className="mt-1 space-y-1">
                          {profile.createdAt && (
                            <p>Created: {format(new Date(profile.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                          )}
                          {profile.updatedAt && (
                            <p>Updated: {format(new Date(profile.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            {details?.teamMembers && details.teamMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    {details.teamMembers.length} user{details.teamMembers.length !== 1 ? 's' : ''} associated with this supplier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {details.teamMembers.map((member: any) => (
                      <div key={member.userId} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{member.userName || "Unnamed User"}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.userEmail || "—"}</p>
                              {member.joinedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {member.role?.replace(/_/g, ' ') || "User"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Account Created</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(supplier.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  
                  {verification?.submittedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
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
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Reviewed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(verification.reviewedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        {reviewer && (
                          <p className="text-xs text-muted-foreground">
                            by {reviewer.name} ({reviewer.email})
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {verification?.approvedAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
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
