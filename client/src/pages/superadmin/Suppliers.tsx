import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Building2 } from "lucide-react";
import { useState } from "react";

export default function SuperadminSuppliers() {
  const { data: suppliers, isLoading } = trpc.admin.getAllSuppliers.useQuery();
  const [search, setSearch] = useState("");

  const filtered = suppliers?.filter((s) =>
    s.companyName.toLowerCase().includes(search.toLowerCase()) ||
    s.contactEmail.toLowerCase().includes(search.toLowerCase())
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
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((supplier) => (
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  );
}
