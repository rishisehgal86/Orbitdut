import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { getCountryName } from "@shared/countries";
import { Loader2, Map as MapIcon, Table as TableIcon, BarChart3, ChevronDown, ChevronRight, ArrowUpDown, Search, Download } from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

type SortField = "country" | "supplier" | "count";
type SortOrder = "asc" | "desc";

export default function SuperadminCoverage() {
  const { data: coverageData, isLoading } = trpc.admin.getCoverageStats.useQuery();
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [sortFieldCountry, setSortFieldCountry] = useState<SortField>("count");
  const [sortOrderCountry, setSortOrderCountry] = useState<SortOrder>("desc");
  const [sortFieldSupplier, setSortFieldSupplier] = useState<SortField>("count");
  const [sortOrderSupplier, setSortOrderSupplier] = useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Sorted country entries
  const sortedCountries = useMemo(() => {
    if (!analytics?.byCountry) return [];
    
    let entries = Object.entries(analytics.byCountry);
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(([country, data]) => {
        const countryName = getCountryName(country).toLowerCase();
        const supplierNames = Array.from(data.suppliers).join(' ').toLowerCase();
        return countryName.includes(term) || supplierNames.includes(term);
      });
    }
    
    return entries.sort(([countryA, dataA], [countryB, dataB]) => {
      let aVal: any = sortFieldCountry === "country" ? countryA : dataA.supplierIds.size;
      let bVal: any = sortFieldCountry === "country" ? countryB : dataB.supplierIds.size;
      
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortOrderCountry === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrderCountry === "asc" ? 1 : -1;
      return 0;
    });
  }, [analytics?.byCountry, sortFieldCountry, sortOrderCountry, searchTerm]);

  // Sorted supplier entries
  const sortedSuppliers = useMemo(() => {
    if (!analytics?.bySupplier) return [];
    
    let entries = Object.entries(analytics.bySupplier);
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(([supplier, data]) => {
        const supplierName = supplier.toLowerCase();
        const countryNames = Array.from(data.countries).map(c => getCountryName(c)).join(' ').toLowerCase();
        return supplierName.includes(term) || countryNames.includes(term);
      });
    }
    
    return entries.sort(([supplierA, dataA], [supplierB, dataB]) => {
      let aVal: any = sortFieldSupplier === "supplier" ? supplierA : dataA.countries.size;
      let bVal: any = sortFieldSupplier === "supplier" ? supplierB : dataB.countries.size;
      
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortOrderSupplier === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrderSupplier === "asc" ? 1 : -1;
      return 0;
    });
  }, [analytics?.bySupplier, sortFieldSupplier, sortOrderSupplier, searchTerm]);

  // Coverage matrix: suppliers x regions
  const coverageMatrix = useMemo(() => {
    if (!coverageData) return null;

    let suppliers = Array.from(new Set(coverageData.map(a => a.companyName).filter(Boolean)));
    let regions = Array.from(new Set(coverageData.map(a => a.countryCode)));

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      suppliers = suppliers.filter(s => s?.toLowerCase().includes(term));
      regions = regions.filter(r => getCountryName(r).toLowerCase().includes(term));
    }

    const matrix = suppliers.map(supplier => {
      const supplierAreas = coverageData.filter(a => a.companyName === supplier);
      const coverage = regions.map(countryCode => {
        return supplierAreas.some(a => a.countryCode === countryCode);
      });
      return { supplier, coverage };
    });

    return { matrix, regions };
  }, [coverageData, searchTerm]);

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

  const handleSortCountry = (field: SortField) => {
    if (sortFieldCountry === field) {
      setSortOrderCountry(sortOrderCountry === "asc" ? "desc" : "asc");
    } else {
      setSortFieldCountry(field);
      setSortOrderCountry("asc");
    }
  };

  const handleSortSupplier = (field: SortField) => {
    if (sortFieldSupplier === field) {
      setSortOrderSupplier(sortOrderSupplier === "asc" ? "desc" : "asc");
    } else {
      setSortFieldSupplier(field);
      setSortOrderSupplier("asc");
    }
  };

  const handleExportToExcel = () => {
    if (!coverageData) return;

    // Prepare data for Excel
    const exportData = coverageData.map(area => ({
      "Supplier Name": area.companyName || "N/A",
      "Country Code": area.countryCode,
      "Country Name": getCountryName(area.countryCode),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Supplier Name
      { wch: 15 }, // Country Code
      { wch: 25 }, // Country Name
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coverage Data");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `orbidut-coverage-${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
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
          <h1 className="text-3xl font-bold tracking-tight">Coverage Analytics</h1>
          <p className="text-muted-foreground">Monitor supplier coverage across regions and countries</p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Object.keys(analytics?.byCountry || {}).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Object.keys(analytics?.bySupplier || {}).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.totalRegions || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.totalCities || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            Export Coverage to Excel
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by supplier name or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
                    <TooltipProvider>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky left-0 bg-background">Supplier</TableHead>
                            {coverageMatrix.regions.map((countryCode, idx) => (
                              <TableHead key={idx} className="text-center min-w-[100px]">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">{countryCode}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{getCountryName(countryCode)}</p>
                                  </TooltipContent>
                                </Tooltip>
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
                    </TooltipProvider>
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
                  <div className="flex items-center justify-between">
                    <CardTitle>Coverage by Country</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSortCountry("country")}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                      >
                        Name <ArrowUpDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleSortCountry("count")}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                      >
                        Count <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedCountries.map(([country, data]) => (
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
                              <span className="font-medium">{getCountryName(country)}</span>
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
                  <div className="flex items-center justify-between">
                    <CardTitle>Coverage by Supplier</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSortSupplier("supplier")}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                      >
                        Name <ArrowUpDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleSortSupplier("count")}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                      >
                        Count <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedSuppliers.map(([supplier, data]) => (
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


            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SuperadminLayout>
  );
}
