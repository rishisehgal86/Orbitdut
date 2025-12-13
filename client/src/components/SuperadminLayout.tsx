import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Users, Building2, Briefcase, Map, LayoutDashboard, LogOut, Star, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Redirect if not superadmin
  if (!loading && (!user || user.role !== "superadmin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">Superadmin access required</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
    { name: "Verifications", href: "/superadmin/verifications", icon: Shield },
    { name: "Manual Verification", href: "/superadmin/verifications/manual", icon: ShieldCheck, isSubItem: true },
    { name: "Suppliers", href: "/superadmin/suppliers", icon: Building2 },
    { name: "Users", href: "/superadmin/users", icon: Users },
    { name: "Jobs", href: "/superadmin/jobs", icon: Briefcase },
    { name: "Coverage", href: "/superadmin/coverage", icon: Map },
    { name: "Ratings", href: "/superadmin/ratings", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-purple-900 to-indigo-900 text-white">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-purple-700">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">Superadmin</h1>
                <p className="text-sm text-purple-200">Orbidut</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/superadmin" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      item.isSubItem ? "ml-6 text-sm" : ""
                    } ${
                      isActive
                        ? "bg-white/20 text-white font-medium"
                        : "text-purple-100 hover:bg-white/10"
                    }`}
                  >
                    <item.icon className={item.isSubItem ? "w-4 h-4" : "w-5 h-5"} />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-purple-700">
            <div className="mb-3 px-4">
              <p className="text-sm text-purple-200">Signed in as</p>
              <p className="font-medium truncate">{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full bg-transparent border-purple-400 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
