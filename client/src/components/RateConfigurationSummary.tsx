import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { SERVICE_TYPE_LABELS } from "../../../shared/rates";
import { Loader2 } from "lucide-react";

interface RateConfigurationSummaryProps {
  supplierId: number;
}

export function RateConfigurationSummary({ supplierId }: RateConfigurationSummaryProps) {
  const { data: stats, isLoading } = trpc.supplier.getRateCompletionStats.useQuery({ supplierId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate Configuration Summary</CardTitle>
          <CardDescription>Track your progress and quickly identify missing rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Configuration Summary</CardTitle>
        <CardDescription>Track your progress and quickly identify missing rates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Overall Progress</h3>
            <span className="text-2xl font-bold text-primary">{stats.percentage.toFixed(1)}%</span>
          </div>
          <Progress value={stats.percentage} className="h-3 mb-2" />
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Rates</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">{stats.configured}</p>
              <p className="text-sm text-muted-foreground">Configured</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-600">{stats.missing}</p>
              <p className="text-sm text-muted-foreground">Missing</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-500">{stats.excluded}</p>
              <p className="text-sm text-muted-foreground">Excluded</p>
            </div>
          </div>
        </div>

        {/* Progress by Location Type */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Progress by Location Type</h3>
          <div className="space-y-3">
            {stats.byLocationType.map((locType: { locationType: 'countries' | 'cities'; total: number; configured: number; percentage: number }) => (
              <div key={locType.locationType}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">
                    {locType.locationType === 'countries' ? 'Country Rates' : 'Priority City Rates'}
                  </span>
                  <span className="text-sm font-semibold">
                    {locType.configured}/{locType.total} ({locType.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={locType.percentage} 
                  className={`h-2 ${locType.locationType === 'countries' ? 'bg-blue-100' : 'bg-green-100'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Progress by Service Type */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Progress by Service Type</h3>
          <div className="space-y-3">
            {stats.byServiceType.map((serviceType: { serviceType: string; total: number; configured: number; percentage: number }) => {
              const label = SERVICE_TYPE_LABELS[serviceType.serviceType as keyof typeof SERVICE_TYPE_LABELS] || serviceType.serviceType;
              const colorClass = 
                serviceType.serviceType === 'L1_EUC' ? 'bg-purple-100' :
                serviceType.serviceType === 'L1_NETWORK' ? 'bg-orange-100' :
                'bg-cyan-100';
              
              return (
                <div key={serviceType.serviceType}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm font-semibold">
                      {serviceType.configured}/{serviceType.total} ({serviceType.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress 
                    value={serviceType.percentage} 
                    className={`h-2 ${colorClass}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
