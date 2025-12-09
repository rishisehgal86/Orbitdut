import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, Building2, Briefcase, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function SuperadminDashboard() {
  const { data: suppliers, isLoading: loadingSuppliers } = trpc.admin.getAllSuppliers.useQuery();
  const { data: users, isLoading: loadingUsers } = trpc.admin.getAllUsers.useQuery();
  const { data: jobs, isLoading: loadingJobs } = trpc.admin.getAllJobs.useQuery();
  const { data: pending, isLoading: loadingPending } = trpc.admin.getPendingVerifications.useQuery();

  const isLoading = loadingSuppliers || loadingUsers || loadingJobs || loadingPending;

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
  const verifiedSuppliers = suppliers?.filter(s => s.isVerified === 1).length || 0;
  const activeSuppliers = suppliers?.filter(s => s.isActive === 1).length || 0;

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of the Orbidut platform</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {users?.filter(u => u.accountType === "customer").length || 0} customers, {users?.filter(u => u.accountType === "supplier").length || 0} suppliers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Suppliers</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {verifiedSuppliers} verified, {activeSuppliers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jobs</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeJobs} active, {completedJobs} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {completedJobs} completed jobs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Verifications Alert */}
        {pending && pending.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-orange-900">Pending Verifications</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-orange-200 text-orange-900">
                  {pending.length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-800 mb-4">
                There are {pending.length} supplier verification{pending.length > 1 ? "s" : ""} waiting for review.
              </p>
              <Button asChild size="sm">
                <Link href="/superadmin/verifications">
                  <Shield className="w-4 h-4 mr-2" />
                  Review Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suppliers
                  ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{supplier.companyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(supplier.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={supplier.isVerified === 1 ? "default" : "secondary"}>
                        {supplier.isVerified === 1 ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  ))}
              </div>
              <Button asChild variant="outline" size="sm" className="w-full mt-4">
                <Link href="/superadmin/suppliers">View All</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs
                  ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((job) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">#{job.id} - {job.siteName || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge>{job.status.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
              </div>
              <Button asChild variant="outline" size="sm" className="w-full mt-4">
                <Link href="/superadmin/jobs">View All</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/superadmin/verifications">
                  <Shield className="w-4 h-4 mr-2" />
                  Review Verifications
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/superadmin/suppliers">
                  <Building2 className="w-4 h-4 mr-2" />
                  Manage Suppliers
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/superadmin/users">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperadminLayout>
  );
}
