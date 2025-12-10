import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, FileText, Image as ImageIcon } from "lucide-react";

interface SiteVisitReportData {
  id: number;
  visitDate: Date;
  engineerName: string;
  timeOnsite?: string | null;
  timeLeftSite?: string | null;
  issueFault?: string | null;
  actionsPerformed: string | null;
  recommendations?: string | null;
  issueResolved: boolean | null;
  contactAgreed: boolean | null;
  clientSignatory?: string | null;
  clientSignatureData?: string | null;
  signedAt?: Date | null;
  photos?: Array<{
    id: number;
    svrId: number;
    fileKey: string;
    fileUrl: string;
    fileName: string;
    fileType: "image" | "video";
    mimeType: string;
    fileSize: number;
    createdAt: Date;
  } | null>;
}

interface SiteVisitReportProps {
  report: SiteVisitReportData;
}

export function SiteVisitReport({ report }: SiteVisitReportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Site Visit Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Tracking */}
        {(report.timeOnsite || report.timeLeftSite) && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Engineer On-Site Time</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {report.timeOnsite && (
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Arrived On Site</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">Local: {new Date(report.timeOnsite).toLocaleString()}</p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">UTC: {new Date(report.timeOnsite).toUTCString()}</p>
                </div>
              )}
              {report.timeLeftSite && (
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Left Site</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">Local: {new Date(report.timeLeftSite).toLocaleString()}</p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">UTC: {new Date(report.timeLeftSite).toUTCString()}</p>
                </div>
              )}
            </div>
            {report.timeOnsite && report.timeLeftSite && (
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-800 dark:text-blue-200">Total Time On Site</p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  {(() => {
                    const start = new Date(report.timeOnsite);
                    const end = new Date(report.timeLeftSite);
                    const diffMs = end.getTime() - start.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h ${minutes}m`;
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
        {/* Visit Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Visit Date</p>
            <p className="text-sm">{new Date(report.visitDate).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Engineer</p>
            <p className="text-sm">{report.engineerName}</p>
          </div>
        </div>

        {/* Issue/Fault */}
        {report.issueFault && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Issue/Fault Found</p>
            <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{report.issueFault}</p>
          </div>
        )}

        {/* Actions Performed */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Actions Performed</p>
          <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{report.actionsPerformed}</p>
        </div>

        {/* Recommendations */}
        {report.recommendations && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Recommendations</p>
            <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{report.recommendations}</p>
          </div>
        )}

        {/* Resolution & Agreement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {report.issueResolved ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <p className="text-sm">Issue Resolved</p>
          </div>
          <div className="flex items-center gap-2">
            {report.contactAgreed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <p className="text-sm">Customer Agreed to Work</p>
          </div>
        </div>

        {/* Signature */}
        {report.clientSignatureData && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Customer Signature</p>
            <div className="bg-muted rounded-md p-4 flex flex-col items-center">
              <img src={report.clientSignatureData} alt="Customer Signature" className="max-w-full h-auto bg-white shadow-sm" />
              {report.clientSignatory && (
                <p className="text-xs text-muted-foreground mt-2">Signed by: {report.clientSignatory}</p>
              )}
              {report.signedAt && (
                <p className="text-xs text-muted-foreground">Date: {new Date(report.signedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {/* Photos */}
        {report.photos && report.photos.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Photos</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.photos.filter((photo): photo is NonNullable<typeof photo> => photo !== null).map((photo) => (
                <a key={photo.id} href={photo.fileUrl} target="_blank" rel="noopener noreferrer" className="block group">
                  <div className="aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                    <img src={photo.fileUrl} alt={photo.fileName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate group-hover:underline">{photo.fileName}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
