import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Upload, X, FileText, CheckCircle2 } from "lucide-react";

interface SiteVisitReportFormProps {
  jobToken: string;
  onSuccess: () => void;
}

export function SiteVisitReportForm({ jobToken, onSuccess }: SiteVisitReportFormProps) {
  const [workCompleted, setWorkCompleted] = useState("");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const signatureRef = useRef<SignatureCanvas>(null);

  const submitReportMutation = trpc.jobs.submitSiteVisitReport.useMutation({
    onSuccess: () => {
      toast.success("Site visit report submitted successfully!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to submit report: ${error.message}`);
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    const signatureDataUrl = signatureRef.current.toDataURL();

    // Convert photos to base64
    const photoPromises = photos.map((photo) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(photo);
      });
    });

    const photoDataUrls = await Promise.all(photoPromises);

    submitReportMutation.mutate({
      token: jobToken,
      workCompleted,
      findings,
      recommendations,
      customerName,
      signatureDataUrl,
      photos: photoDataUrls,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Site Visit Report
        </CardTitle>
        <CardDescription>Complete this form to finalize the job</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workCompleted">Work Completed *</Label>
            <Textarea
              id="workCompleted"
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
              placeholder="Describe the work that was completed..."
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="findings">Findings</Label>
            <Textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Any issues or observations..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Recommendations for future maintenance or follow-up..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photos">Photos</Label>
            <div className="flex items-center gap-2">
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => document.getElementById("photos")?.click()}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative border rounded-lg p-2 flex items-center gap-2">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <span className="text-sm truncate flex-1">{photo.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Customer Signature *</Label>
            <div className="border rounded-lg p-2 bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: "w-full h-40 border rounded",
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                Clear Signature
              </Button>
              <p className="text-xs text-muted-foreground">Sign above</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name for signature"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitReportMutation.isPending}>
            {submitReportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Submit Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
