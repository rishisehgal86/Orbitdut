import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AssignEngineerDialogProps {
  jobId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AssignEngineerDialog({
  jobId,
  open,
  onOpenChange,
  onSuccess,
}: AssignEngineerDialogProps) {
  const [engineerName, setEngineerName] = useState("");
  const [engineerEmail, setEngineerEmail] = useState("");
  const [engineerPhone, setEngineerPhone] = useState("");

  const assignEngineerMutation = trpc.supplier.assignEngineer.useMutation({
    onSuccess: () => {
      toast.success("Engineer assigned! They have been notified via email.");
      onOpenChange(false);
      setEngineerName("");
      setEngineerEmail("");
      setEngineerPhone("");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Assignment failed: ${error.message}`)
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignEngineerMutation.mutate({
      jobId,
      engineerName,
      engineerEmail,
      engineerPhone: engineerPhone || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Engineer</DialogTitle>
          <DialogDescription>
            Enter the engineer's details. They will receive an email with a link to view and manage the job.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="engineerName">Engineer Name *</Label>
              <Input
                id="engineerName"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="engineerEmail">Engineer Email *</Label>
              <Input
                id="engineerEmail"
                type="email"
                value={engineerEmail}
                onChange={(e) => setEngineerEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="engineerPhone">Engineer Phone</Label>
              <Input
                id="engineerPhone"
                type="tel"
                value={engineerPhone}
                onChange={(e) => setEngineerPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignEngineerMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assignEngineerMutation.isPending}>
              {assignEngineerMutation.isPending ? "Assigning..." : "Assign Engineer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
