import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, DollarSign, FileText, MapPin, User, Link2 } from "lucide-react";

interface Job {
  id: number;
  serviceType: string;
  scheduledDateTime?: Date | null;
  estimatedDuration?: number | null;
  description?: string | null;
  siteAddress?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  calculatedPrice?: number | null;
  currency?: string | null;
  siteContactName?: string | null;
  siteContactNumber?: string | null;
  projectName?: string | null;
  changeNumber?: string | null;
  incidentNumber?: string | null;
  accessInstructions?: string | null;
  specialRequirements?: string | null;
  equipmentNeeded?: string | null;
  videoConferenceLink?: string | null;
  notes?: string | null;
}

interface JobDetailCardsProps {
  job: Job;
  viewerType: 'customer' | 'supplier';
}

export function JobDetailCards({ job, viewerType }: JobDetailCardsProps) {
  // Calculate pricing based on viewer type
  // For customers: show full price they paid (calculatedPrice)
  // For suppliers: show amount they receive (calculatedPrice - Orbidut margin)
  // Assuming 15% Orbidut margin for now (can be made configurable)
  const ORBIDUT_MARGIN_PERCENT = 15;
  const customerPrice = job.calculatedPrice ?? 0;
  const supplierAmount = viewerType === 'supplier' 
    ? Math.round(customerPrice * (1 - ORBIDUT_MARGIN_PERCENT / 100))
    : customerPrice;
  const displayPrice = viewerType === 'customer' ? customerPrice : supplierAmount;
  const hourlyRate = ((displayPrice / 100) / (job.estimatedDuration ?? 1)).toFixed(2);
  return (
    <>
      {/* Service Information & Location Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Service Type</p>
                <p className="text-sm text-muted-foreground">{job.serviceType}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Scheduled Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {job.scheduledDateTime ? new Date(job.scheduledDateTime).toLocaleString() : "Not scheduled"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Local time at service location
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Estimated Duration</p>
                <p className="text-sm text-muted-foreground">{job.estimatedDuration ?? 0} hours</p>
              </div>
            </div>
            {job.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Location & Pricing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{job.siteAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.city}, {job.country}
                  </p>
                  {job.postalCode && (
                    <p className="text-sm text-muted-foreground">{job.postalCode}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{viewerType === 'customer' ? 'Pricing Details' : 'Payment Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Hourly Rate</span>
                <span className="text-sm font-medium">
                  {job.currency ?? "USD"} {hourlyRate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">{job.estimatedDuration ?? 0} hours</span>
              </div>
              {viewerType === 'supplier' && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Customer Price</span>
                    <span className="text-sm font-medium">
                      {job.currency ?? "USD"} {(customerPrice / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Orbidut Margin ({ORBIDUT_MARGIN_PERCENT}%)</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      -{job.currency ?? "USD"} {((customerPrice - supplierAmount) / 100).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-semibold">
                    {viewerType === 'customer' ? 'Total Price' : 'You Receive'}
                  </span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {job.currency ?? "USD"} {(displayPrice / 100).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Site Contact */}
        {(job.siteContactName || job.siteContactNumber) && (
          <Card>
            <CardHeader>
              <CardTitle>Site Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.siteContactName && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Contact Name</p>
                    <p className="text-sm text-muted-foreground">{job.siteContactName}</p>
                  </div>
                </div>
              )}
              {job.siteContactNumber && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Contact Number</p>
                    <p className="text-sm text-muted-foreground">{job.siteContactNumber}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Project & Ticket Information */}
        {(job.projectName || job.changeNumber || job.incidentNumber) && (
          <Card>
            <CardHeader>
              <CardTitle>Project & Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.projectName && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Project Name</p>
                    <p className="text-sm text-muted-foreground">{job.projectName}</p>
                  </div>
                </div>
              )}
              {job.changeNumber && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Change Number</p>
                    <p className="text-sm text-muted-foreground">{job.changeNumber}</p>
                  </div>
                </div>
              )}
              {job.incidentNumber && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Incident Number</p>
                    <p className="text-sm text-muted-foreground">{job.incidentNumber}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Site Access & Requirements */}
      {(job.accessInstructions || job.specialRequirements || job.equipmentNeeded) && (
        <Card>
          <CardHeader>
            <CardTitle>Site Access & Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.accessInstructions && (
              <div>
                <p className="font-medium mb-1">Access Instructions</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.accessInstructions}</p>
              </div>
            )}
            {job.specialRequirements && (
              <div>
                <p className="font-medium mb-1">Special Requirements</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.specialRequirements}</p>
              </div>
            )}
            {job.equipmentNeeded && (
              <div>
                <p className="font-medium mb-1">Equipment Needed</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.equipmentNeeded}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Communication */}
      {(job.videoConferenceLink || job.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Communication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.videoConferenceLink && (
              <div className="flex items-start gap-3">
                <Link2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Video Conference</p>
                  <a
                    href={job.videoConferenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {job.videoConferenceLink}
                  </a>
                </div>
              </div>
            )}
            {job.notes && (
              <div>
                <p className="font-medium mb-1">Additional Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
