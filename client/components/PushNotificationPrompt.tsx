import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, X, Smartphone, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationPrompt } from "@/hooks/usePushNotifications";

export default function PushNotificationPrompt() {
  const { shouldPrompt, subscribe, dismissPrompt, isLoading } =
    useNotificationPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (shouldPrompt && !hasInteracted) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [shouldPrompt, hasInteracted]);

  const handleEnable = async () => {
    setHasInteracted(true);
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setHasInteracted(true);
    setIsVisible(false);
    dismissPrompt();
  };

  const handleNotNow = () => {
    setHasInteracted(true);
    setIsVisible(false);
    // Don't call dismissPrompt() so it can show again later
  };

  if (!isVisible || !shouldPrompt) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Prompt */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 z-50 safe-area-pb">
        <Card className="mobile-card bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="relative">
                  <BellRing className="h-6 w-6 animate-bounce" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">
                  Stay in the loop! 🎬
                </h3>
                <p className="text-xs opacity-90 leading-relaxed">
                  Get notified when friends suggest movies, plan movie nights,
                  or when your favorite movies become available.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 text-primary font-medium"
                onClick={handleEnable}
                disabled={isLoading}
              >
                {isLoading ? "Enabling..." : "Enable Notifications"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="px-3 text-primary-foreground/80 hover:bg-primary-foreground/20"
                onClick={handleNotNow}
              >
                Not Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 text-primary-foreground/80 hover:bg-primary-foreground/20"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Top Notification */}
      <div className="hidden lg:block fixed top-4 right-4 z-50 max-w-md">
        <Alert className="bg-card border-primary/20 shadow-lg">
          <Bell className="h-4 w-4" />
          <AlertDescription className="pr-8">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Enable Notifications
                </h4>
                <p className="text-xs text-muted-foreground">
                  Stay updated on movie suggestions, friend requests, and movie
                  night invites.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  disabled={isLoading}
                  className="h-7"
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  {isLoading ? "Enabling..." : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNotNow}
                  className="h-7"
                >
                  Not Now
                </Button>
              </div>
            </div>
          </AlertDescription>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      </div>

      {/* Backdrop for mobile */}
      <div
        className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={handleNotNow}
      />
    </>
  );
}

// Alternative compact prompt for less intrusive notification
export function CompactNotificationPrompt() {
  const { shouldPrompt, subscribe, dismissPrompt } = useNotificationPrompt();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (shouldPrompt) {
      const timer = setTimeout(() => setIsVisible(true), 10000); // Show after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [shouldPrompt]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissPrompt();
  };

  if (!isVisible || !shouldPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-card/95 backdrop-blur border-primary/20 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Enable notifications?</p>
              <p className="text-xs text-muted-foreground">
                Get updates on movie activity
              </p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={handleEnable} className="h-7 px-2">
                Enable
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
