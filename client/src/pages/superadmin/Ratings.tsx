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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, TrendingUp, Users, Info, Edit, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Ratings() {
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [newRating, setNewRating] = useState<number>(200);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"rating" | "companyName" | "createdAt">("rating");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Collapsible states
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [distributionOpen, setDistributionOpen] = useState(false);

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

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortableHeader = ({ column, children }: { column: typeof sortBy; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </TableHead>
  );

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

        {/* Rating System Overview - Collapsible */}
        <Collapsible open={overviewOpen} onOpenChange={setOverviewOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Rating System Overview
                  </div>
                  {overviewOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
                <CardDescription>How the supplier rating system works</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

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

        {/* Rating Distribution Chart - Collapsible */}
        <Collapsible open={distributionOpen} onOpenChange={setDistributionOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span>Rating Distribution</span>
                  {distributionOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
                <CardDescription>Breakdown of suppliers by rating range</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Supplier Rating Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Rating Management</CardTitle>
            <CardDescription>View and adjust supplier ratings (admin only)</CardDescription>
          </CardHeader>
          <CardContent>
            {suppliersLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader column="companyName">Company Name</SortableHeader>
                        <TableHead>Country</TableHead>
                        <TableHead>Contact Email</TableHead>
                        <SortableHeader column="rating">Rating</SortableHeader>
                        <SortableHeader column="createdAt">Created</SortableHeader>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliersData?.suppliers && suppliersData.suppliers.length > 0 ? (
                        suppliersData.suppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.companyName || "N/A"}</TableCell>
                            <TableCell>{supplier.country || "N/A"}</TableCell>
                            <TableCell>{supplier.contactEmail || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={getRatingBadgeVariant(supplier.rating)}>
                                {formatRating(supplier.rating)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {supplier.createdAt
                                ? new Date(supplier.createdAt).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(supplier.id, supplier.rating || 200)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No suppliers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {suppliersData && suppliersData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {suppliersData.suppliers.length} of {suppliersData.totalCount} suppliers
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2 px-3">
                        <span className="text-sm">
                          Page {currentPage} of {suppliersData.totalPages}
                        </span>
                      </div>
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
              </>
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
              <Select
                value={newRating.toString()}
                onValueChange={(value) => setNewRating(parseInt(value))}
              >
                <SelectTrigger id="rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">1.0 - Poor</SelectItem>
                  <SelectItem value="150">1.5</SelectItem>
                  <SelectItem value="200">2.0 - Average (Default)</SelectItem>
                  <SelectItem value="250">2.5</SelectItem>
                  <SelectItem value="300">3.0 - Good</SelectItem>
                  <SelectItem value="350">3.5</SelectItem>
                  <SelectItem value="400">4.0 - Very Good</SelectItem>
                  <SelectItem value="450">4.5</SelectItem>
                  <SelectItem value="500">5.0 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this rating is being changed..."
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
