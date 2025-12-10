import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage customers, suppliers, and engineers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>All registered customers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Customer management coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>All registered suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Supplier management coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
