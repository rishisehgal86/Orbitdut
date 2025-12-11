import SupplierLayout from "@/components/SupplierLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  MapPin, 
  Target, 
  Users, 
  BarChart3,
  Bell,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CoverageIntelligence() {
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
          <h1 className="text-3xl font-bold">Coverage Intelligence</h1>
          <p className="text-muted-foreground mt-2">
            Strategic market insights to help you expand coverage profitably
          </p>
        </div>

        {/* Coming Soon Banner */}
        <Alert className="border-blue-200 bg-blue-50">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 text-lg font-semibold">Coming Soon</AlertTitle>
          <AlertDescription className="text-blue-800 mt-2">
            This feature will be available once we have sufficient market data from customer requests and supplier coverage patterns. 
            You'll be able to make data-driven expansion decisions with market insights and demand analytics.
          </AlertDescription>
        </Alert>

        {/* Feature Preview Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Demand Heatmap */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <CardTitle>Demand Heatmap</CardTitle>
              </div>
              <CardDescription>
                Visualize where customer service requests are concentrated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Real-time demand patterns across regions, cities, and neighborhoods</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Identify service request hot spots</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Track demand trends over time</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Coverage Gap Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                <CardTitle>Coverage Gap Analysis</CardTitle>
              </div>
              <CardDescription>
                Discover underserved regions with high customer demand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Find opportunities where you can be first to market</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Identify regions with limited supplier coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Prioritize expansion based on opportunity size</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Expansion Opportunities */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <CardTitle>Expansion Opportunities</CardTitle>
              </div>
              <CardDescription>
                AI-powered recommendations for profitable new markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Recommendations based on demand trends and competition</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Consider your existing coverage for optimal expansion</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Revenue potential estimates for new markets</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Competitor Coverage */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle>Competitor Coverage</CardTitle>
              </div>
              <CardDescription>
                Benchmark your coverage against the market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Anonymized data on where other suppliers operate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Compare response times and service offerings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Identify competitive advantages in your coverage</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Market Saturation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <CardTitle>Market Saturation Analysis</CardTitle>
              </div>
              <CardDescription>
                Understand competition density by region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Identify oversaturated markets to avoid</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Find underserved areas with growth potential</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>Optimize your coverage strategy</span>
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
              Be the first to know when coverage intelligence becomes available
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
                  Thanks! We'll send you an email when coverage intelligence is ready.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Why This Matters */}
        <Card>
          <CardHeader>
            <CardTitle>Why Coverage Intelligence Matters</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              Strategic coverage decisions are crucial for maximizing revenue and minimizing risk. 
              With coverage intelligence, you'll be able to:
            </p>
            <ul className="text-muted-foreground space-y-1 mt-3">
              <li><strong>Maximize revenue</strong> by expanding into high-demand areas where customers are actively seeking services</li>
              <li><strong>Reduce risk</strong> by avoiding oversaturated markets and focusing on regions with proven demand</li>
              <li><strong>Make data-driven decisions</strong> instead of guessing where to expand next</li>
              <li><strong>Stay competitive</strong> by understanding market dynamics and positioning yourself strategically</li>
              <li><strong>Optimize resources</strong> by prioritizing expansion efforts in the most promising markets</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              This feature will be automatically enabled once we have sufficient marketplace data to provide 
              meaningful insights while maintaining supplier privacy.
            </p>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}
