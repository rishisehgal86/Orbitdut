import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Briefcase, ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";

type SortField = "id" | "status" | "calculatedPrice" | "createdAt" | "scheduledDateTime";
type SortOrder = "asc" | "desc";

export default function SuperadminJobs() {
  const { data: jobs, isLoading } = trpc.admin.getAllJobs.useQuery();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredAndSorted = useMemo(() => {
    if (!jobs) return [];

    // Filter
    let filtered = jobs.filter((j) =>
      j.siteName?.toLowerCase().includes(search.toLowerCase()) ||
      j.siteAddress?.toLowerCase().includes(search.toLowerCase()) ||
      j.customer?.customerEmail?.toLowerCase().includes(search.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = "";
      if (bVal === null || bVal === undefined) bVal = "";

      // Convert to lowercase for string comparison
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      // Compare
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [jobs, search, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </TableHead>
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending_supplier_acceptance: "border-blue-300 bg-blue-50 text-blue-700",
      supplier_accepted: "border-indigo-300 bg-indigo-50 text-indigo-700",
      sent_to_engineer: "border-purple-300 bg-purple-50 text-purple-700",
      engineer_accepted: "border-violet-300 bg-violet-50 text-violet-700",
      en_route: "border-orange-300 bg-orange-50 text-orange-700",
      on_site: "border-amber-300 bg-amber-50 text-amber-700",
      completed: "border-green-300 bg-green-50 text-green-700",
      cancelled: "border-gray-300 bg-gray-50 text-gray-600",
    };

    const className = variants[status] || "border-gray-300 bg-gray-50 text-gray-600";

    return (
      <Badge variant="outline" className={className}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
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

  const totalRevenue = jobs?.reduce((sum, j) => sum + (j.calculatedPrice || 0), 0) || 0;
  const completedJobs = jobs?.filter(j => j.status === "completed").length || 0;
  const activeJobs = jobs?.filter(j => !["completed", "cancelled"].includes(j.status)).length || 0;

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground">Monitor all jobs across the platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{jobs?.length || 0}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{jobs?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeJobs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{completedJobs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by site name, address, or customer email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="id">Job ID</SortableHeader>
                  <TableHead>Site</TableHead>
                  <TableHead>Customer</TableHead>
                  <SortableHeader field="status">Status</SortableHeader>
                  <SortableHeader field="calculatedPrice">Price</SortableHeader>
                  <SortableHeader field="createdAt">Created</SortableHeader>
                  <SortableHeader field="scheduledDateTime">Scheduled</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="w-12 h-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No jobs found</p>
                        <p className="text-sm text-muted-foreground">
                          {search ? "Try adjusting your search" : "No jobs available"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">#{job.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.siteName || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{job.siteAddress || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.customer ? (
                          <div className="text-sm">
                            <p>{job.customer.customerName || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">{job.customer.customerEmail}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="font-medium">
                        {job.calculatedPrice ? `$${(job.calculatedPrice / 100).toFixed(2)}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.scheduledDateTime ? new Date(job.scheduledDateTime).toLocaleDateString() : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  );
}
