import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface GuidedSetupHelperProps {
  onDismiss?: () => void;
}

export function GuidedSetupHelper({ onDismiss }: GuidedSetupHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch supplier data to determine progress
  const { data: profile } = trpc.supplier.getProfile.useQuery();
  const supplierId = profile?.supplier?.id;
  
  const { data: countries } = trpc.supplier.getCountries.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );
  const { data: rates } = trpc.supplier.getRates.useQuery(
    { supplierId: supplierId! },
    { enabled: !!supplierId }
  );

  // Calculate completion status
  const hasCompletedProfile = profile?.supplier?.verificationStatus === "verified";
  const hasSetCoverage = (countries?.length ?? 0) > 0;
  
  // Count rates by service type
  const ratesByService = {
    l1_euc: rates?.filter((r) => r.serviceType === "L1_EUC").length ?? 0,
    l1_network: rates?.filter((r) => r.serviceType === "L1_NETWORK").length ?? 0,
    smart_hands: rates?.filter((r) => r.serviceType === "SMART_HANDS").length ?? 0,
  };

  const hasSetRatesL1EUC = ratesByService.l1_euc > 0;
  const hasSetRatesL1Network = ratesByService.l1_network > 0;
  const hasSetRatesSmartHands = ratesByService.smart_hands > 0;

  const completedSteps =
    (hasCompletedProfile ? 1 : 0) +
    (hasSetCoverage ? 1 : 0) +
    (hasSetRatesL1EUC ? 1 : 0) +
    (hasSetRatesL1Network ? 1 : 0) +
    (hasSetRatesSmartHands ? 1 : 0);

  const totalSteps = 5;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
  const isComplete = completedSteps === totalSteps;

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-700">Setup Progress</div>
              <Badge variant={isComplete ? "default" : "secondary"} className="text-xs">
                {completedSteps}/{totalSteps}
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <span className="text-xs font-semibold text-blue-600">{progressPercentage}%</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-7 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {/* Step 1: Verification */}
            <div
              className="flex items-center gap-2 text-sm hover:bg-white/50 p-1.5 rounded cursor-pointer transition-colors"
              onClick={() => !hasCompletedProfile && setLocation("/supplier/verification")}
            >
              {hasCompletedProfile ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={hasCompletedProfile ? "text-gray-600" : "text-gray-900 font-medium"}>
                Verification
              </span>
              {hasCompletedProfile && (
                <Badge variant="outline" className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
                  Complete
                </Badge>
              )}
            </div>

            {/* Step 2: Coverage */}
            <div
              className="flex items-center gap-2 text-sm hover:bg-white/50 p-1.5 rounded cursor-pointer transition-colors"
              onClick={() => setLocation("/supplier/coverage")}
            >
              {hasSetCoverage ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={hasSetCoverage ? "text-gray-600" : "text-gray-900 font-medium"}>
                Coverage Areas
              </span>
              {hasSetCoverage && (
                <Badge
                  variant="outline"
                  className="ml-auto text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("/supplier/coverage");
                  }}
                >
                  {countries?.length} {countries?.length === 1 ? "country" : "countries"}
                </Badge>
              )}
            </div>

            {/* Step 3: L1 EUC Rates */}
            <div
              className="flex items-center gap-2 text-sm hover:bg-white/50 p-1.5 rounded cursor-pointer transition-colors"
              onClick={() => setLocation("/supplier/rates/management")}
            >
              {hasSetRatesL1EUC ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={hasSetRatesL1EUC ? "text-gray-600" : "text-gray-900 font-medium"}>
                L1 EUC Rates
              </span>
              {hasSetRatesL1EUC && (
                <Badge
                  variant="outline"
                  className="ml-auto text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("/supplier/rates/management");
                  }}
                >
                  {ratesByService.l1_euc} rates
                </Badge>
              )}
            </div>

            {/* Step 4: L1 Network Rates */}
            <div
              className="flex items-center gap-2 text-sm hover:bg-white/50 p-1.5 rounded cursor-pointer transition-colors"
              onClick={() => setLocation("/supplier/rates/management")}
            >
              {hasSetRatesL1Network ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={hasSetRatesL1Network ? "text-gray-600" : "text-gray-900 font-medium"}>
                L1 Network Rates
              </span>
              {hasSetRatesL1Network && (
                <Badge
                  variant="outline"
                  className="ml-auto text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("/supplier/rates/management");
                  }}
                >
                  {ratesByService.l1_network} rates
                </Badge>
              )}
            </div>

            {/* Step 5: Smart Hands Rates */}
            <div
              className="flex items-center gap-2 text-sm hover:bg-white/50 p-1.5 rounded cursor-pointer transition-colors"
              onClick={() => setLocation("/supplier/rates/management")}
            >
              {hasSetRatesSmartHands ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={hasSetRatesSmartHands ? "text-gray-600" : "text-gray-900 font-medium"}>
                Smart Hands Rates
              </span>
              {hasSetRatesSmartHands && (
                <Badge
                  variant="outline"
                  className="ml-auto text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("/supplier/rates/management");
                  }}
                >
                  {ratesByService.smart_hands} rates
                </Badge>
              )}
            </div>

            {/* Completion Message */}
            {isComplete && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                ✓ Setup complete! You're ready to accept jobs.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
