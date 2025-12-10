import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import SignatureCanvas from "react-signature-canvas";
import { LEGAL_TEMPLATES, type LegalDocumentType } from "@/lib/legalTemplates";
import ReactMarkdown from "react-markdown";
import { FileText, Download } from "lucide-react";
import { generateLegalPDF } from "@/lib/generateLegalPDF";

interface LegalDocumentModalProps {
  open: boolean;
  onClose: () => void;
  documentType: LegalDocumentType;
  supplierName: string;
  contactName: string;
  onSign: (signatureData: string, title: string) => void;
}

export function LegalDocumentModal({
  open,
  onClose,
  documentType,
  supplierName,
  contactName,
  onSign,
}: LegalDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);

  const template = LEGAL_TEMPLATES[documentType];
  const currentDate = new Date().toLocaleDateString("en-GB");

  // Replace placeholders in template
  const documentContent = template.content
    .replace(/\[Current Date\]/g, currentDate)
    .replace(/\[Supplier Company Name\]/g, supplierName)
    .replace(/\[Auto-filled from profile\]/g, contactName)
    .replace(/\[Auto-filled on signature\]/g, currentDate);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
  };

  const handleSign = () => {
    if (!signatureRef.current?.isEmpty() && title.trim() && signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      onSign(signatureData, title);
      onClose();
    }
  };

  const handlePreviewPdf = async () => {
    try {
      const pdfBlob = await generateLegalPDF(documentType, {
        supplierName,
        contactName,
        signatureData: "",
        title: "",
        signedAt: new Date().toISOString(),
      });
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setShowPdfPreview(true);
    } catch (error) {
      console.error("Failed to generate PDF preview:", error);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const pdfBlob = await generateLegalPDF(documentType, {
        supplierName,
        contactName,
        signatureData: signatureRef.current?.toDataURL() || "",
        title,
        signedAt: new Date().toISOString(),
      });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const docName = template.title.toLowerCase().replace(/\s+/g, '-');
      const date = new Date().toISOString().split('T')[0];
      link.download = `orbidut-${docName}-signed-${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  const isSignDisabled = !hasScrolledToBottom || !title.trim() || !hasSignature;

  return (
    <>
      {/* PDF Preview Modal */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="!w-[95vw] !h-[95vh] !max-w-[95vw] flex flex-col">
          <DialogHeader>
            <DialogTitle>PDF Preview - {template.title}</DialogTitle>
            <DialogDescription>
              Preview of the document before signing
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 border rounded-lg overflow-hidden">
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowPdfPreview(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Document Modal */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="!w-[95vw] !h-[95vh] !max-w-[95vw] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>Please read the entire document and sign at the bottom</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewPdf}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Preview PDF
            </Button>
          </DialogDescription>
        </DialogHeader>

        {/* Document Content */}
        <ScrollArea className="flex-1 border rounded-lg p-6 my-4 overflow-y-auto" onScrollCapture={handleScroll}>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{documentContent}</ReactMarkdown>
          </div>
        </ScrollArea>

        {!hasScrolledToBottom && (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            ⚠️ Please scroll to the bottom of the document to continue
          </p>
        )}

        {/* Signature Section */}
        {hasScrolledToBottom && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="title">Your Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Director, CEO, Authorized Signatory"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Digital Signature *</Label>
              <div className="border rounded-lg mt-1 bg-white">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: "w-full h-40 cursor-crosshair",
                  }}
                  backgroundColor="white"
                  onEnd={() => setHasSignature(true)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSignature}
                className="mt-2"
              >
                Clear Signature
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {hasSignature && title.trim() && (
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              )}
              <Button onClick={handleSign} disabled={isSignDisabled}>
                Sign Document
              </Button>
            </div>
          </div>
        )}
        </DialogContent>
      </Dialog>
    </>
  );
}
