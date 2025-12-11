import { useState } from "react";
import SupplierLayout from "@/components/SupplierLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  MapPin, 
  Target, 
  Users, 
  BarChart3,
  Bell,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

function CoverageIntelligence() {
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);

  const handleNotifyMe = () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // TODO: Save email to database for notification list
    setNotified(true);
    toast.success("You'll be notified when Coverage Intelligence launches!");
  };

  const features = [
    {
      icon: MapPin,
      title: "Demand Heatmap",
      description: "Visualize where customer service requests are concentrated across regions, cities, and neighborhoods. See real-time demand patterns to identify hot spots.",
      color: "text-red-500"
    },
    {
      icon: Target,
      title: "Coverage Gap Analysis",
      description: "Discover underserved regions with high customer demand but limited supplier coverage. Find opportunities where you can be first to market.",
      color: "text-orange-500"
    },
    {
      icon: TrendingUp,
      title: "Expansion Opportunities",
      description: "Get AI-powered recommendations for profitable new markets to enter based on demand trends, competition levels, and your existing coverage.",
      color: "text-green-500"
    },
    {
      icon: Users,
      title: "Competitor Coverage",
      description: "See anonymized data on where other suppliers are operating, their response times, and service offerings. Benchmark your coverage against the market.",
      color: "text-blue-500"
    },
    {
      icon: BarChart3,
      title: "Market Saturation Analysis",
      description: "Understand competition density by region. Identify oversaturated markets to avoid and underserved areas with growth potential.",
      color: "text-purple-500"
    }
  ];

  return (
    <SupplierLayout>
      <div className="space-y-6">
        {/* Coming Soon Banner */}
        <Alert className="border-blue-200 bg-blue-50">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Coverage Intelligence - Coming Soon</h3>
                <p className="text-sm">
                  Make data-driven expansion decisions with market insights and demand analytics. 
                  This premium feature will be available once we have sufficient marketplace data 
                  from customer requests and supplier coverage patterns.
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Coverage Intelligence</h1>
          <p className="text-muted-foreground mt-2">
            Strategic market insights to help you expand coverage profitably
          </p>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gray-100 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Email Notification Signup */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Get Notified When Coverage Intelligence Launches
            </CardTitle>
            <CardDescription>
              Be among the first to access these powerful market insights and gain a competitive advantage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notified ? (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="h-5 w-5" />
                <span>You're on the list! We'll email you when this feature launches.</span>
              </div>
            ) : (
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNotifyMe();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleNotifyMe} className="px-6">
                  Notify Me
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Why This Matters */}
        <Card>
          <CardHeader>
            <CardTitle>Why Coverage Intelligence Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">Maximize Revenue</h4>
                <p className="text-sm text-muted-foreground">
                  Expand into high-demand areas where customers are actively seeking services
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Reduce Risk</h4>
                <p className="text-sm text-muted-foreground">
                  Avoid oversaturated markets and focus on regions with proven demand
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-600">Stay Competitive</h4>
                <p className="text-sm text-muted-foreground">
                  Understand market dynamics and position yourself strategically
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}

export default CoverageIntelligence;
