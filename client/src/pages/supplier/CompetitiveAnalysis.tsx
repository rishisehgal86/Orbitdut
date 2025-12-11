import SupplierLayout from "@/components/SupplierLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Globe, 
  Bell,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CompetitiveAnalysis() {
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);

  const handleNotifyMe = () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    // TODO: Save notification preference to database
    setNotified(true);
    toast.success("You'll be notified when this feature launches!");
  };

  return (
    <SupplierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Competitive Rate Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Understand your market position and optimize your pricing strategy
          </p>
        </div>

        {/* Coming Soon Banner */}
        <Alert className="border-blue-200 bg-blue-50">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 text-lg font-semibold">Coming Soon</AlertTitle>
          <AlertDescription className="text-blue-800 mt-2">
            This feature will be available once we have sufficient market data from multiple suppliers. 
            You'll be able to see how your rates compare to the market and make data-driven pricing decisions.
          </AlertDescription>
        </Alert>

        {/* Feature Preview Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Market Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <CardTitle>Market Overview</CardTitle>
              </div>
              <CardDescription>
                See average rates, ranges, and trends across all service types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Average market rates by service type and service level</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Rate distribution (minimum, maximum, median)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Market trends over time</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Position */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <CardTitle>Your Competitive Position</CardTitle>
              </div>
              <CardDescription>
                Understand where you stand compared to other suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Percentile ranking for each service type</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Above/below average indicators</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Pricing recommendations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Regional Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                <CardTitle>Regional Comparison</CardTitle>
              </div>
              <CardDescription>
                Compare your rates across different geographic regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Regional average rates for each service</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Identify your most competitive regions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Spot pricing opportunities</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pricing Strategy */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <CardTitle>Pricing Strategy Insights</CardTitle>
              </div>
              <CardDescription>
                Data-driven recommendations to optimize your rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Win rate correlation with pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Suggested rate adjustments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Competitive positioning analysis</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Notify Me Section */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle>Get Notified When This Feature Launches</CardTitle>
            </div>
            <CardDescription>
              Be the first to know when competitive rate analysis becomes available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!notified ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="notify-email" className="sr-only">Email address</Label>
                  <Input
                    id="notify-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleNotifyMe}>
                  Notify Me
                </Button>
              </div>
            ) : (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Thanks! We'll send you an email when competitive rate analysis is ready.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Why This Matters */}
        <Card>
          <CardHeader>
            <CardTitle>Why Competitive Analysis Matters</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              Understanding your competitive position is crucial for success in the marketplace. 
              With competitive rate analysis, you'll be able to:
            </p>
            <ul className="text-muted-foreground space-y-1 mt-3">
              <li><strong>Win more jobs</strong> by pricing competitively without leaving money on the table</li>
              <li><strong>Identify opportunities</strong> where you can increase rates without losing competitiveness</li>
              <li><strong>Make data-driven decisions</strong> instead of guessing at market rates</li>
              <li><strong>Track market trends</strong> and adjust your pricing strategy accordingly</li>
              <li><strong>Focus on profitable regions</strong> where your rates are most competitive</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              This feature will be automatically enabled once we have sufficient supplier data to provide 
              meaningful market insights while maintaining supplier privacy.
            </p>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}
