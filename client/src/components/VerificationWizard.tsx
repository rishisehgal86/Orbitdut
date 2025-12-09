import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { LegalDocumentModal } from "@/components/LegalDocumentModal";
import { type LegalDocumentType } from "@/lib/legalTemplates";

interface RegionalOffice {
  city: string;
  country: string;
  address: string;
}

interface CompanyProfileData {
  companyName: string;
  registrationNumber: string;
  yearFounded: number | undefined;
  headquarters: string;
  regionalOffices: RegionalOffice[];
  ownershipStructure: "private" | "group" | "subsidiary";
  parentCompany: string;
  missionStatement: string;
  coreValues: string;
  companyOverview: string;
  numberOfEmployees: number | undefined;
  annualRevenue: number | undefined;
  websiteUrl: string;
  linkedInUrl: string;
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

interface DocumentUpload {
  type: string;
  file: File | null;
  fileName?: string;
  fileData?: string; // base64 data for localStorage persistence
  mimeType?: string;
  fileSize?: number;
  expiryDate?: string;
  uploaded: boolean;
}

const STEPS = [
  { id: 1, title: "Company Profile", description: "Tell us about your company" },
  { id: 2, title: "Insurance Certificates", description: "Upload insurance documents (recommended)" },
  { id: 3, title: "Legal Agreements", description: "Review and sign required legal documents" },
  { id: 4, title: "Optional Documents", description: "Additional certifications (optional)" },
  { id: 5, title: "Review & Submit", description: "Review and submit for approval" },
];

const STORAGE_KEY = "verification_wizard_data";

export function VerificationWizard() {
  const { toast } = useToast();
  
  // Load from localStorage on mount
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).currentStep || 1 : 1;
  });
  const [profileData, setProfileData] = useState<CompanyProfileData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.profileData) return parsed.profileData;
    }
    return {
      companyName: "",
      registrationNumber: "",
      yearFounded: undefined,
      headquarters: "",
      regionalOffices: [],
      ownershipStructure: "private",
      parentCompany: "",
      missionStatement: "",
      coreValues: "",
      companyOverview: "",
      numberOfEmployees: undefined,
      annualRevenue: undefined,
      websiteUrl: "",
      linkedInUrl: "",
      primaryContactName: "",
      primaryContactTitle: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
    };
  });

  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.documents) return parsed.documents;
    }
    return {
      insurance_liability: { type: "insurance_liability", file: null, uploaded: false },
      insurance_indemnity: { type: "insurance_indemnity", file: null, uploaded: false },
      insurance_workers_comp: { type: "insurance_workers_comp", file: null, uploaded: false },
      dpa_signed: { type: "dpa_signed", file: null, uploaded: false },
      nda_signed: { type: "nda_signed", file: null, uploaded: false },
      non_compete_signed: { type: "non_compete_signed", file: null, uploaded: false },
      security_compliance: { type: "security_compliance", file: null, uploaded: false },
      engineer_vetting_policy: { type: "engineer_vetting_policy", file: null, uploaded: false },
    };
  });

  // E-signature state for legal documents
  const [signedDocuments, setSignedDocuments] = useState<Record<string, { signed: boolean; signatureData?: string; title?: string; signedAt?: string; fileUrl?: string }>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.signedDocuments) return parsed.signedDocuments;
    }
    return {
      dpa_signed: { signed: false },
      nda_signed: { signed: false },
      non_compete_signed: { signed: false },
    };
  });

  // Fetch supplier profile to pre-populate form
  const { data: supplierProfile } = trpc.suppliers.getProfile.useQuery();
  
  // Fetch verification status to determine current step
  const { data: verificationStatus } = trpc.verification.getStatus.useQuery();

  const submitProfileMutation = trpc.verification.submitCompanyProfile.useMutation();
  const uploadDocumentMutation = trpc.verification.uploadDocument.useMutation();
  const submitForReviewMutation = trpc.verification.submitForReview.useMutation();

  // Pre-populate form when supplier profile loads (only if not already filled from localStorage)
  useEffect(() => {
    if (supplierProfile) {
      setProfileData((prev) => {
        // Only pre-fill if fields are empty (don't override localStorage data)
        if (!prev.companyName && !prev.primaryContactEmail) {
          return {
            ...prev,
            companyName: supplierProfile.companyName || "",
            primaryContactName: supplierProfile.userName || "",
            primaryContactEmail: supplierProfile.contactEmail || "",
            primaryContactPhone: supplierProfile.contactPhone || "",
          };
        }
        return prev;
      });
    }
  }, [supplierProfile]);

  // Auto-advance to correct step based on verification status from database
  useEffect(() => {
    if (!verificationStatus) return;

    // Calculate which step user should be on based on completed work
    let targetStep = 1;

    // Step 1: Company Profile
    if (verificationStatus.profile) {
      targetStep = 2;

      // Step 2: Insurance Certificates (check if any insurance docs uploaded)
      const insuranceDocs = verificationStatus.documents?.filter(d => 
        d.documentType.startsWith('insurance_')
      ) || [];
      if (insuranceDocs.length > 0) {
        targetStep = 3;

        // Step 3: Legal Agreements (check if all 3 legal docs signed)
        const legalDocs = verificationStatus.documents?.filter(d => 
          ['dpa_signed', 'nda_signed', 'non_compete_signed'].includes(d.documentType)
        ) || [];
        if (legalDocs.length === 3) {
          targetStep = 4;

          // Step 4: Optional Documents (check if any optional docs uploaded)
          const optionalDocs = verificationStatus.documents?.filter(d => 
            ['security_compliance', 'engineer_vetting_policy'].includes(d.documentType)
          ) || [];
          if (optionalDocs.length > 0) {
            targetStep = 5; // Review & Submit
          }
        }
      }
    }

    // Only auto-advance, never go backwards (user might be reviewing earlier steps)
    if (targetStep > currentStep) {
      setCurrentStep(targetStep);
    }
  }, [verificationStatus]);

  // Track if we've loaded data from database to avoid overwriting user edits
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load documents and profile from database when verificationStatus loads
  useEffect(() => {
    if (!verificationStatus || hasLoadedFromDb) return;

    // Load company profile from database
    if (verificationStatus.profile) {
      const profile = verificationStatus.profile;
      setProfileData({
        companyName: profile.companyName || "",
        registrationNumber: profile.registrationNumber || "",
        yearFounded: profile.yearFounded || undefined,
        headquarters: profile.headquarters || "",
        regionalOffices: (profile.regionalOffices as RegionalOffice[]) || [],
        ownershipStructure: (profile.ownershipStructure as "private" | "group" | "subsidiary") || "private",
        parentCompany: profile.parentCompany || "",
        missionStatement: profile.missionStatement || "",
        coreValues: profile.coreValues || "",
        companyOverview: profile.companyOverview || "",
        numberOfEmployees: profile.numberOfEmployees || undefined,
        annualRevenue: profile.annualRevenue || undefined,
        websiteUrl: profile.websiteUrl || "",
        linkedInUrl: profile.linkedInUrl || "",
        primaryContactName: profile.primaryContactName || "",
        primaryContactTitle: profile.primaryContactTitle || "",
        primaryContactEmail: profile.primaryContactEmail || "",
        primaryContactPhone: profile.primaryContactPhone || "",
      });
    }

    // Load uploaded documents from database
    if (verificationStatus.documents && verificationStatus.documents.length > 0) {
      const updatedDocs: Record<string, DocumentUpload> = { ...documents };
      const updatedSignedDocs: Record<string, any> = { ...signedDocuments };

      verificationStatus.documents.forEach((doc) => {
        const docType = doc.documentType;
        
        // Update regular documents
        if (updatedDocs[docType]) {
          updatedDocs[docType] = {
            ...updatedDocs[docType],
            fileName: doc.documentName,
            fileUrl: doc.fileUrl,
            mimeType: doc.mimeType,
            fileSize: doc.fileSize,
            uploaded: true,
          };
        }

        // Update signed legal documents
        if (['dpa_signed', 'nda_signed', 'non_compete_signed'].includes(docType)) {
          updatedSignedDocs[docType] = {
            signed: true,
            fileUrl: doc.fileUrl,
            signedAt: new Date(doc.uploadedAt).toLocaleDateString("en-GB"),
            title: doc.documentName,
          };
        }
      });

      setDocuments(updatedDocs);
      setSignedDocuments(updatedSignedDocs);
    }

    // Mark as loaded to prevent overwriting user's current edits
    setHasLoadedFromDb(true);
  }, [verificationStatus, hasLoadedFromDb]);

  // Save to localStorage whenever data changes (exclude documents with file data to avoid quota)
  useEffect(() => {
    try {
      // Create a version of documents without file data for localStorage
      const documentsMetadata = Object.fromEntries(
        Object.entries(documents).map(([key, doc]) => [
          key,
          {
            type: doc.type,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            uploaded: doc.uploaded,
            expiryDate: doc.expiryDate,
          }
        ])
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStep,
        profileData,
        signedDocuments,
        documents: documentsMetadata,
      }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [currentStep, profileData, signedDocuments, documents]);

  const handleProfileChange = (field: keyof CompanyProfileData, value: any) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (docType: string, file: File) => {
    // Immediately upload to S3
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      try {
        // Upload to backend which stores in S3
        const result = await uploadDocumentMutation.mutateAsync({
          documentType: docType as any,
          documentName: file.name,
          fileData: base64,
          mimeType: file.type,
          fileSize: file.size,
        });

        setDocuments((prev) => ({
          ...prev,
          [docType]: { 
            ...prev[docType], 
            file,
            fileName: file.name,
            fileUrl: result.fileUrl,
            mimeType: file.type,
            fileSize: file.size,
            uploaded: true // Immediately mark as uploaded
          },
        }));

        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded.`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload document. Please try again.",
          variant: "destructive",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // handleFileUpload removed - files now upload immediately on selection

  const handleSign = async (docType: string, signatureData: string, title: string) => {
    const signedAt = new Date().toLocaleDateString("en-GB");
    
    try {
      // Convert signature data URL to file
      const response = await fetch(signatureData);
      const blob = await response.blob();
      const file = new File([blob], `${docType}_signature.png`, { type: "image/png" });
      
      // Convert to base64 for upload
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        try {
          // Upload signature to S3
          const result = await uploadDocumentMutation.mutateAsync({
            documentType: docType,
            documentName: `${docType}_signature.png`,
            fileData: base64Data,
            mimeType: "image/png",
            fileSize: file.size,
          });
          
          // Update state with signature
          setSignedDocuments((prev) => ({
            ...prev,
            [docType]: {
              signed: true,
              signatureData,
              title,
              signedAt,
              fileUrl: result.fileUrl,
            },
          }));

          toast({
            title: "Document signed",
            description: "Your signature has been saved.",
          });
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "Failed to save signature. Please try again.",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast({
        title: "Signature error",
        description: "Failed to process signature. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate and save company profile
      if (!profileData.companyName || !profileData.ownershipStructure) {
        toast({
          title: "Required fields missing",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      try {
        await submitProfileMutation.mutateAsync(profileData);
        toast({
          title: "Profile saved",
          description: "Your company profile has been saved.",
        });
        setCurrentStep(2);
      } catch (error) {
        toast({
          title: "Save failed",
          description: "Failed to save profile. Please try again.",
          variant: "destructive",
        });
      }
    } else if (currentStep === 2) {
      // Insurance documents are optional (recommended but not required)
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Legal agreements are MANDATORY - all 3 must be signed
      const requiredLegal = ["dpa_signed", "nda_signed", "non_compete_signed"];
      const allSigned = requiredLegal.every((type) => signedDocuments[type]?.signed);
      
      if (!allSigned) {
        toast({
          title: "Signatures required",
          description: "Please sign all three legal agreements to proceed.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Optional documents, can skip
      setCurrentStep(5);
    }
  };

  const handleSubmit = async () => {
    try {
      await submitForReviewMutation.mutateAsync();
      setIsSubmitted(true);
      toast({
        title: "Submitted for review",
        description: "Your verification has been submitted. We'll review it shortly.",
      });
      // Clear localStorage after successful submission
      localStorage.removeItem(STORAGE_KEY);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show success screen if submitted
  if (isSubmitted) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="mb-6">
                <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Verification Submitted!</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Thank you for completing your supplier verification. Our team will review your submission and get back to you within 2-3 business days.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="font-semibold text-lg mb-3">What happens next?</h3>
                <ul className="text-left space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>Our verification team will review your company profile and documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>We may contact you if additional information is needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>You'll receive an email notification once your verification is approved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>After approval, you can start receiving and accepting job requests</span>
                  </li>
                </ul>
              </div>
              <Button size="lg" onClick={() => window.location.href = '/supplier/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Verification</h1>
          <p className="text-muted-foreground mt-1">Complete your verification to start accepting jobs</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/supplier/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center" style={{ minWidth: '100px' }}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0 ${
                    currentStep >= step.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.id}
                </div>
                <div className="text-center mt-2 px-1">
                  <div className="text-sm font-medium whitespace-nowrap">{step.title}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex items-center pt-5 flex-1 min-w-[40px]">
                  <div
                    className={`h-1 w-full ${
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <CompanyProfileForm data={profileData} onChange={handleProfileChange} />
          )}
          {currentStep === 2 && (
            <InsuranceDocumentsForm
              documents={documents}
              onFileSelect={handleFileSelect}
            />
          )}
          {currentStep === 3 && (
            <LegalAgreementsForm
              supplierName={profileData.companyName || "Your Company"}
              contactName={profileData.primaryContactName || "Authorized Signatory"}
              signedDocuments={signedDocuments}
              onSign={handleSign}
            />
          )}
          {currentStep === 4 && (
            <OptionalDocumentsForm
              documents={documents}
              onFileSelect={handleFileSelect}
            />
          )}
          {currentStep === 5 && (
            <ReviewStep profileData={profileData} documents={documents} signedDocuments={signedDocuments} />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < 5 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitForReviewMutation.isPending}>
                {submitForReviewMutation.isPending ? "Submitting..." : "Submit for Review"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 1: Company Profile Form
function CompanyProfileForm({
  data,
  onChange,
}: {
  data: CompanyProfileData;
  onChange: (field: keyof CompanyProfileData, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => onChange("companyName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            value={data.registrationNumber}
            onChange={(e) => onChange("registrationNumber", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearFounded">Year Founded</Label>
          <Input
            id="yearFounded"
            type="number"
            value={data.yearFounded || ""}
            onChange={(e) => onChange("yearFounded", parseInt(e.target.value) || undefined)}
          />
        </div>
        <div>
          <Label htmlFor="ownershipStructure">Ownership Structure *</Label>
          <Select
            value={data.ownershipStructure}
            onValueChange={(value) => onChange("ownershipStructure", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="subsidiary">Subsidiary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.ownershipStructure === "subsidiary" && (
        <div>
          <Label htmlFor="parentCompany">Parent Company</Label>
          <Input
            id="parentCompany"
            value={data.parentCompany}
            onChange={(e) => onChange("parentCompany", e.target.value)}
          />
        </div>
      )}

      <div>
        <Label htmlFor="headquarters">Headquarters Address</Label>
        <Textarea
          id="headquarters"
          value={data.headquarters}
          onChange={(e) => onChange("headquarters", e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="companyOverview">Company Overview *</Label>
        <Textarea
          id="companyOverview"
          value={data.companyOverview}
          onChange={(e) => onChange("companyOverview", e.target.value)}
          placeholder="What does your company do?"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="missionStatement">Mission Statement</Label>
        <Textarea
          id="missionStatement"
          value={data.missionStatement}
          onChange={(e) => onChange("missionStatement", e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="coreValues">Core Values</Label>
        <Textarea
          id="coreValues"
          value={data.coreValues}
          onChange={(e) => onChange("coreValues", e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            type="url"
            value={data.websiteUrl}
            onChange={(e) => onChange("websiteUrl", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="linkedInUrl">LinkedIn URL</Label>
          <Input
            id="linkedInUrl"
            type="url"
            value={data.linkedInUrl}
            onChange={(e) => onChange("linkedInUrl", e.target.value)}
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-4">Primary Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryContactName">Name</Label>
            <Input
              id="primaryContactName"
              value={data.primaryContactName}
              onChange={(e) => onChange("primaryContactName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="primaryContactTitle">Title</Label>
            <Input
              id="primaryContactTitle"
              value={data.primaryContactTitle}
              onChange={(e) => onChange("primaryContactTitle", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="primaryContactEmail">Email</Label>
            <Input
              id="primaryContactEmail"
              type="email"
              value={data.primaryContactEmail}
              onChange={(e) => onChange("primaryContactEmail", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="primaryContactPhone">Phone</Label>
            <Input
              id="primaryContactPhone"
              type="tel"
              value={data.primaryContactPhone}
              onChange={(e) => onChange("primaryContactPhone", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Insurance Documents
function InsuranceDocumentsForm({
  documents,
  onFileSelect,
}: {
  documents: Record<string, DocumentUpload>;
  onFileSelect: (type: string, file: File) => void;
}) {
  const insuranceDocs = [
    { type: "insurance_liability", label: "Public Liability Insurance" },
    { type: "insurance_indemnity", label: "Professional Indemnity Insurance" },
    { type: "insurance_workers_comp", label: "Workers' Compensation Insurance" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Insurance Requirements</p>
            <p>Please upload valid insurance certificates. Make sure to include expiry dates.</p>
          </div>
        </div>
      </div>

      {insuranceDocs.map((doc) => (
        <DocumentUploadField
          key={doc.type}
          label={doc.label}
          document={documents[doc.type]}
          onFileSelect={(file) => onFileSelect(doc.type, file)}
          requiresExpiry
        />
      ))}
    </div>
  );
}

// Step 3: Legal Agreements (E-Signature)
function LegalAgreementsForm({
  supplierName,
  contactName,
  signedDocuments,
  onSign,
}: {
  supplierName: string;
  contactName: string;
  signedDocuments: Record<string, { signed: boolean; signatureData?: string; title?: string; signedAt?: string }>;
  onSign: (docType: string, signatureData: string, title: string) => void;
}) {
  const [openModal, setOpenModal] = useState<LegalDocumentType | null>(null);

  const legalDocs = [
    { type: "dpa" as LegalDocumentType, dbType: "dpa_signed", label: "Data Processing Agreement (DPA)" },
    { type: "nda" as LegalDocumentType, dbType: "nda_signed", label: "Non-Disclosure Agreement (NDA)" },
    { type: "nonCompete" as LegalDocumentType, dbType: "non_compete_signed", label: "Non-Compete Agreement" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Legal Agreements (Mandatory)</p>
            <p>Review each agreement and provide your digital signature. All three agreements must be signed to proceed.</p>
          </div>
        </div>
      </div>

      {legalDocs.map((doc) => {
        const isSigned = signedDocuments[doc.dbType]?.signed;
        return (
          <div key={doc.type} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">{doc.label}</Label>
                {isSigned && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Signed on {signedDocuments[doc.dbType].signedAt} by {signedDocuments[doc.dbType].title}
                  </p>
                )}
              </div>
              <Button
                variant={isSigned ? "outline" : "default"}
                onClick={() => setOpenModal(doc.type)}
              >
                {isSigned ? "View Signed Document" : "Review & Sign"}
              </Button>
            </div>
          </div>
        );
      })}

      {legalDocs.map((doc) => (
        <LegalDocumentModal
          key={doc.type}
          open={openModal === doc.type}
          onClose={() => setOpenModal(null)}
          documentType={doc.type}
          supplierName={supplierName}
          contactName={contactName}
          onSign={(signatureData, title) => onSign(doc.dbType, signatureData, title)}
        />
      ))}
    </div>
  );
}

// Step 4: Optional Documents
function OptionalDocumentsForm({
  documents,
  onFileSelect,
}: {
  documents: Record<string, DocumentUpload>;
  onFileSelect: (type: string, file: File) => void;
}) {
  const optionalDocs = [
    { type: "security_compliance", label: "Security Compliance Certificates (ISO 27001, SOC 2, etc.)" },
    { type: "engineer_vetting_policy", label: "Engineer Vetting Policy" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          These documents are optional but help strengthen your application.
        </p>
      </div>

      {optionalDocs.map((doc) => (
        <DocumentUploadField
          key={doc.type}
          label={doc.label}
          document={documents[doc.type]}
          onFileSelect={(file) => onFileSelect(doc.type, file)}
        />
      ))}
    </div>
  );
}

// Step 5: Review
function ReviewStep({
  profileData,
  documents,
  signedDocuments,
}: {
  profileData: CompanyProfileData;
  documents: Record<string, DocumentUpload>;
  signedDocuments: Record<string, { signed: boolean; signatureData?: string; title?: string; signedAt?: string }>;
}) {
  const insuranceDocs = Object.entries(documents).filter(([key]) => key.startsWith('insurance_'));
  const optionalDocs = Object.entries(documents).filter(([key]) => key.startsWith('security_') || key.startsWith('engineer_'));
  const signedDocs = Object.entries(signedDocuments).filter(([_, doc]) => doc.signed);

  return (
    <div className="space-y-6">
      {/* Company Profile Summary */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Company Profile</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Company Name:</span> {profileData.companyName}</p>
              <p><span className="font-medium">Registration Number:</span> {profileData.registrationNumber}</p>
              <p><span className="font-medium">Year Founded:</span> {profileData.yearFounded || "Not provided"}</p>
              <p><span className="font-medium">Headquarters:</span> {profileData.headquarters}</p>
              <p><span className="font-medium">Ownership Structure:</span> {profileData.ownershipStructure}</p>
            </div>
            <div>
              <p><span className="font-medium">Number of Employees:</span> {profileData.numberOfEmployees || "Not provided"}</p>
              <p><span className="font-medium">Website:</span> {profileData.websiteUrl || "Not provided"}</p>
              <p><span className="font-medium">LinkedIn:</span> {profileData.linkedInUrl || "Not provided"}</p>
              <p><span className="font-medium">Primary Contact:</span> {profileData.primaryContactName}</p>
              <p><span className="font-medium">Contact Email:</span> {profileData.primaryContactEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Certificates */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Insurance Certificates</h3>
        <div className="space-y-2">
          {insuranceDocs.map(([key, doc]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {doc.uploaded ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={doc.uploaded ? "text-gray-900" : "text-gray-400"}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {doc.uploaded && doc.fileName ? `: ${doc.fileName}` : " (Not uploaded)"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Agreements */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Legal Agreements</h3>
        <div className="space-y-2">
          {signedDocs.map(([type, doc]) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Signed on {doc.signedAt} by {doc.title}
              </span>
            </div>
          ))}
          {signedDocs.length === 0 && (
            <p className="text-sm text-gray-400">No legal agreements signed yet</p>
          )}
        </div>
      </div>

      {/* Optional Documents */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Optional Documents</h3>
        <div className="space-y-2">
          {optionalDocs.map(([key, doc]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {doc.uploaded ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={doc.uploaded ? "text-gray-900" : "text-gray-400"}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {doc.uploaded && doc.fileName ? `: ${doc.fileName}` : " (Not uploaded)"}
              </span>
            </div>
          ))}
          {optionalDocs.filter(([_, doc]) => doc.uploaded).length === 0 && (
            <p className="text-sm text-gray-400">No optional documents uploaded</p>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          By submitting, you confirm that all information provided is accurate and complete.
        </p>
      </div>
    </div>
  );
}

// Reusable Document Upload Field
function DocumentUploadField({
  label,
  document,
  onFileSelect,
  requiresExpiry = false,
}: {
  label: string;
  document: DocumentUpload;
  onFileSelect: (file: File) => void;
  requiresExpiry?: boolean;
}) {
  return (
    <div className="border rounded-lg p-4">
      {label && <Label className="mb-2 block">{label}</Label>}
      {document.uploaded ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <span className="text-sm font-medium">Uploaded: {document.fileName}</span>
              {document.fileUrl && (
                <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-2">
                  View
                </a>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Allow re-upload by creating a file input
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.jpg,.jpeg,.png';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
              };
              input.click();
            }}
          >
            Replace
          </Button>
        </div>
      ) : (
        <Input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
      )}
    </div>
  );
}
