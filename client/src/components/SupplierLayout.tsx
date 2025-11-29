import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Home,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/supplier/dashboard", icon: Home },
  { title: "My Jobs", href: "/supplier/jobs", icon: Building2 },
  { 
    title: "Coverage", 
    href: "/supplier/coverage", 
    icon: MapPin,
    submenu: [
      { title: "Geographic Coverage", href: "/supplier/coverage" },
      { title: "Service Exclusions", href: "/supplier/coverage/exclusions" },
    ]
  },
  { 
    title: "Rates", 
    href: "/supplier/rates", 
    icon: DollarSign,
    submenu: [
      { title: "Current Rates", href: "/supplier/rates/current" },
      { title: "Rate Management", href: "/supplier/rates/manage" },
    ]
  },
  { title: "Earnings", href: "/supplier/earnings", icon: Wallet },
  { title: "Settings", href: "/supplier/settings", icon: Settings },
];

interface SupplierLayoutProps {
  children: React.ReactNode;
}

export default function SupplierLayout({ children }: SupplierLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo and Brand */}
      <div className="flex h-16 items-center border-b px-4">
        {!isCollapsed || isMobile ? (
          <Link href="/supplier/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Orbidut</span>
          </Link>
        ) : (
          <Link href="/supplier/dashboard">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
          </Link>
        )}
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || item.submenu?.some(sub => location === sub.href);

            const linkContent = (
              <div className="space-y-1">
                <Link
                  href={item.href}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border-l-4 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {(!isCollapsed || isMobile) && <span>{item.title}</span>}
                </Link>
                {item.submenu && (!isCollapsed || isMobile) && (
                  <div className="ml-8 space-y-1">
                    {item.submenu.map((subItem) => {
                      const isSubActive = location === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => isMobile && setIsMobileOpen(false)}
                          className={`block rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            isSubActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {subItem.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );

            if (isCollapsed && !isMobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                    {item.submenu && (
                      <div className="mt-1 space-y-1">
                        {item.submenu.map(sub => (
                          <div key={sub.href} className="text-xs text-muted-foreground">
                            {sub.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Profile and Logout */}
      <div className="p-4">
        {!isCollapsed || isMobile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r bg-background transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <NavContent />
        {/* Collapse Toggle */}
        <div className="flex items-center justify-center border-t p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Header and Sidebar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavContent isMobile />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Orbidut</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
