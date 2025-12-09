import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Loader2, Map as MapIcon, Table as TableIcon, BarChart3 } from "lucide-react";
import { useMemo } from "react";

export default function SuperadminCoverage() {
  const { data: coverageData, isLoading } = trpc.admin.getCoverageStats.useQuery();

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!coverageData) return null;

    const byCountry = coverageData.reduce((acc, area) => {
      acc[area.country] = (acc[area.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySupplier = coverageData.reduce((acc, area) => {
      const name = area.companyName || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const regions = [...new Set(coverageData.map(a => a.region).filter(Boolean))];
    const cities = [...new Set(coverageData.map(a => a.city).filter(Boolean))];

    return {
      byCountry,
      bySupplier,
      totalRegions: regions.length,
      totalCities: cities.length,
      totalAreas: coverageData.length,
    };
  }, [coverageData]);

  // Coverage matrix: suppliers x regions
  const coverageMatrix = useMemo(() => {
    if (!coverageData) return null;

    const suppliers = [...new Set(coverageData.map(a => a.companyName).filter(Boolean))];
    const regions = [...new Set(coverageData.map(a => `${a.country}-${a.region || "General"}`))];

    const matrix = suppliers.map(supplier => {
      const supplierAreas = coverageData.filter(a => a.companyName === supplier);
      const coverage = regions.map(region => {
        const [country, regionName] = region.split("-");
        return supplierAreas.some(a => 
          a.country === country && (a.region === regionName || (!a.region && regionName === "General"))
        );
      });
      return { supplier, coverage };
    });

    return { matrix, regions };
  }, [coverageData]);

  if (isLoading) {
    return (
      <SuperadminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </SuperadminLayout>
    );
  }

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coverage Visualization</h1>
          <p className="text-muted-foreground">Analyze supplier coverage across all regions</p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Coverage Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.totalAreas || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Object.keys(analytics?.byCountry || {}).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.totalRegions || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.totalCities || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map">
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="table">
              <TableIcon className="w-4 h-4 mr-2" />
              Coverage Matrix
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Map View */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Coverage Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Map visualization coming soon</p>
                  <p className="text-sm text-gray-500">
                    This will show all supplier coverage areas overlaid on an interactive map
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Coverage Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                {coverageMatrix && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background">Supplier</TableHead>
                          {coverageMatrix.regions.map((region, idx) => (
                            <TableHead key={idx} className="text-center min-w-[100px]">
                              {region.split("-")[1]}
                              <div className="text-xs text-muted-foreground">{region.split("-")[0]}</div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coverageMatrix.matrix.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="sticky left-0 bg-background font-medium">
                              {row.supplier}
                            </TableCell>
                            {row.coverage.map((covered, colIdx) => (
                              <TableCell key={colIdx} className="text-center">
                                {covered ? (
                                  <Badge className="bg-green-500">✓</Badge>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2">
              {/* By Country */}
              <Card>
                <CardHeader>
                  <CardTitle>Coverage by Country</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics?.byCountry || {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([country, count]) => (
                        <div key={country} className="flex items-center justify-between">
                          <span className="font-medium">{country}</span>
                          <Badge>{count} areas</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Supplier */}
              <Card>
                <CardHeader>
                  <CardTitle>Coverage by Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics?.bySupplier || {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([supplier, count]) => (
                        <div key={supplier} className="flex items-center justify-between">
                          <span className="font-medium truncate max-w-[200px]">{supplier}</span>
                          <Badge>{count} areas</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Coverage Areas */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>All Coverage Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Postal Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coverageData?.map((area) => (
                        <TableRow key={area.id}>
                          <TableCell className="font-medium">{area.companyName || "N/A"}</TableCell>
                          <TableCell>{area.country}</TableCell>
                          <TableCell>{area.region || "-"}</TableCell>
                          <TableCell>{area.city || "-"}</TableCell>
                          <TableCell>{area.postalCode || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SuperadminLayout>
  );
}
