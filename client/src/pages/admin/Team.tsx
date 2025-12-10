import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminTeam() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Team</h1>
          <p className="text-gray-600 mt-1">Manage admin organization members</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Admin users with platform access</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Admin team management coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
