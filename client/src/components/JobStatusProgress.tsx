import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, UserCheck, Send, UserPlus, Navigation, Radio, CheckCircle2 } from "lucide-react";

interface JobStatusProgressProps {
  currentStatus: string;
}

const WORKFLOW_STEPS = [
  { key: "pending_supplier_acceptance", label: "Awaiting Supplier", icon: Clock },
  { key: "supplier_accepted", label: "Supplier Accepted", icon: UserCheck },
  { key: "sent_to_engineer", label: "Sent to Engineer", icon: Send },
  { key: "engineer_accepted", label: "Engineer Accepted", icon: UserPlus },
  { key: "en_route", label: "En Route", icon: Navigation },
  { key: "on_site", label: "On Site", icon: Radio },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

export function JobStatusProgress({ currentStatus }: JobStatusProgressProps) {
  const currentStepIndex = WORKFLOW_STEPS.findIndex((step) => step.key === currentStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Status</CardTitle>
        <CardDescription>Current progress in the workflow</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress Bar */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: currentStepIndex >= 0 
                  ? `${(currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}%`
                  : '0%',
              }}
            />
          </div>

          {/* Status Steps */}
          <div className="relative flex justify-between">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                    } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                      isCompleted ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
