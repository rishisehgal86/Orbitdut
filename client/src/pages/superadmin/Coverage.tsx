import { useState } from "react";
import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { trpc } from "@/lib/trpc";
import { Loader2, Map as MapIcon, Table as TableIcon, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { useMemo } from "react";

export default function SuperadminCoverage() {
  const { data: coverageData, isLoading } = trpc.admin.getCoverageStats.useQuery();
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!coverageData) return null;

    // Group by country to get suppliers per country
    const byCountry = coverageData.reduce((acc, area) => {
      if (!acc[area.countryCode]) {
        acc[area.countryCode] = {
          suppliers: new Set<string>(),
          supplierIds: new Set<number>(),
        };
      }
      if (area.companyName) {
        acc[area.countryCode].suppliers.add(area.companyName);
      }
      acc[area.countryCode].supplierIds.add(area.supplierId);
      return acc;
    }, {} as Record<string, { suppliers: Set<string>; supplierIds: Set<number> }>);

    // Group by supplier to get countries per supplier
    const bySupplier = coverageData.reduce((acc, area) => {
      const name = area.companyName || "Unknown";
      if (!acc[name]) {
        acc[name] = {
          countries: new Set<string>(),
        };
      }
      acc[name].countries.add(area.countryCode);
      return acc;
    }, {} as Record<string, { countries: Set<string> }>);

    // Note: region and city data not available in current schema
    const regions: string[] = [];
    const cities: string[] = [];

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

    const suppliers = Array.from(new Set(coverageData.map(a => a.companyName).filter(Boolean)));
    const regions = Array.from(new Set(coverageData.map(a => a.countryCode)));

    const matrix = suppliers.map(supplier => {
      const supplierAreas = coverageData.filter(a => a.companyName === supplier);
      const coverage = regions.map(countryCode => {
        return supplierAreas.some(a => a.countryCode === countryCode);
      });
      return { supplier, coverage };
    });

    return { matrix, regions };
  }, [coverageData]);

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(country)) {
        newSet.delete(country);
      } else {
        newSet.add(country);
      }
      return newSet;
    });
  };

  const toggleSupplier = (supplier: string) => {
    setExpandedSuppliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplier)) {
        newSet.delete(supplier);
      } else {
        newSet.add(supplier);
      }
      return newSet;
    });
  };

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
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="matrix">
              <TableIcon className="w-4 h-4 mr-2" />
              Coverage Matrix
            </TabsTrigger>
          </TabsList>

          {/* Coverage Matrix View */}
          <TabsContent value="matrix">
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
                          {coverageMatrix.regions.map((countryCode, idx) => (
                            <TableHead key={idx} className="text-center min-w-[100px]">
                              {countryCode}
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
              {/* By Country - Show Suppliers Count */}
              <Card>
                <CardHeader>
                  <CardTitle>Coverage by Country</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics?.byCountry || {})
                      .sort(([, a], [, b]) => b.supplierIds.size - a.supplierIds.size)
                      .map(([country, data]) => (
                        <Collapsible
                          key={country}
                          open={expandedCountries.has(country)}
                          onOpenChange={() => toggleCountry(country)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                              <div className="flex items-center gap-2">
                                {expandedCountries.has(country) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium">{country}</span>
                              </div>
                              <Badge>{data.supplierIds.size} suppliers</Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-6 mt-2 space-y-1 text-sm text-muted-foreground">
                              {Array.from(data.suppliers).map((supplier, idx) => (
                                <div key={idx} className="py-1">• {supplier}</div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Supplier - Show Countries Count */}
              <Card>
                <CardHeader>
                  <CardTitle>Coverage by Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics?.bySupplier || {})
                      .sort(([, a], [, b]) => b.countries.size - a.countries.size)
                      .map(([supplier, data]) => (
                        <Collapsible
                          key={supplier}
                          open={expandedSuppliers.has(supplier)}
                          onOpenChange={() => toggleSupplier(supplier)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                              <div className="flex items-center gap-2">
                                {expandedSuppliers.has(supplier) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium truncate max-w-[200px]">{supplier}</span>
                              </div>
                              <Badge>{data.countries.size} countries</Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-6 mt-2 space-y-1 text-sm text-muted-foreground">
                              {Array.from(data.countries).map((country, idx) => (
                                <div key={idx} className="py-1">• {country}</div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
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
                        <TableHead>Country Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coverageData?.map((area, idx) => (
                        <TableRow key={`${area.supplierId}-${area.countryCode}-${idx}`}>
                          <TableCell className="font-medium">{area.companyName || "N/A"}</TableCell>
                          <TableCell>{area.countryCode}</TableCell>
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
