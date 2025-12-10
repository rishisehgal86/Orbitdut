import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminJobs() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Jobs Management</h1>
          <p className="text-gray-600 mt-1">View and manage all platform jobs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
            <CardDescription>Complete job history and monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Job management interface coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
