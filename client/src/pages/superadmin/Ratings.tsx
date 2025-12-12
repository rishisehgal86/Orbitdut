import { useState } from "react";
import { trpc } from "@/lib/trpc";
import SuperadminLayout from "@/components/SuperadminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, TrendingUp, Users, Info, Edit, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Ratings() {
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [newRating, setNewRating] = useState<number>(200);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"rating" | "companyName" | "createdAt">("rating");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  const utils = trpc.useUtils();

  // Fetch rating statistics
  const { data: stats, isLoading: statsLoading } = trpc.admin.getRatingStatistics.useQuery();

  // Fetch suppliers with ratings
  const { data: suppliersData, isLoading: suppliersLoading } = trpc.admin.getAllSuppliersWithRatings.useQuery({
    page: currentPage,
    pageSize: 50,
    sortBy,
    sortOrder,
  });

  // Update rating mutation
  const updateRating = trpc.admin.updateSupplierRating.useMutation({
    onSuccess: () => {
      toast({
        title: "Rating Updated",
        description: "Supplier rating has been successfully updated.",
      });
      setSelectedSupplier(null);
      setNewRating(200);
      setAdjustmentReason("");
      utils.admin.getRatingStatistics.invalidate();
      utils.admin.getAllSuppliersWithRatings.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update rating",
        variant: "destructive",
      });
    },
  });

  const handleUpdateRating = () => {
    if (!selectedSupplier) return;
    updateRating.mutate({
      supplierId: selectedSupplier,
      rating: newRating,
      reason: adjustmentReason || undefined,
    });
  };

  const openEditDialog = (supplierId: number, currentRating: number) => {
    setSelectedSupplier(supplierId);
    setNewRating(currentRating || 200);
    setAdjustmentReason("");
  };

  const formatRating = (rating: number | null) => {
    if (!rating) return "2.0";
    return (rating / 100).toFixed(1);
  };

  const getRatingBadgeVariant = (rating: number | null) => {
    if (!rating) rating = 200;
    const value = rating / 100;
    if (value >= 4.5) return "default"; // Excellent
    if (value >= 3.5) return "secondary"; // Good
    if (value >= 2.5) return "outline"; // Average
    return "destructive"; // Poor
  };

  // Filter suppliers based on search and filters
  const filteredSuppliers = suppliersData?.suppliers.filter((supplier) => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      supplier.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase());

    // Country filter
    const matchesCountry = countryFilter === "all" || supplier.country === countryFilter;

    // Rating filter
    let matchesRating = true;
    if (ratingFilter !== "all") {
      const rating = supplier.rating || 200;
      const value = rating / 100;
      switch (ratingFilter) {
        case "5.0":
          matchesRating = value === 5.0;
          break;
        case "4.0-4.9":
          matchesRating = value >= 4.0 && value < 5.0;
          break;
        case "3.0-3.9":
          matchesRating = value >= 3.0 && value < 4.0;
          break;
        case "2.0-2.9":
          matchesRating = value >= 2.0 && value < 3.0;
          break;
        case "1.0-1.9":
          matchesRating = value >= 1.0 && value < 2.0;
          break;
      }
    }

    return matchesSearch && matchesCountry && matchesRating;
  }) || [];

  // Get unique countries for filter
  const countries = Array.from(new Set(suppliersData?.suppliers.map(s => s.country).filter(Boolean))) as string[];

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Supplier Rating System</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive documentation and management of the supplier rating system
          </p>
        </div>

        {/* Rating System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Rating System Overview
            </CardTitle>
            <CardDescription>How the supplier rating system works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold">Rating Scale</h3>
              <p>
                Suppliers are rated on a scale of <strong>1.0 to 5.0</strong> (stored internally as hundredths: 100-500).
                Ratings are used to rank suppliers when matching jobs to ensure the best-rated suppliers are prioritized.
              </p>

              <h3 className="text-lg font-semibold mt-4">Default Rating Policy</h3>
              <p>
                All new suppliers start with a <strong>default rating of 2.0/5.0</strong> (stored as 200). This neutral
                starting point ensures:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>New suppliers can receive job assignments without prior performance history</li>
                <li>Established suppliers with good ratings maintain competitive advantage</li>
                <li>Fair opportunity for all suppliers to prove their service quality</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Rating Impact</h3>
              <p>
                In the job matching algorithm, supplier ratings play a critical role:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Priority 1:</strong> City coverage (priority cities rank higher than country-only coverage)</li>
                <li><strong>Priority 2:</strong> Higher rating wins (suppliers with better ratings are preferred)</li>
                <li><strong>Priority 3:</strong> Lower price wins (among suppliers with equal ratings)</li>
                <li><strong>Priority 4:</strong> Random tiebreaker (for identical rating and price)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Future Enhancements</h3>
              <p className="text-muted-foreground">
                Planned features include automatic rating adjustments based on customer feedback, job completion rates,
                response times, and quality metrics. A rating history audit trail will track all changes for transparency.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
              <p className="text-xs text-muted-foreground">Active in the system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageRating ? stats.averageRating.toFixed(2) : "2.00"}
              </div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Rated (4.0+)</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.distribution["4.0-4.9"] || 0) + (stats?.distribution["5.0"] || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Excellent performers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Attention (&lt;2.0)</CardTitle>
              <Star className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.distribution["1.0-1.9"] || 0}</div>
              <p className="text-xs text-muted-foreground">Below average</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of suppliers by rating range</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading distribution...</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats?.distribution || {}).map(([range, count]) => {
                  const total = stats?.totalSuppliers || 1;
                  const percentage = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={range} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{range} stars</span>
                        <span className="text-muted-foreground">
                          {count} suppliers ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Rating Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Rating Management</CardTitle>
            <CardDescription>View and adjust supplier ratings (admin only)</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="space-y-4 mb-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="countryFilter">Country:</Label>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger id="countryFilter" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="ratingFilter">Rating:</Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger id="ratingFilter" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5.0">5.0 Stars</SelectItem>
                      <SelectItem value="4.0-4.9">4.0 - 4.9 Stars</SelectItem>
                      <SelectItem value="3.0-3.9">3.0 - 3.9 Stars</SelectItem>
                      <SelectItem value="2.0-2.9">2.0 - 2.9 Stars</SelectItem>
                      <SelectItem value="1.0-1.9">1.0 - 1.9 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="sortBy">Sort by:</Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger id="sortBy" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="companyName">Company Name</SelectItem>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="sortOrder">Order:</Label>
                  <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                    <SelectTrigger id="sortOrder" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results count */}
              <div className="text-sm text-muted-foreground">
                Showing {filteredSuppliers.length} of {suppliersData?.suppliers.length || 0} suppliers
              </div>
            </div>

            {/* Table */}
            {suppliersLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No suppliers found matching your filters
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Contact Email</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.companyName || "N/A"}</TableCell>
                        <TableCell>{supplier.country || "N/A"}</TableCell>
                        <TableCell>{supplier.contactEmail}</TableCell>
                        <TableCell>
                          <Badge variant={getRatingBadgeVariant(supplier.rating)}>
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {formatRating(supplier.rating)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(supplier.id, supplier.rating || 200)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {suppliersData && suppliersData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {suppliersData.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(suppliersData.totalPages, p + 1))}
                    disabled={currentPage === suppliersData.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Rating Dialog */}
      <Dialog open={selectedSupplier !== null} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Supplier Rating</DialogTitle>
            <DialogDescription>
              Adjust the rating for this supplier. Changes will affect job matching priority.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1.0 - 5.0)</Label>
              <Input
                id="rating"
                type="number"
                min="100"
                max="500"
                step="10"
                value={newRating}
                onChange={(e) => setNewRating(parseInt(e.target.value) || 200)}
              />
              <p className="text-sm text-muted-foreground">
                Current value: {formatRating(newRating)} stars (stored as {newRating} hundredths)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Customer feedback, performance review, quality issues..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRating} disabled={updateRating.isPending}>
              {updateRating.isPending ? "Updating..." : "Update Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperadminLayout>
  );
}
