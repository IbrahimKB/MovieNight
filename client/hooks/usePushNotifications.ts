import { useState, useEffect, useCallback } from "react";
import {
  PushNotificationManager,
  NotificationPreferences,
  getNotificationPreferences,
  sendTestNotification,
} from "@/lib/notifications";
import { toast } from "sonner";

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

  const pushManager = PushNotificationManager.getInstance();

  const updateState = useCallback((updates: Partial<PushNotificationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Initialize push notification state
  useEffect(() => {
    const initializePushState = async () => {
      try {
        updateState({ isLoading: true, error: null });

        const isSupported = pushManager.isSupported();
        const permission = pushManager.getPermissionStatus();

        let isSubscribed = false;
        if (isSupported && permission === "granted") {
          const subscription = await pushManager.getSubscription();
          isSubscribed = !!subscription;
        }

        updateState({
          isSupported,
          permission,
          isSubscribed,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to initialize push state:", error);
        updateState({
          error: "Failed to initialize push notifications",
          isLoading: false,
        });
      }
    };

    initializePushState();
  }, [pushManager, updateState]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });

      await pushManager.subscribe();

      updateState({
        permission: "granted",
        isSubscribed: true,
        isLoading: false,
      });

      toast.success("Push notifications enabled!");
      return true;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to enable push notifications";

      updateState({
        error: errorMessage,
        isLoading: false,
      });

      toast.error(errorMessage);
      return false;
    }
  }, [pushManager, updateState]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });

      await pushManager.unsubscribe();

      updateState({
        isSubscribed: false,
        isLoading: false,
      });

      toast.success("Push notifications disabled");
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to disable push notifications";

      updateState({
        error: errorMessage,
        isLoading: false,
      });

      toast.error(errorMessage);
      return false;
    }
  }, [pushManager, updateState]);

  // Send test notification
  const sendTest = useCallback(async (type: string): Promise<boolean> => {
    try {
      await sendTestNotification(type as any);
      toast.success("Test notification sent!");
      return true;
    } catch (error) {
      console.error("Failed to send test notification:", error);
      toast.error("Failed to send test notification");
      return false;
    }
  }, []);

  // Request permission without subscribing
  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      try {
        const permission = await pushManager.requestPermission();
        updateState({ permission });
        return permission;
      } catch (error) {
        console.error("Failed to request permission:", error);
        return "denied";
      }
    }, [pushManager, updateState]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTest,
    requestPermission,
  };
}

// Hook for notification preferences
export function useNotificationPreferences() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const prefs = await getNotificationPreferences();
        setPreferences(prefs);
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
        setError("Failed to load preferences");
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences
  const savePreferences = useCallback(
    async (newPreferences: NotificationPreferences): Promise<boolean> => {
      try {
        const response = await fetch("/api/user/notification-preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
          },
          body: JSON.stringify(newPreferences),
        });

        if (response.ok) {
          setPreferences(newPreferences);
          toast.success("Preferences saved!");
          return true;
        } else {
          throw new Error("Failed to save preferences");
        }
      } catch (error) {
        console.error("Failed to save notification preferences:", error);
        toast.error("Failed to save preferences");
        return false;
      }
    },
    [],
  );

  return {
    preferences,
    isLoading,
    error,
    savePreferences,
    setPreferences,
  };
}

// Hook for checking if app should prompt for notifications
export function useNotificationPrompt() {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const pushState = usePushNotifications();

  useEffect(() => {
    // Show prompt if:
    // 1. Push notifications are supported
    // 2. Permission is default (not granted or denied)
    // 3. User hasn't dismissed prompt recently
    const checkShouldPrompt = () => {
      if (!pushState.isSupported) return false;
      if (pushState.permission !== "default") return false;

      // Check if user dismissed prompt recently
      const lastDismissed = localStorage.getItem("push-prompt-dismissed");
      if (lastDismissed) {
        const dismissTime = parseInt(lastDismissed);
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissTime < oneWeek) {
          return false;
        }
      }

      return true;
    };

    setShouldPrompt(checkShouldPrompt());
  }, [pushState.isSupported, pushState.permission]);

  const dismissPrompt = useCallback(() => {
    setShouldPrompt(false);
    localStorage.setItem("push-prompt-dismissed", Date.now().toString());
  }, []);

  return {
    shouldPrompt,
    dismissPrompt,
    ...pushState,
  };
}
