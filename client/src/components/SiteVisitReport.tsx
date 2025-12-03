import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, FileText, Image as ImageIcon, Printer } from "lucide-react";
import { jsPDF } from "jspdf";

interface SiteVisitReportData {
  id: number;
  visitDate: Date;
  engineerName: string;
  timeOnsite?: string | null;
  timeLeftSite?: string | null;
  issueFault?: string | null;
  actionsPerformed: string;
  recommendations?: string | null;
  issueResolved: boolean;
  contactAgreed: boolean;
  clientSignatory?: string | null;
  clientSignatureData?: string | null;
  signedAt?: Date | null;
  photos?: Array<{
    id: number;
    fileUrl: string;
    fileName: string;
  }>;
}

interface SiteVisitReportProps {
  report: SiteVisitReportData;
}

export function SiteVisitReport({ report }: SiteVisitReportProps) {
  const handlePrint = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Orbidut Brand Header
    // Blue header bar
    pdf.setFillColor(37, 99, 235); // Orbidut blue (#2563eb)
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    // Orbidut logo/name
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255); // White text
    pdf.text("ORBIDUT", margin, 16);
    
    // Tagline
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Connecting You with Trusted Service Providers", margin, 21);
    
    yPos = 35;
    
    // Report Title
    pdf.setTextColor(0, 0, 0); // Black text
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("Site Visit Report", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Visit Date and Engineer
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Visit Date: ${new Date(report.visitDate).toLocaleString()}`, margin, yPos);
    yPos += 6;
    pdf.text(`Engineer: ${report.engineerName}`, margin, yPos);
    yPos += 10;

    // Time Tracking Section
    if (report.timeOnsite || report.timeLeftSite) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Engineer On-Site Time", margin, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      
      if (report.timeOnsite) {
        pdf.text(`Arrived On Site: ${new Date(report.timeOnsite).toLocaleString()}`, margin + 5, yPos);
        yPos += 5;
        pdf.setFontSize(8);
        pdf.text(`UTC: ${new Date(report.timeOnsite).toUTCString()}`, margin + 5, yPos);
        yPos += 7;
        pdf.setFontSize(10);
      }
      
      if (report.timeLeftSite) {
        pdf.text(`Left Site: ${new Date(report.timeLeftSite).toLocaleString()}`, margin + 5, yPos);
        yPos += 5;
        pdf.setFontSize(8);
        pdf.text(`UTC: ${new Date(report.timeLeftSite).toUTCString()}`, margin + 5, yPos);
        yPos += 7;
        pdf.setFontSize(10);
      }
      
      if (report.timeOnsite && report.timeLeftSite) {
        const start = new Date(report.timeOnsite);
        const end = new Date(report.timeLeftSite);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        pdf.setFont("helvetica", "bold");
        pdf.text(`Total Time On Site: ${hours}h ${minutes}m`, margin + 5, yPos);
        pdf.setFont("helvetica", "normal");
        yPos += 10;
      }
    }

    // Issue/Fault Found
    if (report.issueFault) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Issue/Fault Found", margin, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const issueLines = pdf.splitTextToSize(report.issueFault, pageWidth - 2 * margin);
      pdf.text(issueLines, margin + 5, yPos);
      yPos += issueLines.length * 5 + 5;
    }

    // Actions Performed
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Actions Performed", margin, yPos);
    yPos += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const actionsLines = pdf.splitTextToSize(report.actionsPerformed, pageWidth - 2 * margin);
    pdf.text(actionsLines, margin + 5, yPos);
    yPos += actionsLines.length * 5 + 5;

    // Recommendations
    if (report.recommendations) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Recommendations", margin, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const recLines = pdf.splitTextToSize(report.recommendations, pageWidth - 2 * margin);
      pdf.text(recLines, margin + 5, yPos);
      yPos += recLines.length * 5 + 5;
    }

    // Status
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Issue Resolved: ${report.issueResolved ? "Yes" : "No"}`, margin, yPos);
    yPos += 6;
    pdf.text(`Customer Agreed to Work: ${report.contactAgreed ? "Yes" : "No"}`, margin, yPos);
    yPos += 10;

    // Signature
    if (report.clientSignatureData) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Customer Signature", margin, yPos);
      yPos += 8;
      
      try {
        pdf.addImage(report.clientSignatureData, "PNG", margin, yPos, 60, 20);
        yPos += 25;
      } catch (e) {
        console.error("Error adding signature to PDF:", e);
      }
      
      if (report.clientSignatory) {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Signed by: ${report.clientSignatory}`, margin, yPos);
        yPos += 5;
      }
      if (report.signedAt) {
        pdf.text(`Date: ${new Date(report.signedAt).toLocaleString()}`, margin, yPos);
        yPos += 10;
      }
    }

    // Photos note
    if (report.photos && report.photos.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      pdf.text(`${report.photos.length} photo(s) attached to this report`, margin, yPos);
    }

    // Footer with branding
    const footerY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Generated by Orbidut Marketplace", pageWidth / 2, footerY, { align: "center" });
    pdf.text(`Report ID: ${report.id} | ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY + 4, { align: "center" });
    
    // Save PDF
    pdf.save(`orbidut-site-visit-report-${report.id}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Site Visit Report
          </CardTitle>
          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>
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
              {report.photos.map((photo) => (
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
