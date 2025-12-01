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
