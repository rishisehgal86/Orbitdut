import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import SignatureCanvas from "react-signature-canvas";
import { LEGAL_TEMPLATES, type LegalDocumentType } from "@/lib/legalTemplates";
import ReactMarkdown from "react-markdown";

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
    if (!signatureRef.current?.isEmpty() && title.trim()) {
      const signatureData = signatureRef.current.toDataURL();
      onSign(signatureData, title);
      onClose();
    }
  };

  const isSignDisabled = !hasScrolledToBottom || !title.trim() || !hasSignature;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-[95vw] !h-[95vh] !max-w-[95vw] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
          <DialogDescription>
            Please read the entire document and sign at the bottom
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
              <Button onClick={handleSign} disabled={isSignDisabled}>
                Sign Document
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
