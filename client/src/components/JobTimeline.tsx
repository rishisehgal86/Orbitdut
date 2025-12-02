import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CheckCircle2, Navigation, Radio, XCircle, FileText, UserCheck, Send, UserPlus } from "lucide-react";

interface TimelineEvent {
  id: number;
  status: string;
  timestamp: Date;
  notes?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  duration?: number; // Duration in this status (minutes)
}

interface JobTimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
}

export function JobTimeline({ events, currentStatus }: JobTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_supplier_acceptance":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "supplier_accepted":
        return <UserCheck className="h-5 w-5 text-green-600" />;
      case "sent_to_engineer":
        return <Send className="h-5 w-5 text-blue-600" />;
      case "engineer_accepted":
        return <UserPlus className="h-5 w-5 text-green-600" />;
      case "assigned_to_supplier":
        return <Clock className="h-5 w-5" />;
      case "accepted":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "declined":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "en_route":
        return <Navigation className="h-5 w-5 text-blue-600" />;
      case "on_site":
        return <Radio className="h-5 w-5 text-purple-600" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_supplier_acceptance":
        return "bg-amber-100 text-amber-800";
      case "supplier_accepted":
        return "bg-green-100 text-green-800";
      case "sent_to_engineer":
        return "bg-blue-100 text-blue-800";
      case "engineer_accepted":
        return "bg-green-100 text-green-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "en_route":
        return "bg-blue-100 text-blue-800";
      case "on_site":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending_supplier_acceptance: "Awaiting Supplier",
      supplier_accepted: "Supplier Accepted",
      sent_to_engineer: "Sent to Engineer",
      engineer_accepted: "Engineer Accepted",
      assigned_to_supplier: "Supplier Assigned",
      accepted: "Accepted",
      declined: "Declined",
      en_route: "Engineer En Route",
      on_site: "Engineer On Site",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return statusLabels[status] || status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Timeline</CardTitle>
        <CardDescription>Track the progress of this job from start to completion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gray-200" />

          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon circle */}
              <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-white shadow">
                {getStatusIcon(event.status)}
              </div>

              {/* Event content */}
              <div className="flex-1 space-y-2 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(event.status)}>
                    {formatStatus(event.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>

                {event.duration !== undefined && event.duration > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Duration: {formatDuration(event.duration)}</span>
                  </div>
                )}

                {event.latitude && event.longitude && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Location: {parseFloat(event.latitude).toFixed(4)}, {parseFloat(event.longitude).toFixed(4)}
                    </span>
                  </div>
                )}

                {event.notes && (
                  <p className="text-sm text-muted-foreground italic">{event.notes}</p>
                )}
              </div>
            </div>
          ))}

          {/* Current status indicator if no events yet */}
          {events.length === 0 && (
            <div className="relative flex gap-4">
              <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-white shadow">
                {getStatusIcon(currentStatus)}
              </div>
              <div className="flex-1 space-y-2">
                <Badge className={getStatusColor(currentStatus)}>
                  {formatStatus(currentStatus)}
                </Badge>
                <p className="text-sm text-muted-foreground">No timeline events yet</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
