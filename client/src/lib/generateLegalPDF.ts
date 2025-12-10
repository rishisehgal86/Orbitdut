import { jsPDF } from "jspdf";
import { LEGAL_TEMPLATES, type LegalDocumentType } from "./legalTemplates";

interface PDFMetadata {
  supplierName: string;
  contactName: string;
  title: string;
  signatureData: string; // base64 image
  signedAt: string; // ISO date string
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate a professional PDF for a signed legal document
 * Returns a Blob that can be uploaded to S3
 */
export async function generateLegalPDF(
  documentType: LegalDocumentType,
  metadata: PDFMetadata
): Promise<Blob> {
  const template = LEGAL_TEMPLATES[documentType];
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header - Orbidut branding
  doc.setFillColor(37, 99, 235); // Blue header
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ORBIDUT", margin, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Field Service Management Platform", margin, 20);

  yPosition = 35;

  // Document title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(template.title, margin, yPosition);
  yPosition += 10;

  // Metadata box
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPosition, contentWidth, 25, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Supplier: ${metadata.supplierName}`, margin + 3, yPosition + 6);
  doc.text(`Signed by: ${metadata.contactName}`, margin + 3, yPosition + 12);
  doc.text(`Title: ${metadata.title}`, margin + 3, yPosition + 18);
  doc.text(
    `Date: ${new Date(metadata.signedAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    margin + 3,
    yPosition + 24
  );
  yPosition += 32;

  // Parse and render document content
  const currentDate = new Date(metadata.signedAt).toLocaleDateString("en-GB");
  const documentContent = template.content
    .replace(/\[Current Date\]/g, currentDate)
    .replace(/\[Supplier Company Name\]/g, metadata.supplierName)
    .replace(/\[Auto-filled from profile\]/g, metadata.contactName)
    .replace(/\[Auto-filled on signature\]/g, currentDate)
    .replace(/\[To be provided\]/g, metadata.title)
    .replace(/\[Digital signature\]/g, "See signature below");

  // Split content into lines and render
  const lines = documentContent.split("\n");
  doc.setFontSize(10);

  for (const line of lines) {
    checkPageBreak(10);

    if (line.startsWith("# ")) {
      // Main heading
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const text = line.replace("# ", "");
      doc.text(text, margin, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    } else if (line.startsWith("## ")) {
      // Section heading
      checkPageBreak(12);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const text = line.replace("## ", "");
      doc.text(text, margin, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
    } else if (line.startsWith("**") && line.endsWith("**")) {
      // Bold text
      doc.setFont("helvetica", "bold");
      const text = line.replace(/\*\*/g, "");
      const wrappedText = doc.splitTextToSize(text, contentWidth);
      doc.text(wrappedText, margin, yPosition);
      yPosition += wrappedText.length * 5;
      doc.setFont("helvetica", "normal");
    } else if (line.startsWith("- ")) {
      // Bullet point
      const text = line.replace("- ", "• ");
      const wrappedText = doc.splitTextToSize(text, contentWidth - 5);
      doc.text(wrappedText, margin + 5, yPosition);
      yPosition += wrappedText.length * 5;
    } else if (line.trim() === "---") {
      // Horizontal rule
      checkPageBreak(5);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
    } else if (line.trim() === "") {
      // Empty line
      yPosition += 3;
    } else {
      // Regular paragraph
      const wrappedText = doc.splitTextToSize(line, contentWidth);
      for (const wrappedLine of wrappedText) {
        checkPageBreak(5);
        doc.text(wrappedLine, margin, yPosition);
        yPosition += 5;
      }
    }
  }

  // Signature section
  checkPageBreak(60);
  yPosition += 10;
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DIGITAL SIGNATURE", margin, yPosition);
  yPosition += 8;

  // Add signature image
  try {
    doc.addImage(metadata.signatureData, "PNG", margin, yPosition, 60, 20);
    yPosition += 25;
  } catch (error) {
    console.error("Failed to add signature image:", error);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("[Signature image could not be rendered]", margin, yPosition);
    yPosition += 10;
  }

  // Signature details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Signed by: ${metadata.contactName}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Title: ${metadata.title}`, margin, yPosition);
  yPosition += 5;
  doc.text(
    `Date: ${new Date(metadata.signedAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    })}`,
    margin,
    yPosition
  );
  yPosition += 5;

  // Technical metadata (if available)
  if (metadata.ipAddress || metadata.userAgent) {
    checkPageBreak(20);
    yPosition += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Technical Verification Details:", margin, yPosition);
    yPosition += 4;
    if (metadata.ipAddress) {
      doc.text(`IP Address: ${metadata.ipAddress}`, margin, yPosition);
      yPosition += 4;
    }
    if (metadata.userAgent) {
      const wrappedUA = doc.splitTextToSize(
        `User Agent: ${metadata.userAgent}`,
        contentWidth
      );
      doc.text(wrappedUA, margin, yPosition);
      yPosition += wrappedUA.length * 4;
    }
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      `Generated by Orbidut Platform - ${new Date().toLocaleDateString("en-GB")}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
  }

  // Return as Blob
  return doc.output("blob");
}
