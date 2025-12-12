import { useState } from "react";
import { trpc } from "../lib/trpc";
import SuperadminLayout from "../components/SuperadminLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { ArrowUpDown, Shield, ShieldCheck } from "lucide-react";
import { useToast } from "../hooks/use-toast";

type VerificationStatus = "not_started" | "in_progress" | "pending_review" | "under_review" | "approved" | "rejected" | "resubmission_required";

export function SuperadminManualVerification() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"companyName" | "country" | "status">("companyName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Dialog state
  const [selectedSupplier, setSelectedSupplier] = useState<{
    id: number;
    companyName: string;
    currentStatus: string;
    isManuallyVerified: number;
  } | null>(null);
  const [newStatus, setNewStatus] = useState<VerificationStatus>("approved");
  const [reason, setReason] = useState("");
  const [clearManualFlag, setClearManualFlag] = useState(false);

  const { data: grouped, isLoading, refetch } = trpc.admin.getAllSupplierVerifications.useQuery();
  const changeStatusMutation = trpc.admin.changeVerificationStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Status Changed",
        description: "Verification status updated successfully",
      });
      setSelectedSupplier(null);
      setReason("");
      setClearManualFlag(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <SuperadminLayout>
        <div className="container py-8">
          <p>Loading suppliers...</p>
        </div>
      </SuperadminLayout>
    );
  }

  // Flatten all suppliers from grouped data
  const allSuppliers = grouped
    ? [
        ...grouped.notStarted,
        ...grouped.inProgress,
        ...grouped.pendingReview,
        ...grouped.underReview,
        ...grouped.approved,
        ...grouped.rejected,
        ...grouped.resubmissionRequired,
      ]
    : [];

  // Filter by search term
  const filteredSuppliers = allSuppliers.filter((supplier) =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort suppliers
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    let aVal: string, bVal: string;
    
    if (sortField === "companyName") {
      aVal = a.companyName;
      bVal = b.companyName;
    } else if (sortField === "country") {
      aVal = a.country || "";
      bVal = b.country || "";
    } else {
      aVal = a.verificationStatus || "";
      bVal = b.verificationStatus || "";
    }

    if (sortDirection === "asc") {
      return aVal.localeCompare(bVal);
    } else {
      return bVal.localeCompare(aVal);
    }
  });

  const toggleSort = (field: "companyName" | "country" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (status: string, isManuallyVerified: number) => {
    const colors: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      pending_review: "bg-yellow-100 text-yellow-800",
      under_review: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      resubmission_required: "bg-purple-100 text-purple-800",
    };

    const label = status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Not Started";

    return (
      <div className="flex items-center gap-2">
        <Badge className={colors[status] || colors.not_started}>
          {label}
        </Badge>
        {isManuallyVerified === 1 && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            <Shield className="w-3 h-3 mr-1" />
            Manual
          </Badge>
        )}
      </div>
    );
  };

  const handleChangeStatus = () => {
    if (!selectedSupplier || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the status change",
        variant: "destructive",
      });
      return;
    }

    changeStatusMutation.mutate({
      supplierId: selectedSupplier.id,
      newStatus,
      reason: reason.trim(),
      clearManualFlag,
    });
  };

  return (
    <SuperadminLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manual Verification Management</h1>
          <p className="text-muted-foreground">
            Change supplier verification status at any time. Manual status changes are tracked separately from the normal verification process.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by company name or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Suppliers Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("companyName")}
                    className="flex items-center gap-2"
                  >
                    Company Name
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("country")}
                    className="flex items-center gap-2"
                  >
                    Country
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => toggleSort("status")}
                    className="flex items-center gap-2"
                  >
                    Status
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                sortedSuppliers.map((supplier) => (
                  <TableRow key={supplier.supplierId}>
                    <TableCell className="font-medium">{supplier.companyName}</TableCell>
                    <TableCell>{supplier.country || "N/A"}</TableCell>
                    <TableCell>
                      {getStatusBadge(supplier.verificationStatus || "not_started", supplier.isManuallyVerified ?? 0)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{supplier.contactName || "N/A"}</div>
                        <div className="text-muted-foreground">{supplier.contactEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSupplier({
                            id: supplier.supplierId,
                            companyName: supplier.companyName,
                            currentStatus: supplier.verificationStatus || "not_started",
                            isManuallyVerified: supplier.isManuallyVerified ?? 0,
                          });
                          setNewStatus("approved");
                          setReason("");
                          setClearManualFlag(false);
                        }}
                      >
                        Change Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Change Status Dialog */}
        <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Change Verification Status</DialogTitle>
              <DialogDescription>
                Change the verification status for <strong>{selectedSupplier?.companyName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current Status */}
              <div>
                <Label>Current Status</Label>
                <div className="mt-2">
                  {selectedSupplier && getStatusBadge(selectedSupplier.currentStatus, selectedSupplier.isManuallyVerified)}
                </div>
              </div>

              {/* New Status */}
              <div>
                <Label htmlFor="newStatus">New Status *</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as VerificationStatus)}>
                  <SelectTrigger id="newStatus" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="resubmission_required">Resubmission Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you're changing the status..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Clear Manual Flag */}
              {selectedSupplier?.isManuallyVerified === 1 && (
                <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <Checkbox
                    id="clearFlag"
                    checked={clearManualFlag}
                    onCheckedChange={(checked) => setClearManualFlag(checked as boolean)}
                  />
                  <Label htmlFor="clearFlag" className="text-sm cursor-pointer">
                    Clear "Manual Verification" flag (revert to normal process)
                  </Label>
                </div>
              )}

              {/* Warning */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <p className="font-medium text-blue-900 mb-1">Note:</p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li>This will be marked as a manual status change</li>
                  <li>The supplier will receive an email notification</li>
                  <li>All changes are tracked in the audit trail</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleChangeStatus}
                disabled={!reason.trim() || changeStatusMutation.isPending}
              >
                {changeStatusMutation.isPending ? "Changing..." : "Change Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperadminLayout>
  );
}
