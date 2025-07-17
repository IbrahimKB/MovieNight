import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bell,
  BellOff,
  Smartphone,
  Settings as SettingsIcon,
  TestTube,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
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
import {
  isPWAMode,
  getServiceWorkerRegistration,
  updateServiceWorker,
  clearPWACache,
  getCacheInfo,
} from "@/lib/pwa";
import { toast } from "sonner";

export default function Settings() {
  // Notification state
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>("default");
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [testingNotification, setTestingNotification] =
    useState<NotificationType | null>(null);

  // PWA state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWA, setIsPWA] = useState(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [cacheInfo, setCacheInfo] = useState({
    cacheNames: [] as string[],
    totalSize: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const pushManager = PushNotificationManager.getInstance();

  useEffect(() => {
    loadNotificationPreferences();
    checkPushStatus();
    loadPWAStatus();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      setIsLoadingNotifications(true);
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
      toast.error("Failed to load notification preferences");
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const checkPushStatus = async () => {
    if (pushManager.isSupported()) {
      setPushPermission(pushManager.getPermissionStatus());
      const subscription = await pushManager.getSubscription();
      setIsPushSubscribed(!!subscription);
    }
  };

  const loadPWAStatus = async () => {
    // Check PWA mode
    setIsPWA(isPWAMode());

    // Get service worker registration
    const registration = await getServiceWorkerRegistration();
    setSwRegistration(registration);

    // Get cache info
    const cache = await getCacheInfo();
    setCacheInfo(cache);

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
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

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearPWACache();
      const newCacheInfo = await getCacheInfo();
      setCacheInfo(newCacheInfo);
      toast.success("Cache cleared successfully");
    } catch (error) {
      console.error("Clear cache failed:", error);
      toast.error("Failed to clear cache");
    } finally {
      setIsClearing(false);
    }
  };

  const categories = getNotificationsByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-responsive-xl font-bold">Settings</h1>
        <p className="text-responsive-sm text-muted-foreground">
          Manage your MovieNight preferences and app settings.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            App Status
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {isLoadingNotifications ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Loading preferences...
              </div>
            </div>
          ) : (
            <>
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
                      <p className="text-sm font-medium">
                        Browser Push Notifications
                      </p>
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
                        To enable push notifications, please allow them in your
                        browser settings and refresh the page.
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
                          isTesting={
                            testingNotification === (type as NotificationType)
                          }
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
            </>
          )}
        </TabsContent>

        {/* App Status Tab */}
        <TabsContent value="app" className="space-y-6">
          {/* App Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                App Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isPWA ? "Progressive Web App" : "Browser Tab"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPWA
                      ? "Running as an installed app with enhanced features"
                      : "Running in browser mode"}
                  </p>
                </div>
                <Badge variant={isPWA ? "default" : "outline"}>
                  {isPWA ? "PWA" : "WEB"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Network Status</p>
                  <p className="text-xs text-muted-foreground">
                    {isOnline
                      ? "Connected to the internet"
                      : "Offline - running in cached mode"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <Badge className="bg-green-500">Online</Badge>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">Offline</Badge>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Worker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Service Worker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">
                      {swRegistration
                        ? "Active and handling requests"
                        : "Not registered or inactive"}
                    </p>
                  </div>
                  <Badge variant={swRegistration ? "default" : "outline"}>
                    {swRegistration ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {swRegistration && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Scope
                      </span>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {swRegistration.scope}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cache Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Cache Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Caches
                    </span>
                    <Badge variant="outline">
                      {cacheInfo.cacheNames.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Items</span>
                    <Badge variant="outline">{cacheInfo.totalSize}</Badge>
                  </div>
                </div>
                {cacheInfo.cacheNames.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        Cache Names:
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {cacheInfo.cacheNames.slice(0, 3).map((name, i) => (
                          <div
                            key={i}
                            className="font-mono bg-muted px-2 py-1 rounded mb-1"
                          >
                            {name}
                          </div>
                        ))}
                        {cacheInfo.cacheNames.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{cacheInfo.cacheNames.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>App Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleUpdate}
                  disabled={isUpdating || !swRegistration}
                  className="justify-start"
                >
                  {isUpdating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Update App
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearCache}
                  disabled={isClearing || cacheInfo.cacheNames.length === 0}
                  className="justify-start"
                >
                  {isClearing ? (
                    <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear Cache
                </Button>
              </div>

              {!isOnline && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Offline Mode</AlertTitle>
                  <AlertDescription>
                    You're currently offline. The app is running using cached
                    data and will sync when you're back online.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

  // Early return if preference is not defined
  if (!pref) {
    return null;
  }

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
            disabled={isTesting || !pref?.enabled || !pushEnabled}
          >
            <TestTube className="h-3 w-3 mr-1" />
            Test
          </Button>
          <Switch
            checked={pref?.enabled || false}
            onCheckedChange={(checked) => onUpdate(type, "enabled", checked)}
          />
        </div>
      </div>

      {/* Notification Methods */}
      {pref?.enabled && (
        <div className="space-y-3 pl-6 border-l-2 border-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Push Notifications</span>
            </div>
            <Switch
              checked={pref?.push && pushEnabled}
              onCheckedChange={(checked) => onUpdate(type, "push", checked)}
              disabled={!pushEnabled}
            />
          </div>

          {/* Special Fields */}
          {hasSpecialFields && (
            <>
              <Separator />
              <div className="space-y-3">
                {pref && "reminderHours" in pref && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reminder time</span>
                    <Select
                      value={pref?.reminderHours?.toString() || "1"}
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

                {pref && "dayOfWeek" in pref && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Day of week</span>
                    <Select
                      value={pref?.dayOfWeek?.toString() || "0"}
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
