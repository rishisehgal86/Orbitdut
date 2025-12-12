import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Building2, Star, ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";

type SortField = "companyName" | "country" | "isVerified" | "rating" | "createdAt";
type SortOrder = "asc" | "desc";

export default function SuperadminSuppliers() {
  const { data: suppliers, isLoading } = trpc.admin.getAllSuppliers.useQuery();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredAndSorted = useMemo(() => {
    if (!suppliers) return [];

    // Filter
    let filtered = suppliers.filter((s) =>
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.contactEmail.toLowerCase().includes(search.toLowerCase())
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
  }, [suppliers, search, sortField, sortOrder]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">Manage all supplier accounts</p>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{suppliers?.length || 0}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by company name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="companyName">Company</SortableHeader>
                  <TableHead>Contact</TableHead>
                  <TableHead>Admin User</TableHead>
                  <SortableHeader field="rating">Rating</SortableHeader>
                  <SortableHeader field="isVerified">Status</SortableHeader>
                  <SortableHeader field="createdAt">Created</SortableHeader>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="w-12 h-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No suppliers found</p>
                        <p className="text-sm text-muted-foreground">
                          {search ? "Try adjusting your search" : "No suppliers available"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.companyName}</p>
                          <p className="text-xs text-muted-foreground">{supplier.country}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{supplier.contactEmail}</p>
                          {supplier.contactPhone && (
                            <p className="text-xs text-muted-foreground">{supplier.contactPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.adminUser ? (
                          <div className="text-sm">
                            <p>{supplier.adminUser.userName || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">{supplier.adminUser.userEmail}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No admin</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {((supplier.rating || 200) / 100).toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={supplier.isVerified === 1 ? "default" : "secondary"}
                            className={supplier.isVerified === 1 ? "bg-green-500" : ""}
                          >
                            {supplier.isVerified === 1 ? "Verified" : "Unverified"}
                          </Badge>
                          {supplier.isActive === 0 && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {supplier.adminUser?.lastSignedIn
                          ? new Date(supplier.adminUser.lastSignedIn).toLocaleDateString()
                          : "Never"}
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
