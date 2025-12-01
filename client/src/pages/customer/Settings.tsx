import { useAuth } from "@/_core/hooks/useAuth";
import CustomerLayout from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Bell, Globe, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

export default function CustomerSettings() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });


  const { data: preferences, isLoading: prefsLoading } = trpc.user.getPreferences.useQuery();
  
  const [settings, setSettings] = useState({
    emailNotifications: 1,
    jobStatusUpdates: 1,
    supplierMessages: 1,
    timezone: "UTC",
    language: "en",
  });

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setSettings({
        emailNotifications: preferences.emailNotifications,
        jobStatusUpdates: preferences.jobStatusUpdates,
        supplierMessages: preferences.supplierMessages,
        timezone: preferences.timezone || "UTC",
        language: preferences.language || "en",
      });
    }
  }, [preferences]);

  const updatePreferencesMutation = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferencesMutation.mutate(settings);
  };

  if (authLoading || prefsLoading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your notification preferences and display settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications === 1}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked ? 1 : 0 })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="jobStatusUpdates">Job Status Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your job status changes
                  </p>
                </div>
                <Switch
                  id="jobStatusUpdates"
                  checked={settings.jobStatusUpdates === 1}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, jobStatusUpdates: checked ? 1 : 0 })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="supplierMessages">Supplier Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for messages from suppliers
                  </p>
                </div>
                <Switch
                  id="supplierMessages"
                  checked={settings.supplierMessages === 1}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, supplierMessages: checked ? 1 : 0 })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Display Preferences</CardTitle>
              </div>
              <CardDescription>
                Customize how information is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) =>
                    setSettings({ ...settings, timezone: value })
                  }
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  All dates and times will be displayed in this timezone
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) =>
                    setSettings({ ...settings, language: value })
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred language (coming soon)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              disabled={updatePreferencesMutation.isPending}
            >
              {updatePreferencesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  );
}
