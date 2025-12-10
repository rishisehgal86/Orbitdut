import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Loader2, 
  Search,
  Eye,
  Mail,
  Phone,
  Building2,
  Calendar,
  TrendingUp,
  Filter,
  X
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function SuperadminVerifications() {
  const { data, isLoading } = trpc.admin.getAllSupplierVerifications.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Column filters
  const [companyFilter, setCompanyFilter] = useState("");
  const [contactFilter, setContactFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Calculate totals
  const totals = useMemo(() => {
    if (!data) return { all: 0, notStarted: 0, inProgress: 0, pendingReview: 0, approved: 0 };
    return {
      all: Object.values(data).flat().length,
      notStarted: data.notStarted.length,
      inProgress: data.inProgress.length,
      pendingReview: data.pendingReview.length + data.underReview.length,
      approved: data.approved.length,
      rejected: data.rejected.length,
      resubmissionRequired: data.resubmissionRequired.length,
    };
  }, [data]);

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!data) return { countries: [], statuses: [] };
    
    const allSuppliers = Object.values(data).flat();
    const countries = Array.from(new Set(allSuppliers.map(s => s.country).filter(Boolean))).sort();
    const statuses = Array.from(new Set(allSuppliers.map(s => s.verificationStatus).filter(Boolean)));
    
    return { countries, statuses };
  }, [data]);

  // Get filtered suppliers based on active tab
  const filteredSuppliers = useMemo(() => {
    if (!data) return [];
    
    let suppliers = [];
    switch (activeTab) {
      case "notStarted":
        suppliers = data.notStarted;
        break;
      case "inProgress":
        suppliers = data.inProgress;
        break;
      case "pendingReview":
        suppliers = [...data.pendingReview, ...data.underReview];
        break;
      case "approved":
        suppliers = data.approved;
        break;
      case "rejected":
        suppliers = data.rejected;
        break;
      case "resubmissionRequired":
        suppliers = data.resubmissionRequired;
        break;
      default:
        suppliers = Object.values(data).flat();
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      suppliers = suppliers.filter(s => 
        s.companyName?.toLowerCase().includes(term) ||
        s.contactName?.toLowerCase().includes(term) ||
        s.contactPersonEmail?.toLowerCase().includes(term)
      );
    }

    // Apply column filters
    if (companyFilter) {
      const term = companyFilter.toLowerCase();
      suppliers = suppliers.filter(s => s.companyName?.toLowerCase().includes(term));
    }
    
    if (contactFilter) {
      const term = contactFilter.toLowerCase();
      suppliers = suppliers.filter(s => s.contactName?.toLowerCase().includes(term));
    }
    
    if (countryFilter && countryFilter !== "all") {
      suppliers = suppliers.filter(s => s.country === countryFilter);
    }
    
    if (statusFilter && statusFilter !== "all") {
      suppliers = suppliers.filter(s => s.verificationStatus === statusFilter);
    }

    return suppliers;
  }, [data, activeTab, searchTerm, companyFilter, contactFilter, countryFilter, statusFilter]);

  const clearFilters = () => {
    setCompanyFilter("");
    setContactFilter("");
    setCountryFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters = companyFilter || contactFilter || countryFilter || statusFilter;

  const getStatusBadge = (status: string | null) => {
    if (!status || status === "not_started") {
      return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Not Started</Badge>;
    }
    switch (status) {
      case "in_progress":
        return <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><TrendingUp className="w-3 h-3" /> In Progress</Badge>;
      case "pending_review":
        return <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600"><AlertCircle className="w-3 h-3" /> Pending Review</Badge>;
      case "under_review":
        return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600"><FileText className="w-3 h-3" /> Under Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="gap-1 border-green-500 text-green-600"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case "resubmission_required":
        return <Badge variant="outline" className="gap-1 border-purple-500 text-purple-600"><AlertCircle className="w-3 h-3" /> Resubmission Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_started": return "Not Started";
      case "in_progress": return "In Progress";
      case "pending_review": return "Pending Review";
      case "under_review": return "Under Review";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      case "resubmission_required": return "Resubmission Required";
      default: return status;
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Verifications</h1>
          <p className="text-muted-foreground">Manage and review all supplier verification applications</p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Not Started</CardDescription>
              <CardTitle className="text-3xl">{totals.notStarted}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Suppliers who haven't begun verification</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl">{totals.inProgress}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Partially completed applications</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl text-orange-600">{totals.pendingReview}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Awaiting your approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-3xl text-green-600">{totals.approved}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Active verified suppliers</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({totals.all})</TabsTrigger>
            <TabsTrigger value="notStarted">Not Started ({totals.notStarted})</TabsTrigger>
            <TabsTrigger value="inProgress">In Progress ({totals.inProgress})</TabsTrigger>
            <TabsTrigger value="pendingReview">Pending Review ({totals.pendingReview})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({totals.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({totals.rejected})</TabsTrigger>
            <TabsTrigger value="resubmissionRequired">Resubmission ({totals.resubmissionRequired})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Filter className="w-3 h-3 text-muted-foreground" />
                          <span>Company</span>
                        </div>
                        <Input
                          placeholder="Filter..."
                          value={companyFilter}
                          onChange={(e) => setCompanyFilter(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Filter className="w-3 h-3 text-muted-foreground" />
                          <span>Contact Person</span>
                        </div>
                        <Input
                          placeholder="Filter..."
                          value={contactFilter}
                          onChange={(e) => setContactFilter(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Filter className="w-3 h-3 text-muted-foreground" />
                          <span>Country</span>
                        </div>
                        <Select value={countryFilter} onValueChange={setCountryFilter}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {filterOptions.countries.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Filter className="w-3 h-3 text-muted-foreground" />
                          <span>Status</span>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {filterOptions.statuses.filter(Boolean).map(status => (
                              <SelectItem key={status!} value={status!}>{getStatusLabel(status!)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                          <p className="text-lg font-medium">No suppliers found</p>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm || hasActiveFilters ? "Try adjusting your filters" : "No suppliers in this category"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.supplierId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{supplier.companyName || "Unnamed Company"}</p>
                              <p className="text-xs text-muted-foreground">{supplier.country || "N/A"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{supplier.contactName}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="text-xs">{supplier.contactPersonEmail}</span>
                            </div>
                            {supplier.contactPersonPhone && supplier.contactPersonPhone !== 'N/A' && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span className="text-xs">{supplier.contactPersonPhone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(supplier.verificationStatus)}
                        </TableCell>
                        <TableCell>
                          {supplier.verificationStatus === 'in_progress' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-500 transition-all" 
                                    style={{ width: `${supplier.completionPercentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{supplier.completionPercentage}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{supplier.documentsCount} docs</p>
                            </div>
                          ) : supplier.documentsCount > 0 ? (
                            <p className="text-sm text-muted-foreground">{supplier.documentsCount} documents</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {supplier.updatedAt ? format(new Date(supplier.updatedAt), "MMM d, yyyy") : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/superadmin/verifications/${supplier.supplierId}`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Eye className="w-3 h-3" />
                              {supplier.verificationStatus === 'pending_review' || supplier.verificationStatus === 'under_review' 
                                ? 'Review' 
                                : 'View'}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperadminLayout>
  );
}
