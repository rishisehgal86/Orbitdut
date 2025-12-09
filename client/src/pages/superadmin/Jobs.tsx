import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Briefcase } from "lucide-react";
import { useState } from "react";

export default function SuperadminJobs() {
  const { data: jobs, isLoading } = trpc.admin.getAllJobs.useQuery();
  const [search, setSearch] = useState("");

  const filtered = jobs?.filter((j) =>
    j.siteName?.toLowerCase().includes(search.toLowerCase()) ||
    j.siteAddress?.toLowerCase().includes(search.toLowerCase()) ||
    j.customer?.customerEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      pending_supplier_acceptance: { variant: "secondary" },
      supplier_accepted: { variant: "default", className: "bg-blue-500" },
      sent_to_engineer: { variant: "default", className: "bg-indigo-500" },
      engineer_accepted: { variant: "default", className: "bg-purple-500" },
      en_route: { variant: "default", className: "bg-orange-500" },
      on_site: { variant: "default", className: "bg-yellow-500" },
      completed: { variant: "default", className: "bg-green-500" },
      cancelled: { variant: "destructive" },
    };

    const config = variants[status] || { variant: "outline" as const };

    return (
      <Badge variant={config.variant} className={config.className}>
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
                  <TableHead>Job ID</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((job) => (
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
                      {job.scheduledStart ? new Date(job.scheduledStart).toLocaleDateString() : "N/A"}
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
