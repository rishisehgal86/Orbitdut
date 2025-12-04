import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Briefcase, Users, CheckSquare, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  // TODO: Add admin stats queries
  // const { data: stats } = trpc.admin.getStats.useQuery();

  const stats = {
    totalJobs: 0,
    activeJobs: 0,
    totalCustomers: 0,
    totalSuppliers: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform overview and key metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            subtitle={`${stats.activeJobs} active`}
            icon={<Briefcase className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Customers"
            value={stats.totalCustomers}
            subtitle="Registered users"
            icon={<Users className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Suppliers"
            value={stats.totalSuppliers}
            subtitle={`${stats.pendingVerifications} pending verification`}
            icon={<CheckSquare className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            subtitle="Total platform revenue"
            icon={<DollarSign className="w-6 h-6" />}
            color="yellow"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Latest job submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">No recent jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>Suppliers awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">No pending verifications</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "yellow";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
