import SupplierLayout from "@/components/SupplierLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Briefcase, CheckCircle, Clock, DollarSign } from "lucide-react";

export default function SupplierDashboard() {
  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your supplier portal. Manage your jobs, rates, and coverage areas.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No active jobs at the moment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No pending job offers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">All-time completed jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Total earnings to date</p>
            </CardContent>
          </Card>
        </div>

        {/* Setup Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Complete these steps to start receiving job offers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 rounded-lg border p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Complete your company profile</p>
                <p className="text-sm text-muted-foreground">
                  Add your business information to verify your account
                </p>
              </div>
              <Link href="/supplier/settings">
                <Button variant="outline" size="sm">
                  Setup
                </Button>
              </Link>
            </div>

            <div className="flex items-start gap-4 rounded-lg border p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Set your service rates</p>
                <p className="text-sm text-muted-foreground">
                  Define your hourly rates for different countries
                </p>
              </div>
              <Link href="/supplier/rates">
                <Button variant="outline" size="sm">
                  Setup
                </Button>
              </Link>
            </div>

            <div className="flex items-start gap-4 rounded-lg border p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Define your coverage area</p>
                <p className="text-sm text-muted-foreground">
                  Specify the geographic regions where you provide services
                </p>
              </div>
              <Link href="/supplier/coverage">
                <Button variant="outline" size="sm">
                  Setup
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest job updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your job updates will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}
