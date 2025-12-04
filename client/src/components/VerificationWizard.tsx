import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  expiryDate?: string;
  uploaded: boolean;
}

const STEPS = [
  { id: 1, title: "Company Profile", description: "Tell us about your company" },
  { id: 2, title: "Insurance Certificates", description: "Upload required insurance documents" },
  { id: 3, title: "Legal Agreements", description: "Sign and upload legal documents" },
  { id: 4, title: "Optional Documents", description: "Additional certifications (optional)" },
  { id: 5, title: "Review & Submit", description: "Review and submit for approval" },
];

export function VerificationWizard() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<CompanyProfileData>({
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
  });

  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    insurance_liability: { type: "insurance_liability", file: null, uploaded: false },
    insurance_indemnity: { type: "insurance_indemnity", file: null, uploaded: false },
    insurance_workers_comp: { type: "insurance_workers_comp", file: null, uploaded: false },
    dpa_signed: { type: "dpa_signed", file: null, uploaded: false },
    nda_signed: { type: "nda_signed", file: null, uploaded: false },
    non_compete_signed: { type: "non_compete_signed", file: null, uploaded: false },
    security_compliance: { type: "security_compliance", file: null, uploaded: false },
    engineer_vetting_policy: { type: "engineer_vetting_policy", file: null, uploaded: false },
  });

  const submitProfileMutation = trpc.verification.submitCompanyProfile.useMutation();
  const uploadDocumentMutation = trpc.verification.uploadDocument.useMutation();
  const submitForReviewMutation = trpc.verification.submitForReview.useMutation();

  const handleProfileChange = (field: keyof CompanyProfileData, value: any) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (docType: string, file: File) => {
    setDocuments((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], file },
    }));
  };

  const handleFileUpload = async (docType: string) => {
    const doc = documents[docType];
    if (!doc.file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        await uploadDocumentMutation.mutateAsync({
          documentType: docType as any,
          documentName: doc.file!.name,
          fileData: base64,
          mimeType: doc.file!.type,
          fileSize: doc.file!.size,
          expiryDate: doc.expiryDate,
        });

        setDocuments((prev) => ({
          ...prev,
          [docType]: { ...prev[docType], uploaded: true },
        }));

        toast({
          title: "Document uploaded",
          description: "Your document has been uploaded successfully.",
        });
      };
      reader.readAsDataURL(doc.file);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
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
      // Check insurance documents uploaded
      const requiredInsurance = ["insurance_liability", "insurance_indemnity", "insurance_workers_comp"];
      const allUploaded = requiredInsurance.every((type) => documents[type].uploaded);
      
      if (!allUploaded) {
        toast({
          title: "Documents required",
          description: "Please upload all insurance certificates.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Check legal agreements uploaded
      const requiredLegal = ["dpa_signed", "nda_signed", "non_compete_signed"];
      const allUploaded = requiredLegal.every((type) => documents[type].uploaded);
      
      if (!allUploaded) {
        toast({
          title: "Documents required",
          description: "Please upload all signed legal agreements.",
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
      toast({
        title: "Submitted for review",
        description: "Your verification has been submitted. We'll review it shortly.",
      });
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.id}
                </div>
                <div className="text-center mt-2">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
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
              onUpload={handleFileUpload}
            />
          )}
          {currentStep === 3 && (
            <LegalAgreementsForm
              documents={documents}
              onFileSelect={handleFileSelect}
              onUpload={handleFileUpload}
            />
          )}
          {currentStep === 4 && (
            <OptionalDocumentsForm
              documents={documents}
              onFileSelect={handleFileSelect}
              onUpload={handleFileUpload}
            />
          )}
          {currentStep === 5 && (
            <ReviewStep profileData={profileData} documents={documents} />
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
  onUpload,
}: {
  documents: Record<string, DocumentUpload>;
  onFileSelect: (type: string, file: File) => void;
  onUpload: (type: string) => void;
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
          onUpload={() => onUpload(doc.type)}
          requiresExpiry
        />
      ))}
    </div>
  );
}

// Step 3: Legal Agreements
function LegalAgreementsForm({
  documents,
  onFileSelect,
  onUpload,
}: {
  documents: Record<string, DocumentUpload>;
  onFileSelect: (type: string, file: File) => void;
  onUpload: (type: string) => void;
}) {
  const legalDocs = [
    { type: "dpa_signed", label: "Data Processing Agreement (DPA)", template: true },
    { type: "nda_signed", label: "Non-Disclosure Agreement (NDA)", template: true },
    { type: "non_compete_signed", label: "Non-Compete Agreement", template: true },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Legal Agreements</p>
            <p>Download each template, sign it, and upload the signed copy.</p>
          </div>
        </div>
      </div>

      {legalDocs.map((doc) => (
        <div key={doc.type} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{doc.label}</Label>
            {doc.template && (
              <Button variant="outline" size="sm">
                Download Template
              </Button>
            )}
          </div>
          <DocumentUploadField
            label=""
            document={documents[doc.type]}
            onFileSelect={(file) => onFileSelect(doc.type, file)}
            onUpload={() => onUpload(doc.type)}
          />
        </div>
      ))}
    </div>
  );
}

// Step 4: Optional Documents
function OptionalDocumentsForm({
  documents,
  onFileSelect,
  onUpload,
}: {
  documents: Record<string, DocumentUpload>;
  onFileSelect: (type: string, file: File) => void;
  onUpload: (type: string) => void;
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
          onUpload={() => onUpload(doc.type)}
        />
      ))}
    </div>
  );
}

// Step 5: Review
function ReviewStep({
  profileData,
  documents,
}: {
  profileData: CompanyProfileData;
  documents: Record<string, DocumentUpload>;
}) {
  const uploadedDocs = Object.values(documents).filter((doc) => doc.uploaded);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Company Profile</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <p><span className="font-medium">Company:</span> {profileData.companyName}</p>
          <p><span className="font-medium">Ownership:</span> {profileData.ownershipStructure}</p>
          <p><span className="font-medium">Website:</span> {profileData.websiteUrl || "Not provided"}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Uploaded Documents</h3>
        <div className="space-y-2">
          {uploadedDocs.map((doc) => (
            <div key={doc.type} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>{doc.file?.name}</span>
            </div>
          ))}
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
  onUpload,
  requiresExpiry = false,
}: {
  label: string;
  document: DocumentUpload;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  requiresExpiry?: boolean;
}) {
  return (
    <div className="border rounded-lg p-4">
      {label && <Label className="mb-2 block">{label}</Label>}
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
          disabled={document.uploaded}
        />
        {document.file && !document.uploaded && (
          <Button onClick={onUpload} size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        )}
        {document.uploaded && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Uploaded</span>
          </div>
        )}
      </div>
    </div>
  );
}
