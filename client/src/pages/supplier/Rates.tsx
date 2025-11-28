import SupplierLayout from "@/components/SupplierLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { DollarSign, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "US", name: "United States", currency: "USD", symbol: "$" },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", symbol: "د.إ" },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "$" },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "$" },
];

export default function SupplierRates() {
  const { data: profile } = trpc.supplier.getProfile.useQuery();
  const { data: rates, isLoading, refetch } = trpc.supplier.getRates.useQuery(
    { supplierId: profile?.supplier?.id ?? 0 },
    { enabled: !!profile?.supplier?.id }
  );
  const upsertRate = trpc.supplier.upsertRate.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    country: "US",
    hourlyRate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.supplier?.id) {
      toast.error("Please complete your company profile first");
      return;
    }

    const country = COUNTRIES.find((c) => c.code === formData.country);
    if (!country) return;

    try {
      await upsertRate.mutateAsync({
        supplierId: profile.supplier.id,
        country: formData.country,
        hourlyRate: Math.round(parseFloat(formData.hourlyRate) * 100), // Convert to cents
        currency: country.currency,
      });
      toast.success("Rate saved successfully");
      setFormData({ country: "US", hourlyRate: "" });
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error("Failed to save rate");
      console.error(error);
    }
  };

  const formatCurrency = (cents: number, currencyCode: string) => {
    const country = COUNTRIES.find((c) => c.currency === currencyCode);
    const symbol = country?.symbol || "$";
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  if (!profile?.supplier) {
    return (
      <SupplierLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rates</h1>
            <p className="text-muted-foreground">
              Set your hourly rates for different countries
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                You need to complete your company profile before setting rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => (window.location.href = "/supplier/settings")}>
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </SupplierLayout>
    );
  }

  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rates</h1>
            <p className="text-muted-foreground">
              Manage your hourly rates for different countries
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Cancel" : "Add Rate"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add/Update Rate</CardTitle>
              <CardDescription>
                Set your hourly rate for a specific country
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) =>
                        setFormData({ ...formData, country: value })
                      }
                    >
                      <SelectTrigger id="country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name} ({country.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">
                      Hourly Rate <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="hourlyRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourlyRate}
                        onChange={(e) =>
                          setFormData({ ...formData, hourlyRate: e.target.value })
                        }
                        className="pl-9"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={upsertRate.isPending}>
                    {upsertRate.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Rate"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Rates</CardTitle>
            <CardDescription>
              Current hourly rates for each country you service
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : rates && rates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => {
                    const country = COUNTRIES.find((c) => c.code === rate.country);
                    return (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">
                          {country?.name || rate.country}
                        </TableCell>
                        <TableCell>{rate.currency}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(rate.hourlyRate, rate.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                country: rate.country,
                                hourlyRate: (rate.hourlyRate / 100).toString(),
                              });
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No rates configured yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Add Rate" to set your first hourly rate
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SupplierLayout>
  );
}
