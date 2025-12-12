import { useState, useEffect } from "react";
import SupplierLayout from "@/components/SupplierLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Clock, DollarSign, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OutOfHours() {
  const { data: profile, refetch } = trpc.supplier.getProfile.useQuery();
  const [offersOutOfHours, setOffersOutOfHours] = useState(true); // Default enabled
  const updateOOH = trpc.supplier.updateOutOfHoursAvailability.useMutation();

  useEffect(() => {
    if (profile?.supplier) {
      setOffersOutOfHours(profile.supplier.offersOutOfHours === 1);
    }
  }, [profile]);

  if (!profile?.supplier) {
    return (
      <SupplierLayout>
        <div className="p-6">Loading...</div>
      </SupplierLayout>
    );
  }

  return (
    <SupplierLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Moon className="h-8 w-8" />
            Out-of-Hours Services
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your availability for bookings outside standard business hours
          </p>
        </div>

        {/* Main OOH Toggle Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Availability</CardTitle>
            <CardDescription>
              Enable or disable out-of-hours service bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ooh-toggle" className="text-base font-medium">
                  Accept Out-of-Hours Bookings
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive job requests for evenings and weekends
                </p>
              </div>
              <Switch
                id="ooh-toggle"
                checked={offersOutOfHours}
                onCheckedChange={async (checked) => {
                  try {
                    await updateOOH.mutateAsync({
                      supplierId: profile.supplier.id,
                      offersOutOfHours: checked,
                    });
                    setOffersOutOfHours(checked);
                    toast.success(
                      checked
                        ? "Out-of-hours services enabled"
                        : "Out-of-hours services disabled"
                    );
                    refetch();
                  } catch (error) {
                    toast.error("Failed to update OOH availability");
                    console.error(error);
                  }
                }}
                disabled={updateOOH.isPending}
              />
            </div>

            {!offersOutOfHours && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You will not receive job requests for bookings outside standard business hours (9 AM - 5 PM, Monday-Friday).
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Business Hours Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Standard Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Weekdays</span>
                <span className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Weekends</span>
                <span className="text-sm text-muted-foreground">Considered out-of-hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Timezone</span>
                <span className="text-sm text-muted-foreground">Based on job site location</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Pricing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Premium Pricing
            </CardTitle>
            <CardDescription>
              Automatic surcharge for out-of-hours bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">OOH Premium Rate</span>
                <span className="text-2xl font-bold text-primary">+25%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A flat 25% surcharge is automatically applied to all jobs outside standard business hours.
              </p>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <strong>What counts as out-of-hours:</strong>
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 mt-1 ml-4">
                  <li>• Weekend bookings (Saturday or Sunday)</li>
                  <li>• Start times before 9 AM or after 5 PM</li>
                  <li>• Work that extends beyond 5 PM</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}
