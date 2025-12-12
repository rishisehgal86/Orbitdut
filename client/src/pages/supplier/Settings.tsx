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
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

export default function SupplierSettings() {
  const { data: profile, isLoading, refetch } = trpc.supplier.getProfile.useQuery();
  const createProfile = trpc.supplier.createProfile.useMutation();
  const updateProfile = trpc.supplier.updateProfile.useMutation();

  const [formData, setFormData] = useState({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    country: "US",
    taxId: "",
  });



  useEffect(() => {
    if (profile?.supplier) {
      setFormData({
        companyName: profile.supplier.companyName || "",
        contactEmail: profile.supplier.contactEmail || "",
        contactPhone: profile.supplier.contactPhone || "",
        address: profile.supplier.address || "",
        city: profile.supplier.city || "",
        country: profile.supplier.country || "US",
        taxId: profile.supplier.taxId || "",
      });

    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (profile?.supplier) {
        await updateProfile.mutateAsync({
          supplierId: profile.supplier.id,
          ...formData,
        });
        toast.success("Profile updated successfully");
      } else {
        await createProfile.mutateAsync(formData);
        toast.success("Profile created successfully");
      }
      refetch();
    } catch (error) {
      toast.error("Failed to save profile");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <SupplierLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SupplierLayout>
    );
  }

  return (
    <SupplierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage your company profile and business information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>
              Update your company information to receive job offers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    Contact Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="submit"
                  disabled={createProfile.isPending || updateProfile.isPending}
                >
                  {createProfile.isPending || updateProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {profile?.supplier && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Your account verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      profile.supplier.verificationStatus === "verified"
                        ? "bg-green-500"
                        : profile.supplier.verificationStatus === "rejected"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-sm font-medium capitalize">
                    {profile.supplier.verificationStatus}
                  </span>
                </div>
                {profile.supplier.verificationStatus === "pending" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Your account is under review. You will be notified once verification is
                    complete.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SupplierLayout>
  );
}
