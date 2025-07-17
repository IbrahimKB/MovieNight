import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BellOff,
  Smartphone,
  Mail,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  Info,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NotificationPreferences,
  NotificationType,
  NOTIFICATION_META,
  PushNotificationManager,
  getNotificationPreferences,
  saveNotificationPreferences,
  sendTestNotification,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/lib/notifications";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>("default");
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [testingNotification, setTestingNotification] =
    useState<NotificationType | null>(null);

  const pushManager = PushNotificationManager.getInstance();

  useEffect(() => {
    loadPreferences();
    checkPushStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const checkPushStatus = async () => {
    if (pushManager.isSupported()) {
      setPushPermission(pushManager.getPermissionStatus());
      const subscription = await pushManager.getSubscription();
      setIsPushSubscribed(!!subscription);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      const success = await saveNotificationPreferences(preferences);
      if (success) {
        toast.success("Notification preferences saved!");
      } else {
        toast.error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      await pushManager.subscribe();
      setPushPermission("granted");
      setIsPushSubscribed(true);
      toast.success("Push notifications enabled!");
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      toast.error("Failed to enable push notifications");
    }
  };

  const handleDisablePushNotifications = async () => {
    try {
      await pushManager.unsubscribe();
      setIsPushSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (error) {
      console.error("Failed to disable push notifications:", error);
      toast.error("Failed to disable push notifications");
    }
  };

  const handleTestNotification = async (type: NotificationType) => {
    try {
      setTestingNotification(type);
      await sendTestNotification(type);
      toast.success(`Test notification sent!`);
    } catch (error) {
      console.error("Failed to send test notification:", error);
      toast.error("Failed to send test notification");
    } finally {
      setTestingNotification(null);
    }
  };

  const updatePreference = (
    type: NotificationType,
    field: keyof NotificationPreferences[NotificationType],
    value: any,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const getNotificationsByCategory = () => {
    const categories: Record<string, NotificationType[]> = {};

    Object.entries(NOTIFICATION_META).forEach(([type, meta]) => {
      if (!categories[meta.category]) {
        categories[meta.category] = [];
      }
      categories[meta.category].push(type as NotificationType);
    });

    return categories;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  const categories = getNotificationsByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-responsive-xl font-bold">Notification Settings</h1>
        <p className="text-responsive-sm text-muted-foreground">
          Manage how and when you want to be notified about MovieNight activity.
        </p>
      </div>

      {/* Push Notification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Browser Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                {pushManager.isSupported()
                  ? "Get real-time notifications on this device"
                  : "Not supported in this browser"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {pushPermission === "granted" && isPushSubscribed ? (
                <>
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisablePushNotifications}
                  >
                    Disable
                  </Button>
                </>
              ) : pushPermission === "denied" ? (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Blocked
                </Badge>
              ) : (
                <Button
                  onClick={handleEnablePushNotifications}
                  disabled={!pushManager.isSupported()}
                >
                  Enable Push Notifications
                </Button>
              )}
            </div>
          </div>

          {pushPermission === "denied" && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Push Notifications Blocked</AlertTitle>
              <AlertDescription>
                To enable push notifications, please allow them in your browser
                settings and refresh the page.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Tabs defaultValue="by-category" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-category">By Category</TabsTrigger>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="by-category" className="space-y-4">
          {Object.entries(categories).map(([category, types]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {types.map((type) => (
                  <NotificationPreferenceRow
                    key={type}
                    type={type}
                    preferences={preferences}
                    onUpdate={updatePreference}
                    onTest={handleTestNotification}
                    isTesting={testingNotification === type}
                    pushEnabled={isPushSubscribed}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(NOTIFICATION_META).map((type) => (
                <NotificationPreferenceRow
                  key={type}
                  type={type as NotificationType}
                  preferences={preferences}
                  onUpdate={updatePreference}
                  onTest={handleTestNotification}
                  isTesting={testingNotification === (type as NotificationType)}
                  pushEnabled={isPushSubscribed}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSavePreferences}
          disabled={isSaving}
          size="lg"
          className="min-w-32"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}

interface NotificationPreferenceRowProps {
  type: NotificationType;
  preferences: NotificationPreferences;
  onUpdate: (
    type: NotificationType,
    field: keyof NotificationPreferences[NotificationType],
    value: any,
  ) => void;
  onTest: (type: NotificationType) => void;
  isTesting: boolean;
  pushEnabled: boolean;
}

function NotificationPreferenceRow({
  type,
  preferences,
  onUpdate,
  onTest,
  isTesting,
  pushEnabled,
}: NotificationPreferenceRowProps) {
  const meta = NOTIFICATION_META[type];
  const pref = preferences[type];
  const hasSpecialFields = "reminderHours" in pref || "dayOfWeek" in pref;

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{meta.icon}</span>
            <h4 className="font-medium">{meta.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTest(type)}
            disabled={
              isTesting || !pref.enabled || (!pushEnabled && !pref.email)
            }
          >
            <TestTube className="h-3 w-3 mr-1" />
            Test
          </Button>
          <Switch
            checked={pref.enabled}
            onCheckedChange={(checked) => onUpdate(type, "enabled", checked)}
          />
        </div>
      </div>

      {/* Notification Methods */}
      {pref.enabled && (
        <div className="space-y-3 pl-6 border-l-2 border-muted">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Push</span>
              </div>
              <Switch
                checked={pref.push && pushEnabled}
                onCheckedChange={(checked) => onUpdate(type, "push", checked)}
                disabled={!pushEnabled}
              />
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </div>
              <Switch
                checked={pref.email}
                onCheckedChange={(checked) => onUpdate(type, "email", checked)}
              />
            </div>
          </div>

          {/* Special Fields */}
          {hasSpecialFields && (
            <>
              <Separator />
              <div className="space-y-3">
                {"reminderHours" in pref && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reminder time</span>
                    <Select
                      value={pref.reminderHours.toString()}
                      onValueChange={(value) =>
                        onUpdate(type, "reminderHours", parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                        <SelectItem value="24">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {"dayOfWeek" in pref && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Day of week</span>
                    <Select
                      value={pref.dayOfWeek.toString()}
                      onValueChange={(value) =>
                        onUpdate(type, "dayOfWeek", parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
