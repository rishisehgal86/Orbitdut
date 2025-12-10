import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Clock, Eye } from "lucide-react";
import { Link } from "wouter";

export default function AdminVerifications() {
  const { data: verifications, isLoading } = trpc.admin.getPendingVerifications.useQuery();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Supplier Verifications</h1>
          <p className="text-gray-600 mt-1">Review and approve supplier applications</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Verifications</CardTitle>
            <CardDescription>
              {verifications?.length || 0} supplier{verifications?.length !== 1 ? "s" : ""} awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : verifications && verifications.length > 0 ? (
              <div className="space-y-4">
                {verifications.map((verification: any) => (
                  <div
                    key={verification.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{verification.companyName}</h3>
                      <p className="text-sm text-gray-600">{verification.contactEmail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Submitted{" "}
                          {verification.submittedAt
                            ? new Date(verification.submittedAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          verification.status === "pending_review"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {verification.status.replace(/_/g, " ")}
                      </span>
                      <Button asChild size="sm">
                        <Link href={`/admin/verifications/${verification.supplierId}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending verifications</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
