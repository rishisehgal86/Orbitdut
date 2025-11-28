import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, CheckCircle, Clock, DollarSign, MapPin, Shield, Users } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Orbidut</span>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/customer/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/customer/request-service">
                  <Button>Request Service</Button>
                </Link>
              </>
            ) : (
              <>
                <a href="#how-it-works">
                  <Button variant="ghost">How It Works</Button>
                </a>
                <Link href="/supplier/dashboard">
                  <Button variant="ghost">Become a Supplier</Button>
                </Link>
                <Link href="/login">
                  <Button>Sign In</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1">
        <div className="container py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Connect with Trusted Service Providers{" "}
              <span className="text-primary">Instantly</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Orbidut is a marketplace that connects customers with verified service suppliers
              through dynamic pricing, geographic matching, and instant job distribution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/customer/request-service">
                  <Button size="lg" className="gap-2">
                    Request a Service
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                  <a href="#how-it-works">
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container py-16 bg-muted/30">
          <div className="mx-auto max-w-5xl">
            <div id="how-it-works" className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight">How Orbidut Works</h2>
              <p className="text-muted-foreground">
                Our platform makes it easy to find and hire service providers in your area
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <MapPin className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Geographic Matching</CardTitle>
                  <CardDescription>
                    We automatically match you with suppliers in your area based on their
                    coverage zones
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <DollarSign className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Transparent Pricing</CardTitle>
                  <CardDescription>
                    Get instant price quotes based on supplier rates, time, and location
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>First Come, First Served</CardTitle>
                  <CardDescription>
                    Jobs are distributed fairly to available suppliers on a FCFS basis
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Verified Suppliers</CardTitle>
                  <CardDescription>
                    All suppliers are verified and background-checked for your safety
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Real-time Updates</CardTitle>
                  <CardDescription>
                    Track your service request from acceptance to completion in real-time
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Building2 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Secure Payments</CardTitle>
                  <CardDescription>
                    Payments are held securely and released only when the job is completed
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container py-16">
          <div className="mx-auto max-w-3xl">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Whether you need a service or want to provide one, Orbidut has you covered
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link href="/customer/request-service">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                      Request a Service
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/supplier/dashboard">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                      >
                        Become a Supplier
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-semibold">Orbidut</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Orbidut. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
