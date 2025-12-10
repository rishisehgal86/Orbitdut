import SupplierLayout from "@/components/SupplierLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function CurrentRates() {
  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Current Rates</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your configured rates
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This page is being updated to support the new 3-tier service level system (Same Business Day, Next Business Day, Scheduled).
            Please use the Rate Management page to configure your rates in the meantime.
          </AlertDescription>
        </Alert>
      </div>
    </SupplierLayout>
  );
}
